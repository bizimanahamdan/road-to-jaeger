import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Unit tests cover the parts of Road to Jaeger where a bug would silently
 * corrupt a learner's record: the mastery engine, spaced repetition, the
 * dependency graph, the daily planner, session timing, statistics and the
 * storage layer.
 *
 * `environment: 'node'` on purpose - the engine is pure and must not depend on
 * a DOM. Storage tests run against an in-memory `Table` implementation that
 * satisfies exactly the same contract as the IndexedDB one.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: false,
    restoreMocks: true,
    reporters: ['default'],
  },
});
