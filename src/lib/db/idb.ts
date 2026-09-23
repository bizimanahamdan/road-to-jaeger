/**
 * A very small IndexedDB wrapper.
 *
 * No library: the surface this app needs is six verbs, and every dependency
 * added here has to be parsed on a 2 GB Android phone before the first screen
 * appears. Keys are always supplied by the caller (out-of-line keys), so one
 * wrapper serves every store.
 *
 * When `indexedDB` is unavailable - during server rendering, in Node tests, or in
 * a private-mode browser that refuses storage - the wrapper falls back to an
 * in-memory store with the same semantics. The app still works; it just does not
 * survive a reload, and `storageAvailable()` says so out loud rather than
 * pretending otherwise.
 */

export const DB_NAME = 'road-to-jaeger';
export const DB_VERSION = 1;

export type StoreName =
  | 'settings'
  | 'lessonProgress'
  | 'projectProgress'
  | 'sessions'
  | 'plans'
  | 'notes'
  | 'reminders'
  | 'meta';

export const STORES: StoreName[] = [
  'settings',
  'lessonProgress',
  'projectProgress',
  'sessions',
  'plans',
  'notes',
  'reminders',
  'meta',
];

interface IdbLike {
  open(name: string, version?: number): IDBOpenDBRequest;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
let usingMemory = false;
const memory = new Map<StoreName, Map<string, unknown>>();

function idb(): IdbLike | null {
  if (typeof indexedDB === 'undefined') return null;
  return indexedDB as unknown as IdbLike;
}

export function storageAvailable(): boolean {
  return idb() !== null;
}

/** True when writes are going to memory only and will not survive a reload. */
export function isMemoryOnly(): boolean {
  return usingMemory;
}

function memoryStore(store: StoreName): Map<string, unknown> {
  let m = memory.get(store);
  if (!m) {
    m = new Map();
    memory.set(store, m);
  }
  return m;
}

/** Deep clone, matching IndexedDB's structured-clone boundary. */
function clone<T>(value: T): T {
  // A missing key must stay missing: JSON round-tripping would turn `undefined`
  // into a throw, and a real object store returns undefined for absent keys.
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  const adapter = idb();
  if (!adapter) {
    usingMemory = true;
    dbPromise = Promise.resolve(null);
    return dbPromise;
  }

  dbPromise = new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = adapter.open(DB_NAME, DB_VERSION);
    } catch {
      usingMemory = true;
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // A store added in a later version without a version bump would otherwise
      // throw inside every transaction; recreate instead.
      const missing = STORES.filter((s) => !db.objectStoreNames.contains(s));
      if (missing.length) {
        db.close();
        const nextVersion = db.version + 1;
        const upgrade = adapter.open(DB_NAME, nextVersion);
        upgrade.onupgradeneeded = () => {
          const udb = upgrade.result;
          for (const name of missing) {
            if (!udb.objectStoreNames.contains(name)) udb.createObjectStore(name);
          }
        };
        upgrade.onsuccess = () => resolve(upgrade.result);
        upgrade.onerror = () => {
          usingMemory = true;
          resolve(null);
        };
        return;
      }
      resolve(db);
    };
    request.onerror = () => {
      usingMemory = true;
      resolve(null);
    };
    request.onblocked = () => {
      usingMemory = true;
      resolve(null);
    };
  });
  return dbPromise;
}

function wrap<T>(
  run: (resolve: (value: T) => void, reject: (reason: unknown) => void) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    try {
      run(resolve, reject);
    } catch (err) {
      reject(err);
    }
  });
}

async function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> {
  const db = await openDatabase();
  if (!db) return undefined;
  return wrap<T | undefined>((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = db.transaction(store, mode);
    } catch (err) {
      // Most likely a store missing after a schema change. Falling back to memory
      // keeps the app usable for this session, but it must not be silent: the
      // Settings screen reports that writes are not durable.
      console.warn(`IndexedDB transaction on "${store}" failed; using memory for this call`, err);
      usingMemory = true;
      resolve(undefined);
      return;
    }
    const request = fn(transaction.objectStore(store));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
  });
}

export async function dbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await openDatabase();
  if (!db) return clone(memoryStore(store).get(key) as T | undefined);
  return tx<T>(store, 'readonly', (s) => s.get(key) as IDBRequest<T>);
}

export async function dbGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDatabase();
  if (!db) return [...memoryStore(store).values()].map((v) => clone(v as T));
  const rows = await tx<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);
  return rows ?? [];
}

export async function dbPut<T>(store: StoreName, key: string, value: T): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    memoryStore(store).set(key, clone(value));
    return;
  }
  await tx<IDBValidKey>(store, 'readwrite', (s) => s.put(clone(value), key));
}

/** Writes many records in one transaction - one disk flush instead of N. */
export async function dbPutMany<T>(store: StoreName, entries: [string, T][]): Promise<void> {
  if (!entries.length) return;
  const db = await openDatabase();
  if (!db) {
    const m = memoryStore(store);
    for (const [key, value] of entries) m.set(key, clone(value));
    return;
  }
  await wrap<void>((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite');
    const objectStore = transaction.objectStore(store);
    for (const [key, value] of entries) objectStore.put(clone(value), key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('bulk write failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('bulk write aborted'));
  });
}

export async function dbDelete(store: StoreName, key: string): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    memoryStore(store).delete(key);
    return;
  }
  await tx<undefined>(store, 'readwrite', (s) => s.delete(key) as IDBRequest<undefined>);
}

export async function dbClear(store: StoreName): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    memoryStore(store).clear();
    return;
  }
  await tx<undefined>(store, 'readwrite', (s) => s.clear() as IDBRequest<undefined>);
}

/** Test/utility helper: wipes every store. Never called from app code. */
export async function dbResetAll(): Promise<void> {
  for (const store of STORES) await dbClear(store);
}
