import { R, X, lesson, mcq, numeric, short } from './helpers';
import type { Lesson } from '@/lib/types';

/**
 * SOFTWARE / Data Structures & Algorithms.
 *
 * Selected for robotics relevance, not for interview trivia: ring buffers for
 * sensor streams, hash maps for configuration and lookup, trees for transform
 * hierarchies, graphs and priority queues for path planning.
 */
export const DSA_LESSONS: Lesson[] = [
  lesson({
    id: 'dsa-01',
    subject: 'ds-algo',
    order: 1,
    title: 'Arrays, Linked Lists and Memory Layout',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['prog-05', 'py-02'],
    description: 'Contiguous versus linked storage, cache locality, and the practical cost of each.',
    why: 'Choosing between an array and a linked list is a real performance decision in a control loop. Cache locality often dominates the theoretical complexity analysis - an O(n) scan over a compact array can beat an O(log n) search over scattered nodes.',
    objectives: [
      'Compare the cost of access, insertion and deletion for arrays and linked lists',
      'Explain cache locality and why it can override Big-O predictions',
      'Choose a structure for a stated robotics workload and justify it',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Operation costs',
        columns: ['Operation', 'Array', 'Singly linked list'],
        rows: [
          ['Access by index', 'O(1)', 'O(n)'],
          ['Insert at end', 'O(1) amortised', 'O(1) with a tail pointer'],
          ['Insert at front', 'O(n) - everything shifts', 'O(1)'],
          ['Delete at known position', 'O(n)', 'O(1) given the previous node'],
          ['Search unsorted', 'O(n) but cache-friendly', 'O(n) and cache-hostile'],
          ['Memory overhead', 'None beyond capacity', 'One pointer per element'],
        ],
      },
      {
        kind: 'text',
        heading: 'Locality is the hidden factor',
        body: [
          'A CPU fetches memory in cache lines (typically 64 bytes). An array of floats brings eight values per fetch; a linked list scattered across the heap brings one, plus a pointer chase that the prefetcher cannot predict. The result is that array traversal is often five to ten times faster per element than list traversal even though both are O(n).',
          'This is why high-performance robotics and simulation code uses contiguous storage (std::vector, NumPy arrays, flat buffers) almost everywhere, and why entity-component systems beat object-oriented hierarchies for large simulations.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'On a microcontroller the answer is even clearer',
        body: [
          'A small MCU has kilobytes of RAM, no cache and no heap allocator worth trusting. Linked-list allocation fragments the heap over hours of operation and can fail unpredictably. Embedded code uses fixed-size arrays and preallocated pools. If you find yourself calling malloc inside a loop on an MCU, stop and redesign.',
        ],
      },
    ],
    resources: [
      R('VisuAlgo: linked list', 'simulator', 'https://visualgo.net/en/list', { author: 'NUS', minutes: 30 }),
      R('Dynamic array', 'article', 'https://en.wikipedia.org/wiki/Dynamic_array', { minutes: 25, note: 'Explains amortised O(1) append, which is what Python lists and std::vector do.' }),
      R('Data locality for games and real-time systems', 'article', 'https://en.wikipedia.org/wiki/Locality_of_reference', { minutes: 25 }),
    ],
    exercises: [
      X('code', 'Benchmark sequential traversal of a 1,000,000-element array against a linked list of the same size. Report the ratio and explain it in terms of cache lines.', 30, { solution: 'Expect roughly 5-15x in favour of the array. Explanation: 64-byte cache lines deliver 8 floats per fetch for the array, while the list performs an unpredictable pointer chase per element, causing a cache miss each time.' }),
      X('question', 'Choose and justify a structure for each: (a) a 100 Hz sensor stream keeping the last 50 samples, (b) a waypoint queue where waypoints are appended and removed from the front, (c) a configuration lookup by name, (d) a fixed set of 6 motor channels on an MCU.', 25, { solution: '(a) ring buffer over a fixed array - O(1) both ends, bounded memory, no allocation. (b) deque - O(1) append and popleft. (c) hash map/dict - O(1) lookup by key. (d) fixed array indexed by channel number - no allocation, cache-friendly, index arithmetic is trivially safe.' }),
    ],
    questions: [
      mcq(1, 'Accessing element i of an array is:', ['O(1)', 'O(n)', 'O(log n)', 'O(i)'], 0, 'The address is computed as base + i * element_size. A linked list needs O(n) traversal.'),
      mcq(1, 'Inserting at the FRONT of an array is:', ['O(n), because all later elements shift', 'O(1)', 'O(log n)', 'Not possible'], 0, 'This is why a deque or ring buffer exists - it makes both ends O(1).'),
      mcq(2, 'Cache locality means:', ['Data used together is stored together, so fewer slow memory fetches are needed', 'The cache stores the most recently used keys', 'Arrays are stored on disk', 'Pointers speed up traversal'], 0, 'It is the main reason contiguous structures outperform linked ones in practice.'),
      mcq(2, 'An O(n) array scan can beat an O(log n) tree search because:', ['Each tree step may cause a cache miss, while the array scan streams through cache lines', 'Big-O is incorrect', 'Arrays are always smaller', 'Trees cannot be searched'], 0, 'Asymptotic analysis ignores constant factors, and memory latency is the dominant constant.'),
      mcq(3, 'On a microcontroller with 2 KB of RAM, the preferred approach is:', ['Fixed-size arrays and preallocated pools, avoiding heap allocation in loops', 'Linked lists for flexibility', 'Dynamic arrays that grow as needed', 'Recursive structures'], 0, 'Heap fragmentation causes unpredictable allocation failure after long runtime - a real robot failure mode.'),
      mcq(3, 'Python list append is amortised O(1) because:', ['The list over-allocates and grows geometrically, so resizes are rare', 'It never resizes', 'It is a linked list internally', 'It uses multiple threads'], 0, 'Occasional O(n) copies are averaged out by geometric growth, typically doubling capacity.'),
      short(1, 'What is the standard name for a fixed-size array used as a circular buffer?', ['ring buffer', 'circular buffer', 'ring', 'circular queue'], 'A ring buffer (or circular buffer) - the standard structure for bounded sensor streams.'),
    ],
    skills: ['dsa-arrays'],
  }),

  lesson({
    id: 'dsa-02',
    subject: 'ds-algo',
    order: 2,
    title: 'Stacks, Queues and Ring Buffers',
    difficulty: 'intermediate',
    minutes: 40,
    prereqs: ['dsa-01'],
    description: 'LIFO and FIFO structures, implementing a ring buffer, and where each appears in robot software.',
    why: 'A ring buffer is the single most used structure in embedded and robotics software: sensor streams, command queues, serial receive buffers, log buffers and inter-task communication are all ring buffers. It is also allocation-free, which is why it survives long runtimes.',
    objectives: [
      'Implement a ring buffer with correct wraparound, full and empty detection',
      'Choose between stack, queue and priority queue for a given workload',
      'Explain why a ring buffer is the right structure for a bounded sensor stream',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Ring buffer arithmetic',
        formula: 'write: buf[head] = v; head = (head + 1) % N      read: v = buf[tail]; tail = (tail + 1) % N      count = (head - tail + N) % N      full when count == N - 1 (one slot sacrificed) or use an explicit count',
        defines: [
          'Empty: head == tail',
          'Full: (head + 1) % N == tail - which is why capacity is N-1 unless you track a count',
          'All operations are O(1) with no allocation and no memory movement',
        ],
      },
      {
        kind: 'table',
        heading: 'Where each structure appears',
        columns: ['Structure', 'Order', 'Robotics use'],
        rows: [
          ['Stack (LIFO)', 'last in, first out', 'Call frames, undo history, DFS, expression parsing, backtracking planners'],
          ['Queue (FIFO)', 'first in, first out', 'Command queues, serial TX buffers, task scheduling, BFS frontier'],
          ['Ring buffer', 'FIFO with bounded size', 'Sensor sample windows, log buffers, ISR-to-main data transfer'],
          ['Priority queue (heap)', 'highest priority first', 'A* open list, task scheduling by deadline, event ordering'],
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Ring buffers across an interrupt boundary',
        body: [
          'When an interrupt writes and the main loop reads, use a single-producer single-consumer design: only the ISR modifies head, only the main loop modifies tail, and both indices are volatile (or atomic). Then no lock is needed and the buffer cannot corrupt. If both sides modify both indices you need a critical section - and taking a lock inside an interrupt handler is a recipe for deadlock.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - sizing a buffer',
        problem: 'An IMU samples at 200 Hz and the main loop consumes at 100 Hz in bursts. What is the minimum ring buffer capacity to survive a 50 ms scheduling delay without losing samples?',
        solution: [
          'Samples produced during the delay: 200 Hz * 0.050 s = 10 samples',
          'Add the samples produced during one consume interval for margin: 200 * 0.01 = 2 more',
          'Minimum capacity 12; use 16 (a power of two) so the modulo becomes a bitmask: index & 15',
          'Power-of-two sizing is a real optimisation - the compiler turns % 16 into a single AND instruction',
        ],
        answer: '16 slots, using index & (N-1) instead of modulo',
      },
    ],
    resources: [
      R('Circular buffer', 'article', 'https://en.wikipedia.org/wiki/Circular_buffer', { minutes: 25 }),
      R('VisuAlgo: stack and queue', 'simulator', 'https://visualgo.net/en/list', { author: 'NUS', minutes: 25 }),
      R('Python queue and collections.deque', 'docs', 'https://docs.python.org/3/library/collections.html#deque-objects', { author: 'Python Software Foundation', minutes: 20 }),
    ],
    exercises: [
      X('code', 'Implement a RingBuffer class with capacity N, push, pop, is_full, is_empty and length. Write tests covering: wraparound across the boundary, pushing to a full buffer, popping from an empty buffer, and a 10,000-operation random sequence verified against a reference deque.', 40, { solution: 'The random-sequence test against a reference implementation is what catches off-by-one errors in the full/empty logic. Decide explicitly whether push-to-full overwrites the oldest or fails, and test that behaviour.' }),
      X('question', 'Explain why a ring buffer with capacity N can only hold N-1 items when using the head==tail empty convention, and give two ways to get the full N.', 15, { solution: 'Because head == tail means both empty and full - the states are ambiguous. Fixes: (1) track an explicit count alongside the indices, (2) use a "wrapped" boolean flag, or (3) allocate N+1 slots and use only N. Each has a small cost in memory or bookkeeping.' }),
    ],
    questions: [
      mcq(1, 'A stack is:', ['Last in, first out', 'First in, first out', 'Ordered by priority', 'Random access'], 0, 'Push and pop at one end. Used for call frames, DFS and backtracking.'),
      mcq(1, 'A queue is:', ['First in, first out', 'Last in, first out', 'Sorted', 'Keyed'], 0, 'Enqueue at the back, dequeue at the front - command queues and BFS frontiers.'),
      mcq(2, 'In a ring buffer of size N using head==tail for empty, the usable capacity is:', ['N - 1', 'N', 'N + 1', 'N / 2'], 0, 'Head == tail would otherwise mean both empty and full. Track a count or a wrap flag to use all N.'),
      mcq(2, 'The main advantage of a ring buffer for a sensor stream is:', ['O(1) operations with bounded memory and no allocation', 'It sorts the data', 'It compresses the data', 'It is faster than an array'], 0, 'Bounded memory and zero allocation make it safe for long runtimes and interrupt contexts.'),
      mcq(3, 'A priority queue is the right structure for:', ['The open list of an A* path planner', 'A sensor sample window', 'A configuration lookup', 'An undo history'], 0, 'A* must always expand the lowest-cost frontier node, which is exactly a min-priority queue.'),
      mcq(3, 'Sizing a ring buffer to a power of two allows:', ['Replacing modulo with a bitwise AND', 'Halving memory use', 'Making it thread-safe', 'Storing more than N items'], 0, 'index & (N-1) is a single instruction; % N requires a division on most MCUs.'),
      numeric(3, 'A 500 Hz sensor with a 20 ms worst-case consumer delay needs at least how many buffer slots to avoid loss?', 10, '500 * 0.020 = 10 samples.', { unit: 'slots' }),
      mcq(3, 'When an ISR writes and the main loop reads a ring buffer, the safe design is:', [
        'Single producer, single consumer, with only the producer modifying head and only the consumer modifying tail',
        'Disable interrupts for the whole buffer operation',
        'Use a mutex inside the ISR',
        'Let both sides modify both indices',
      ], 0, 'SPSC needs no locking. Taking a lock inside an ISR risks deadlock because the ISR can preempt the lock holder.'),
    ],
    skills: ['dsa-stack-queue', 'dsa-ring-buffer'],
  }),

  lesson({
    id: 'dsa-03',
    subject: 'ds-algo',
    order: 3,
    title: 'Hash Maps and Sets',
    difficulty: 'intermediate',
    minutes: 40,
    prereqs: ['dsa-01'],
    description: 'Hashing, collision handling, load factor and the practical limits of hash tables.',
    why: 'Configuration lookups, node registries, transform frame lookups and deduplication of visited states in a planner are all hash map operations. Knowing when hashing degrades prevents a planner that works on a small map from collapsing on a large one.',
    objectives: [
      'Explain how a hash map achieves average O(1) lookup and what makes it degrade',
      'Compare separate chaining and open addressing for collision resolution',
      'Compute load factor and explain rehashing, including its cost in a real-time system',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A hash function maps a key to a bucket index',
        body: [
          'The key is hashed to an integer, reduced modulo the bucket count, and the value is stored there. Average lookup is O(1) because you go directly to the bucket. Degradation happens when many keys land in the same bucket: with separate chaining you scan a list (O(n) worst case); with open addressing you probe a sequence of slots, which also clusters.',
          'A good hash function distributes keys uniformly and is cheap to compute. A bad one - for example hashing strings by their first character - turns a hash map into a linked list while looking like one in your code.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Load factor and rehashing',
        formula: 'load factor = items / buckets      rehash when load factor exceeds a threshold (typically 0.75)      rehash cost = O(n)',
        defines: [
          'Rehashing allocates a larger bucket array and reinserts everything',
          'That single O(n) operation happens unpredictably - a latency spike in a real-time loop',
          'Mitigation: reserve capacity up front, or use a fixed-size open-addressing table with no growth',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Hash maps and real time do not mix well',
        body: [
          'The combination of unpredictable rehashing, dynamic allocation and cache-hostile pointer chasing makes general hash maps a poor choice inside a hard real-time loop. The usual embedded alternative is a small fixed-size open-addressing table sized at design time, or simply a sorted array with binary search when the key set is known and small.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - choosing for a frame lookup',
        problem: 'A robot has 24 named coordinate frames that are looked up by name at 100 Hz. Choose a structure.',
        solution: [
          'The key set is fixed and small (24 entries) and known at startup',
          'Option A: hash map - fast to write, but rehashing and allocation are unpredictable',
          'Option B: a sorted array of (name, index) pairs with binary search - about 5 comparisons, fully deterministic, zero allocation, cache-friendly',
          'Option C: an enum-to-index mapping if names are compile-time constants - O(1), zero cost, no strings at runtime',
          'Best: C if the frames are known at build time, otherwise B. A hash map is the wrong tool for 24 fixed keys in a 10 ms loop',
        ],
        answer: 'Enum index or sorted array with binary search - determinism beats average-case speed here',
      },
    ],
    resources: [
      R('Hash table', 'docs', 'https://en.wikipedia.org/wiki/Hash_table', { minutes: 35 }),
      R('Python: time complexity of built-in operations', 'docs', 'https://wiki.python.org/moin/TimeComplexity', { author: 'Python Software Foundation', minutes: 20, note: 'Free reference for exactly what dict, list and set operations cost.' }),
    ],
    exercises: [
      X('code', 'Implement a small open-addressing hash table with linear probing and a fixed capacity. Test insertion, lookup, deletion (using tombstones) and behaviour at high load factor. Report the average probe length at load factors 0.3, 0.6 and 0.9.', 40, { solution: 'Average probe length grows sharply above 0.7 - linear probing clusters. Deletion requires tombstones or reinsertion of the cluster, otherwise lookups break. This exercise is why load factor thresholds exist.' }),
      X('code', 'Benchmark dict lookup against binary search on a sorted list for 24, 1,000 and 100,000 string keys. Report the crossover and explain it.', 30, { solution: 'For very small key sets the sorted list is competitive or faster due to cache locality and no hashing cost. As n grows, dict wins clearly. The crossover is typically in the tens-to-hundreds range.' }),
    ],
    questions: [
      mcq(1, 'Average-case lookup in a hash map is:', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 0, 'Worst case is O(n) when all keys collide, which is why hash quality matters.'),
      mcq(1, 'Load factor is:', ['Items divided by buckets', 'Buckets divided by items', 'The number of collisions', 'The hash output range'], 0, 'It controls when a rehash is triggered, typically around 0.75.'),
      mcq(2, 'Separate chaining resolves collisions by:', ['Storing a list of entries in each bucket', 'Probing for the next free slot', 'Rehashing the key', 'Growing the table immediately'], 0, 'Open addressing instead probes a sequence of slots within the array itself.'),
      mcq(2, 'Rehashing costs:', ['O(n), and happens unpredictably - a latency spike', 'O(1)', 'O(log n)', 'O(n^2)'], 0, 'This is the main reason general hash maps are avoided inside hard real-time loops.'),
      mcq(3, 'For 24 fixed coordinate frame names looked up at 100 Hz, the best choice is:', ['A compile-time enum index or a sorted array with binary search', 'A hash map', 'A linked list', 'A binary search tree'], 0, 'Determinism, zero allocation and cache locality beat average-case O(1) for a small fixed key set.'),
      mcq(3, 'Deleting from an open-addressing table requires:', ['A tombstone marker or reinsertion of the cluster', 'Simply clearing the slot', 'A full rehash every time', 'Nothing special'], 0, 'Clearing a slot would break the probe sequence for later entries in the same cluster.'),
      numeric(2, 'A table with 40 buckets holds 30 items. What is the load factor?', 0.75, '30/40 = 0.75 - exactly the typical rehash threshold.', { unit: '' }),
    ],
    skills: ['dsa-hash-tables'],
  }),

  lesson({
    id: 'dsa-04',
    subject: 'ds-algo',
    order: 4,
    title: 'Trees and Binary Search',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['dsa-03'],
    description: 'Binary search, binary search trees, tree traversals and transform hierarchies.',
    why: 'A robot\'s coordinate frames form a tree: base to shoulder to elbow to wrist to tool. Computing the pose of any frame means walking that tree. Binary search is also the workhorse for time-indexed log lookup - finding the sample nearest a timestamp.',
    objectives: [
      'Implement binary search correctly, including the nearest-value variant for timestamps',
      'Explain tree traversals (pre-order, in-order, post-order) and where each applies',
      'Describe a transform tree and compute a child pose by walking from the root',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Binary search, correctly',
        formula: 'lo = 0, hi = n; while lo < hi: mid = lo + (hi - lo)/2; if a[mid] < target: lo = mid+1 else hi = mid      result index = lo',
        defines: [
          'Using lo + (hi - lo)/2 avoids integer overflow in languages with fixed-width ints',
          'This form returns the insertion point, so a[lo-1] and a[lo] bracket the target',
          'Nearest-sample lookup: compare |target - a[lo-1]| with |a[lo] - target|',
          'Requires the data to be SORTED - the most commonly forgotten precondition',
        ],
      },
      {
        kind: 'text',
        heading: 'Traversals and what they are for',
        body: [
          'Pre-order (visit node, then children) is how you serialise or print a hierarchy - parents before dependents. In-order (left, node, right) visits a binary search tree in sorted order, which is how you validate one. Post-order (children, then node) is how you delete a tree and how you compute a transform hierarchy: a child\'s world pose depends on all its ancestors, so you must resolve children after parents... in practice you walk root-to-leaf to accumulate transforms and leaf-to-root to propagate forces.',
          'Binary search trees give O(log n) search, insert and delete - IF balanced. An unbalanced BST degenerates to a linked list with O(n) operations. Self-balancing variants (AVL, red-black) guarantee O(log n); this is what std::map and Java TreeMap implement.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - transform tree lookup',
        problem: 'Frames: base -> shoulder (offset 0, 0.2, 0.3) -> elbow (0.35, 0, 0) -> tool (0.3, 0, 0). Find the tool position in base coordinates when all joint angles are zero.',
        solution: [
          'Walk root to leaf accumulating transforms: T_base_tool = T_base_shoulder * T_shoulder_elbow * T_elbow_tool',
          'With zero rotation each transform is a pure translation, so positions add',
          'x = 0 + 0.35 + 0.3 = 0.65 m; y = 0.2 + 0 + 0 = 0.2 m; z = 0.3 + 0 + 0 = 0.3 m',
          'With non-zero joint angles each link contributes a rotation as well, and the multiplications no longer commute - which is why the order of the walk is fixed by the tree structure',
        ],
        answer: 'Tool at (0.65, 0.20, 0.30) m in the base frame',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'This is exactly what ROS 2 tf2 does',
        body: [
          'tf2 maintains a time-stamped tree of transforms and answers "where is frame X in frame Y at time t?" by walking the path between them and interpolating in time. Understanding trees and binary search over timestamps means you understand how tf2 works internally - and why it fails when a frame is published on two parents, creating a cycle rather than a tree.',
        ],
      },
    ],
    resources: [
      R('VisuAlgo: binary search tree', 'simulator', 'https://visualgo.net/en/bst', { author: 'NUS', minutes: 40, note: 'Insert a sorted sequence and watch it degenerate into a list - the clearest demonstration of why balancing matters.' }),
      R('Binary search algorithm', 'article', 'https://en.wikipedia.org/wiki/Binary_search_algorithm', { minutes: 25 }),
      R('tf2 concepts (ROS 2)', 'docs', 'https://docs.ros.org/en/rolling/Concepts/Intermediate/About-Tf2.html', { author: 'Open Robotics', minutes: 30 }),
    ],
    exercises: [
      X('code', 'Implement binary search returning the insertion point, then a `nearest_sample(times, t)` function for a sorted timestamp array. Test with: exact match, before the first, after the last, exactly between two samples, and an empty array.', 35, { solution: 'Edge cases decide correctness. Exactly-between must have a documented tie-break. Empty array must raise or return None explicitly rather than returning index 0. Before-first and after-last must clamp, not index out of bounds.' }),
      X('code', 'Implement a transform tree with `add_frame(parent, name, offset)` and `pose_of(name)` that walks from the root. Test on the four-frame chain above, then add a second branch and confirm both resolve independently. Attempt to add a frame with two parents and confirm it is rejected.', 40, { solution: 'A frame with two parents creates a cycle, not a tree - reject it with a clear error, because tf2 fails the same way and the error is otherwise baffling. Store children in a dict keyed by parent and walk upward from the target accumulating offsets.' }),
    ],
    questions: [
      mcq(1, 'Binary search requires the data to be:', ['Sorted', 'In a linked list', 'Unique', 'Numeric only'], 0, 'The most commonly forgotten precondition. Searching an unsorted array silently returns a wrong index.'),
      mcq(1, 'Writing mid = lo + (hi - lo)/2 instead of (lo + hi)/2 avoids:', ['Integer overflow in fixed-width languages', 'A slower result', 'Off-by-one errors', 'The need for sorting'], 0, 'lo + hi can exceed the maximum int for large indices. The difference form cannot.'),
      mcq(2, 'Visiting a binary search tree in-order produces:', ['The values in sorted order', 'Random order', 'Reverse sorted order', 'Level by level'], 0, 'This is the standard way to validate that a tree is a correct BST.'),
      mcq(2, 'An unbalanced binary search tree degrades to:', ['O(n) operations, like a linked list', 'O(log n) still', 'O(1)', 'O(n log n)'], 0, 'Inserting sorted data into a naive BST produces exactly this. Self-balancing trees prevent it.'),
      mcq(3, 'A robot\'s coordinate frames form:', ['A tree, with each frame having exactly one parent', 'A graph with cycles', 'A linked list', 'A hash table'], 0, 'Two parents would create a cycle and make the pose ambiguous - tf2 rejects this explicitly.'),
      numeric(3, 'How many comparisons does binary search need at most for 1,024 sorted items?', 10, 'log2(1024) = 10, plus one for the final check in some formulations - about 10-11.', { unit: 'comparisons' }),
      mcq(3, 'To find the logged sample nearest a timestamp you should:', ['Binary search for the insertion point, then compare the two neighbours', 'Scan the whole array', 'Use a hash map', 'Sort the array first'], 0, 'O(log n) instead of O(n), which matters when interpolating thousands of queries against a long log.'),
    ],
    skills: ['dsa-trees', 'dsa-binary-search'],
  }),

  lesson({
    id: 'dsa-05',
    subject: 'ds-algo',
    order: 5,
    title: 'Graphs, Traversal and Path Finding',
    difficulty: 'advanced',
    minutes: 55,
    prereqs: ['dsa-02', 'dsa-04'],
    description: 'Graph representations, BFS, DFS, Dijkstra and A* - the actual machinery of robot navigation.',
    why: 'A occupancy grid is a graph. A road network is a graph. So is a task dependency graph - including the one this app\'s roadmap is built from. BFS, Dijkstra and A* are the three algorithms that make a robot able to get from here to there.',
    objectives: [
      'Represent a graph as an adjacency list or matrix and choose between them',
      'Implement BFS and Dijkstra, and explain why BFS alone is insufficient for weighted graphs',
      'Explain how A* uses a heuristic to focus Dijkstra\'s search, and what makes a heuristic admissible',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Graph representations',
        columns: ['Representation', 'Space', 'Best for'],
        rows: [
          ['Adjacency list', 'O(V + E)', 'Sparse graphs - most real maps and networks'],
          ['Adjacency matrix', 'O(V^2)', 'Dense graphs, and small fixed grids where indexing is trivial'],
          ['Implicit (grid + neighbour function)', 'O(1) extra', 'Occupancy grids - never materialise a million-edge graph'],
        ],
      },
      {
        kind: 'text',
        heading: 'BFS, Dijkstra and A*',
        body: [
          'BFS expands uniformly outward and finds the shortest path in an UNWEIGHTED graph - minimum number of steps. It uses a queue. On a grid where every move costs the same, BFS is optimal.',
          'Dijkstra generalises this to weighted graphs using a priority queue ordered by accumulated cost. It is guaranteed optimal for non-negative weights but expands in all directions, exploring a roughly circular region around the start.',
          'A* is Dijkstra plus a heuristic: it orders the priority queue by g + h, where g is the cost so far and h is an ESTIMATE of the remaining cost. If h never overestimates the true remaining cost (admissible) and is consistent between neighbours, A* returns an optimal path while expanding far fewer nodes - typically a corridor toward the goal instead of a circle.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Heuristics for a grid',
        formula: '4-connected grid: h = Manhattan distance * cost      8-connected grid: h = octile distance      any-angle: h = Euclidean distance',
        defines: [
          'Using Euclidean distance on a 4-connected grid is still admissible (it underestimates) but weaker',
          'Using Manhattan distance on an 8-connected grid OVERESTIMATES - it is inadmissible and A* can return a suboptimal path',
          'h = 0 turns A* into Dijkstra; h = infinity turns it into greedy best-first search, which is fast but not optimal',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'The roadmap in this app is a graph too',
        body: [
          'Prerequisite edges form a directed acyclic graph, and computing "what can I study next" is a topological sort with a filter - the same algorithm family as the dependency resolution in a package manager. When you implement A* you will recognise the structure immediately: this app\'s planner uses priority ordering over an unlocked-lesson frontier in exactly the same way.',
        ],
      },
    ],
    resources: [
      R('VisuAlgo: graph traversal and shortest paths', 'simulator', 'https://visualgo.net/en/dfsbfs', { author: 'NUS', minutes: 45 }),
      R('Red Blob Games: introduction to A*', 'article', 'https://www.redblobgames.com/pathfinding/a-star/introduction.html', { minutes: 60, note: 'The best free visual explanation of pathfinding anywhere. Strongly recommended.' }),
      R('A* search algorithm', 'docs', 'https://en.wikipedia.org/wiki/A*_search_algorithm', { minutes: 40 }),
    ],
    exercises: [
      X('code', 'Implement BFS, Dijkstra and A* on a 2D occupancy grid with 8-connected movement and a cost of 1 for orthogonal and 1.414 for diagonal steps. Verify all three return the same optimal path length on the same map, and report the number of nodes each expands.', 60, { solution: 'BFS must be run on the unweighted version to be comparable. Dijkstra and A* should return identical path costs, but A* should expand dramatically fewer nodes - typically 3-10x fewer. That expansion count is the whole point of the heuristic.' }),
      X('code', 'Deliberately use a Manhattan heuristic on an 8-connected grid and demonstrate that A* returns a longer path than Dijkstra. Then fix it with an octile heuristic and confirm optimality returns.', 30, { solution: 'This is inadmissibility in action: overestimating the remaining cost makes A* commit to a direction too early. It is a real bug that produces plausible-looking but suboptimal robot paths.' }),
      X('question', 'Explain why an occupancy grid should use an implicit graph (a neighbour function) rather than building an explicit adjacency list, and estimate the memory difference for a 1000x1000 grid.', 20, { solution: 'An explicit list for 1e6 nodes with 8 neighbours each stores 8e6 entries - roughly 64 MB with 8-byte indices, plus per-node container overhead, often several hundred MB in practice. The implicit version stores the 1e6-cell occupancy grid (1 MB as bytes) and computes neighbours arithmetically in O(1). Never materialise a grid graph.' }),
    ],
    questions: [
      mcq(1, 'An adjacency list is preferred over an adjacency matrix when:', ['The graph is sparse', 'The graph is dense', 'The graph has fewer than 10 nodes', 'Edge weights are all equal'], 0, 'O(V+E) versus O(V^2). Real maps and networks are sparse.'),
      mcq(1, 'BFS uses which structure for its frontier?', ['A queue (FIFO)', 'A stack (LIFO)', 'A priority queue', 'A hash set'], 0, 'A stack would give DFS. A priority queue gives Dijkstra/A*.'),
      mcq(2, 'BFS finds the shortest path in terms of:', ['Number of edges, only valid on unweighted graphs', 'Total weight', 'Euclidean distance', 'Number of visited nodes'], 0, 'With differing edge weights BFS can return a path with more total cost than another with fewer edges.'),
      mcq(2, 'Dijkstra requires:', ['Non-negative edge weights', 'An admissible heuristic', 'A tree, not a graph', 'Weighted edges to be integers'], 0, 'Negative weights break the greedy assumption that a settled node has its final cost. Use Bellman-Ford for those.'),
      mcq(3, 'In A*, the priority of a node is:', ['g + h, where g is cost so far and h estimates remaining cost', 'h only', 'g only', 'g - h'], 0, 'g only is Dijkstra; h only is greedy best-first search, which is fast but not optimal.'),
      mcq(3, 'An admissible heuristic is one that:', ['Never overestimates the true remaining cost', 'Never underestimates', 'Is always exactly correct', 'Is zero'], 0, 'Overestimation can make A* commit early and return a suboptimal path.'),
      mcq(3, 'Using Manhattan distance as the heuristic on an 8-connected grid causes:', ['Possible suboptimal paths, because it overestimates diagonal travel', 'Optimal but slower search', 'An infinite loop', 'No effect'], 0, 'Diagonal moves cost 1.414, not 2, so Manhattan overestimates. Use the octile heuristic instead.'),
      numeric(3, 'On a 4-connected unit-cost grid, what is the Manhattan heuristic distance from (0,0) to (7,3)?', 10, '|7-0| + |3-0| = 10 steps, and it is exact on a 4-connected unit grid.', { unit: 'cells' }),
    ],
    skills: ['dsa-graphs', 'dsa-pathfinding'],
  }),

  lesson({
    id: 'dsa-06',
    subject: 'ds-algo',
    order: 6,
    title: 'Sorting and Selection',
    difficulty: 'intermediate',
    minutes: 40,
    prereqs: ['dsa-04'],
    description: 'Comparison sorts, stability, and the selection algorithms that matter more than sorting in practice.',
    why: 'You will rarely write a sort - libraries do it well. You will often need to know whether the sort is stable (sensor fusion depends on it), what the cost is, and when a partial selection beats a full sort. Median filtering, which removes sensor spikes, is a selection problem.',
    objectives: [
      'Compare the complexity and stability of merge sort, quicksort and heap sort',
      'Explain what stability means and give a robotics case where it is required',
      'Use partial selection (nth-element, median) instead of a full sort where appropriate',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Sorting algorithms',
        columns: ['Algorithm', 'Average', 'Worst', 'Space', 'Stable'],
        rows: [
          ['Merge sort', 'O(n log n)', 'O(n log n)', 'O(n)', 'Yes'],
          ['Quicksort', 'O(n log n)', 'O(n^2)', 'O(log n) stack', 'No'],
          ['Heap sort', 'O(n log n)', 'O(n log n)', 'O(1)', 'No'],
          ['Insertion sort', 'O(n^2)', 'O(n^2)', 'O(1)', 'Yes - and fast for n < about 50'],
          ['Counting/radix', 'O(n + k)', 'O(n + k)', 'O(k)', 'Yes - non-comparison, integer keys only'],
        ],
      },
      {
        kind: 'text',
        heading: 'Stability is a correctness property',
        body: [
          'A stable sort preserves the relative order of equal keys. Sort sensor readings by timestamp when several share the same millisecond: a stable sort keeps them in arrival order, an unstable one may reverse them. For a filter that assumes time-ordered input, that silently corrupts the result.',
          'Python\'s `sorted()` and `list.sort()` use Timsort - a stable hybrid of merge and insertion sort that exploits existing runs, which makes it very fast on nearly-sorted data such as a rolling sensor log.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - median filter instead of mean',
        problem: 'A distance sensor occasionally returns a spurious 4000 mm spike among readings near 500 mm. Why does a mean filter fail and a median filter succeed?',
        solution: [
          'Mean of [500, 502, 498, 501, 4000] = 1200.2 mm - one outlier moves the estimate by 700 mm',
          'Median of the same window = 501 mm - completely unaffected',
          'The median is a selection problem: O(n) average with quickselect, or O(n log n) by sorting a small window, which is fine for window sizes of 5-15',
          'For real-time use, keep the window in a ring buffer and sort a copy each sample - cheap at these sizes and robust to any number of outliers below half the window',
        ],
        answer: 'A median filter rejects outliers entirely; a mean filter is dragged by them',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Do not sort to find the maximum',
        body: [
          'Sorting is O(n log n); finding a maximum is O(n); finding the kth smallest is O(n) average with quickselect. If you only need the top few items, use a bounded heap of size k (O(n log k)) rather than sorting everything. In a control loop those factors are the difference between fitting the deadline and missing it.',
        ],
      },
    ],
    resources: [
      R('VisuAlgo: sorting', 'simulator', 'https://visualgo.net/en/sorting', { author: 'NUS', minutes: 40, note: 'Watch quicksort on an already-sorted input to see the O(n^2) worst case happen.' }),
      R('Timsort', 'article', 'https://en.wikipedia.org/wiki/Timsort', { minutes: 25 }),
      R('Median filter', 'docs', 'https://en.wikipedia.org/wiki/Median_filter', { minutes: 20 }),
    ],
    exercises: [
      X('code', 'Implement insertion sort and merge sort. Benchmark both on random and nearly-sorted input at n = 10, 100, 1000, 10000. Confirm the crossover point where merge sort wins and report it.', 35, { solution: 'Insertion sort typically wins below n of about 30-60 on random data, and stays competitive much longer on nearly-sorted data because it makes few swaps. This is exactly why Timsort and introsort fall back to insertion sort for small runs.' }),
      X('code', 'Implement a median filter over a ring buffer window and demonstrate on synthetic data with 10% outliers that it tracks the true signal while a mean filter does not. Report the RMS error of each.', 30, { solution: 'The median filter RMS error should be an order of magnitude lower with outliers present. Also test the delay: a window of N introduces roughly N/2 samples of lag, which is the cost of robustness.' }),
    ],
    questions: [
      mcq(1, 'Quicksort\'s worst-case complexity is:', ['O(n^2)', 'O(n log n)', 'O(n)', 'O(log n)'], 0, 'Reached with a poor pivot choice on sorted or reverse-sorted input. Real implementations use introsort to avoid it.'),
      mcq(1, 'Which sort is stable?', ['Merge sort', 'Quicksort', 'Heap sort', 'Selection sort'], 0, 'Stability preserves the relative order of equal keys - required when secondary ordering matters.'),
      mcq(2, 'Stability matters when sorting sensor readings by timestamp because:', ['Readings sharing a timestamp keep their arrival order', 'It makes the sort faster', 'It reduces memory use', 'It is required by Python'], 0, 'An unstable sort can reorder simultaneous samples and corrupt any downstream filter that assumes time ordering.'),
      mcq(2, 'Python\'s built-in sort (Timsort) is:', ['A stable hybrid of merge and insertion sort that exploits existing runs', 'An unstable quicksort', 'A heap sort', 'A radix sort'], 0, 'Which makes it unusually fast on nearly-sorted data such as rolling sensor logs.'),
      mcq(3, 'To find the 5 largest items in 100,000, the efficient approach is:', ['A bounded heap of size 5, giving O(n log 5)', 'A full sort', 'A full merge sort then slice', 'Binary search'], 0, 'Sorting costs O(n log n); you only need O(n log k) with k = 5.'),
      mcq(3, 'A median filter beats a mean filter when:', ['The signal contains occasional large outliers', 'The signal is perfectly clean', 'The window size is 1', 'Latency must be zero'], 0, 'The median is unaffected by up to half the window being corrupted; the mean is dragged by any outlier.'),
      numeric(3, 'A median filter with a window of 9 samples introduces approximately how many samples of delay?', 4, 'Roughly (N-1)/2 = 4 samples - the inherent cost of needing the whole window before deciding.', { unit: 'samples' }),
      short(1, 'Which non-comparison sort runs in O(n+k) on integer keys?', ['counting sort', 'radix sort', 'counting', 'radix'], 'Counting sort (and radix sort, which applies it digit by digit). Both require bounded integer keys.'),
    ],
    skills: ['dsa-sorting', 'dsa-filtering'],
  }),

  lesson({
    id: 'dsa-07',
    subject: 'ds-algo',
    order: 7,
    title: 'Recursion, Divide and Conquer, Dynamic Programming',
    difficulty: 'advanced',
    minutes: 50,
    prereqs: ['dsa-05'],
    description: 'Recursive decomposition, memoisation, and converting exponential recursion into polynomial time.',
    why: 'Recursive formulations appear throughout robotics: kinematic chains, quadtree/octree spatial indexing, hierarchical path planning and recursive state estimation. Knowing when recursion costs exponentially - and how to fix it - prevents a planner that never returns.',
    objectives: [
      'Write a correct recursive function with a base case and a shrinking argument',
      'Identify overlapping subproblems and apply memoisation to convert exponential to polynomial cost',
      'Convert a recursive formulation to an iterative one where stack depth is a constraint',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Two rules make recursion correct',
        body: [
          'There must be a base case that does not recurse, and every recursive call must move strictly toward it. Break either and you get infinite recursion followed by a stack overflow - which on an MCU with no memory protection is a hard fault and a robot that stops mid-motion.',
          'The danger with naive recursion is not depth but re-computation. Recursive Fibonacci makes two calls per level, so the call tree grows as 2^n: fib(40) performs over 200 million calls to compute a number it could have produced in 40 additions.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Memoisation',
        formula: 'cache the result of each distinct subproblem; on a repeat call return the cached value      cost falls from O(2^n) to O(n) when there are only n distinct subproblems',
        defines: [
          'Distinct subproblems = the size of the memo table = your new time complexity',
          'Top-down (memoised recursion) is intuitive; bottom-up (iterative table filling) avoids stack depth and is often faster',
          'The trade: O(n) or more extra memory, which on an MCU may be unavailable',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - quadtree neighbour query',
        problem: 'A quadtree indexes obstacles over a 1024x1024 area. Explain how a range query achieves sublinear cost and what the worst case is.',
        solution: [
          'A query rectangle that overlaps only one child recurses into that child alone, discarding three quarters of the space - that is the divide and conquer step',
          'Depth is log4(1024/1) = 5 levels, so a typical query visits a handful of nodes',
          'Worst case: obstacles uniformly spread so every node is subdivided and the query rectangle covers everything - the query visits all nodes, O(n)',
          'The structure only helps when the data is clustered or sparse, which real maps usually are. Always measure on your actual data, not on the average case',
        ],
        answer: 'Sublinear when data is sparse or clustered; O(n) worst case when the query covers dense data',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Recursion depth on embedded targets',
        body: [
          'A quadtree or octree traversal is recursive by nature, and depth is bounded by the tree depth - usually safe. But an unbounded recursive search over a graph with cycles will overflow. If you use recursion on an MCU, prove the depth bound and add an explicit depth limit parameter that fails safely, so a bug produces an error rather than a hard fault.',
        ],
      },
    ],
    resources: [
      R('Dynamic programming', 'article', 'https://en.wikipedia.org/wiki/Dynamic_programming', { minutes: 40 }),
      R('Quadtree', 'docs', 'https://en.wikipedia.org/wiki/Quadtree', { minutes: 25, note: 'The spatial index used for obstacle lookup and collision checking.' }),
      R('Memoization', 'article', 'https://en.wikipedia.org/wiki/Memoization', { minutes: 20 }),
    ],
    exercises: [
      X('code', 'Implement recursive Fibonacci three ways: naive, memoised (dict), and iterative bottom-up. Time each at n = 20, 30, 35 and report the growth pattern. Confirm the naive version is unusable at n = 40.', 30, { solution: 'Naive roughly doubles every +1 in n (2^n). Memoised and iterative are both linear. At n=40 the naive version performs about 300 million calls and takes seconds to minutes; the others take microseconds.' }),
      X('code', 'Implement a quadtree with insert and range_query. Test with: all points in one quadrant (deep subdivision elsewhere), uniformly random points, and a query covering the entire area. Report node visits for each case.', 45, { solution: 'Clustered data gives few node visits for small queries. Uniform data with a full-area query visits essentially every node - the O(n) worst case. Set a maximum depth and a bucket capacity to bound memory and depth.' }),
      X('question', 'A recursive graph search on a map with cycles overflows the stack. Give two distinct fixes and explain which is preferable on an MCU with 4 KB of stack.', 15, { solution: '(1) Mark visited nodes so no node is recursed into twice - this is the correctness fix and is mandatory regardless. (2) Convert to an explicit stack (iterative DFS) allocated in the heap or as a fixed array, removing the call-frame overhead. On an MCU, prefer the iterative version with a fixed-size array and an explicit overflow check that fails safely.' }),
    ],
    questions: [
      mcq(1, 'A recursive function must have:', ['A base case and calls that move strictly toward it', 'Only a base case', 'Only shrinking arguments', 'A memo table'], 0, 'Missing either produces infinite recursion and a stack overflow.'),
      mcq(1, 'Naive recursive Fibonacci is O(2^n) because:', ['The same subproblems are recomputed exponentially many times', 'The stack is too deep', 'Addition is slow', 'It uses two variables'], 0, 'Only n distinct subproblems exist; the call tree re-derives them repeatedly.'),
      mcq(2, 'Memoisation reduces recursive Fibonacci to:', ['O(n) time with O(n) extra memory', 'O(1) time', 'O(n^2) time', 'O(log n) time'], 0, 'The number of distinct subproblems bounds the work once each is cached.'),
      mcq(2, 'Bottom-up dynamic programming is preferred over top-down memoisation when:', ['Stack depth is constrained or iteration is measurably faster', 'The problem has no subproblems', 'Memory is unlimited', 'Recursion is unavailable'], 0, 'It avoids call-frame overhead entirely and cannot overflow the stack.'),
      mcq(3, 'A quadtree range query is sublinear when:', ['The data is sparse or clustered so most children can be discarded', 'The data is uniformly dense', 'The query covers the whole area', 'The tree is unbalanced'], 0, 'With dense uniform data and a large query it visits every node - O(n). Always measure on your real data.'),
      numeric(3, 'A quadtree over a 1024x1024 region subdivided to single cells has what maximum depth?', 10, '4^10 = 2^20 = 1024*1024, so 10 levels of quadtree subdivision.', { unit: 'levels' }),
      mcq(3, 'On a microcontroller, recursive code should:', ['Have a proven depth bound and an explicit depth limit that fails safely', 'Be used freely - stacks are large', 'Always be replaced by goto', 'Never handle errors'], 0, 'A hard fault mid-motion is a safety issue. A bounded, checked failure is recoverable.'),
    ],
    skills: ['dsa-recursion', 'dsa-dp'],
  }),
];
