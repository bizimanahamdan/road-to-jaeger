import { R, X, lesson, mcq, numeric, short } from './helpers';
import type { Lesson } from '@/lib/types';

/**
 * SOFTWARE / Programming Fundamentals.
 *
 * Language-independent. Assumes some exposure to coding (the learner is at L4
 * Software Development) and focuses on the parts that separate someone who can
 * write code from someone who can engineer a system: how execution really
 * works, how to bound cost, and how to debug without guessing.
 */
export const PROGRAMMING_LESSONS: Lesson[] = [
  lesson({
    id: 'prog-01',
    subject: 'programming',
    order: 1,
    title: 'How a Program Actually Executes',
    difficulty: 'beginner',
    minutes: 40,
    description:
      'From source text to running process: compilation, interpretation, memory layout, and what the CPU does each cycle.',
    why: 'Embedded programming and performance work both require a mental model of what the machine is doing. "My code is slow" and "my robot ran out of RAM" are the same class of problem, and both are solved by understanding memory and execution rather than by trying things until they work.',
    objectives: [
      'Explain the difference between compiled and interpreted execution and where each sits on the spectrum',
      'Describe the memory layout of a running program: stack, heap, static data and code',
      'Identify which memory region a given variable or allocation lives in and why it matters',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Source code is not what runs',
        body: [
          'A compiler translates your source into machine code ahead of time, producing an executable that the CPU runs directly - C and C++ work this way, which is why they dominate firmware and ROS 2 nodes where timing matters. An interpreter reads your program and performs the described operations directly, usually via a virtual machine - Python works this way, which costs a factor of ten or more in raw speed but buys enormous development velocity.',
          'Most modern systems are hybrids. Python compiles to bytecode that the CPython virtual machine interprets; Java and Kotlin compile to bytecode for the JVM; JavaScript is compiled just-in-time inside the browser or Node. Android apps, including this one\'s Capacitor build, run JavaScript in a JIT-capable WebView - which is why bundle size and algorithmic efficiency still matter on a phone.',
        ],
      },
      {
        kind: 'table',
        heading: 'Memory regions of a running process',
        columns: ['Region', 'Holds', 'Lifetime', 'Typical failure'],
        rows: [
          ['Stack', 'Local variables, function call frames, return addresses', 'Automatic - freed when the function returns', 'Stack overflow from unbounded recursion or huge locals'],
          ['Heap', 'Dynamically allocated objects (new, malloc, Python objects)', 'Until explicitly freed or garbage collected', 'Memory leak, fragmentation, out-of-memory'],
          ['Static/data', 'Global variables, string literals, constants', 'Whole program run', 'Unintended shared mutable state'],
          ['Code/text', 'The compiled instructions', 'Whole program run', 'Read-only; writing here faults'],
        ],
      },
      {
        kind: 'text',
        heading: 'The call stack is why recursion can crash you',
        body: [
          'Each function call pushes a frame containing its locals and a return address. Frames are popped on return, so stack memory is essentially free and fast. But the stack has a fixed size - typically 1-8 MB on a desktop, and often only a few kilobytes on a microcontroller thread.',
          'On an embedded target with 2 KB of stack, a recursive path-planning routine will overflow almost immediately. This is why embedded and real-time code uses explicit loops and preallocated buffers instead of recursion, and why you must know your stack budget before you choose an algorithm.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Garbage collection is not free memory management',
        body: [
          'A garbage collector reclaims heap objects you no longer reference, but it runs when it chooses, and while it runs your program is usually paused. In a control loop that must produce a motor command every 10 ms, a 30 ms garbage collection pause is a missed cycle - the robot does not stop waiting for you. Real-time robot code therefore preallocates buffers, avoids allocating inside the loop, and often disables or avoids the collector entirely.',
        ],
      },
    ],
    resources: [
      R('CS50x - Harvard\u2019s introduction to computer science', 'course', 'https://cs50.harvard.edu/x/', { author: 'Harvard', minutes: 6000, note: 'Free. Weeks 0-5 give the strongest available grounding in how execution and memory actually work.' }),
      R('Beej\u2019s Guide to C: process memory', 'book', 'https://beej.us/guide/bgc/html/split/stack-and-heap.html', { author: 'Brian "Beej" Hall', minutes: 40, note: 'Free, concise, and specifically about the stack/heap distinction.' }),
      R('Python bytecode and the interpreter', 'docs', 'https://docs.python.org/3/faq/programming.html', { author: 'Python Software Foundation', minutes: 45 }),
    ],
    exercises: [
      X('question', 'For each of these, state which memory region it occupies and its lifetime: (a) a local int inside a function, (b) a Python list you keep appending to, (c) a global constant string, (d) a frame pushed by a recursive call.', 15, {
        solution: '(a) stack, freed on return. (b) heap, lives until no references remain and the GC reclaims it. (c) static/data, whole program run. (d) stack, freed when that call returns - and this is why deep recursion overflows.',
      }),
      X('code', 'Write a recursive function that computes the sum of a list, then rewrite it as a loop. Estimate the stack depth of the recursive version for a list of 10,000 elements and explain whether it would survive on a microcontroller with a 2 KB stack.', 25, {
        solution: 'Recursion depth equals list length: 10,000 frames. At even 32 bytes per frame that is 320 KB - over 100 times a 2 KB stack. It would overflow immediately. The loop version uses constant stack space, which is why iterative forms are mandatory in embedded code.',
      }),
      X('question', 'You have a 10 ms control loop in Python that allocates a new list every iteration. Explain the risk and describe two changes that remove it.', 15, {
        solution: 'Each allocation creates garbage; eventually the collector runs and pauses the loop past its deadline, causing a missed control cycle and visible jitter. Fixes: (1) preallocate one list outside the loop and clear/reuse it, (2) move to a language/runtime with deterministic memory (C/C++) for the inner loop, or use a fixed-size array (numpy) allocated once.',
      }),
    ],
    questions: [
      mcq(1, 'A compiled language such as C differs from an interpreted one such as Python primarily because:', [
        'It is translated to machine code ahead of time and executed directly by the CPU',
        'It cannot use variables',
        'It always runs on a virtual machine',
        'It is only usable for embedded work',
      ], 0, 'Interpreters perform the operations at run time via a VM, which costs speed but gains flexibility and development speed.'),
      mcq(2, 'Local variables of a function live in:', ['The stack', 'The heap', 'The static data segment', 'The code segment'], 0, 'And they are reclaimed automatically when the function returns, which is what makes stack allocation nearly free.'),
      mcq(2, 'Objects allocated with `new` in C++ or created as Python lists live in:', ['The heap', 'The stack', 'Registers', 'The code segment'], 0, 'Heap memory persists beyond the allocating function and must be freed or garbage collected.'),
      mcq(2, 'A stack overflow is most commonly caused by:', ['Unbounded or very deep recursion', 'Allocating too many heap objects', 'Using global variables', 'Compiling without optimisation'], 0, 'Each call pushes a frame; enough frames exhaust the fixed stack.'),
      mcq(3, 'Why is garbage collection problematic inside a hard real-time control loop?', [
        'Collection pauses are not predictable, so a deadline can be missed',
        'The collector uses too much disk space',
        'It cannot reclaim arrays',
        'It is not - GC is ideal for real-time code',
      ], 0, 'Real-time code preallocates and avoids allocation in the loop to keep pause times bounded.'),
      numeric(3, 'A microcontroller thread has a 2048-byte stack. Each call frame is 64 bytes. What is the maximum safe recursion depth, allowing 256 bytes of headroom?', 28, '(2048-256)/64 = 28 frames.'),
      short(1, 'What is the name of the memory region that holds compiled instructions?', ['code segment', 'text segment', 'text', 'code'], 'The code or text segment, usually marked read-only.'),
    ],
    skills: ['swe-execution-model'],
  }),

  lesson({
    id: 'prog-02',
    subject: 'programming',
    order: 2,
    title: 'State, Types and Data Representation',
    difficulty: 'beginner',
    minutes: 40,
    prereqs: ['prog-01'],
    description: 'Variables as named memory, static versus dynamic types, numeric representation, and the limits of floating point.',
    why: 'Every robotics bug involving "the number is slightly wrong", "the sensor value wrapped around", or "the integer overflowed" is a data-representation bug. Understanding how numbers are actually stored prevents a whole category of intermittent failures.',
    objectives: [
      'Explain how a variable maps to memory and what assignment does at that level',
      'Compare static and dynamic typing and state the trade-off each makes',
      'Describe integer overflow and floating-point representation error, and detect both in practice',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A variable is a name for a location holding a value',
        body: [
          'Assignment copies a value into that location. For primitive types this is a value copy; for objects in most languages it copies a reference, so two names can point at the same object and mutating through one is visible through the other. That aliasing is the source of a large fraction of confusing bugs.',
          'Types define both the bit layout and the permitted operations. A static type system (C, C++, TypeScript, Rust) checks them at compile time; a dynamic one (Python) checks at run time. Static typing shifts errors earlier and enables optimisation; dynamic typing is faster to write and more flexible. For safety-relevant and performance-critical code, static typing is the standard choice - which is why ROS 2 and firmware are C++.',
        ],
      },
      {
        kind: 'table',
        heading: 'Numeric ranges you must know',
        columns: ['Type', 'Bytes', 'Range', 'Where it bites'],
        rows: [
          ['uint8_t', '1', '0 to 255', 'ADC values, PWM duty, byte buffers - wraps silently'],
          ['int8_t', '1', '-128 to 127', 'Signed sensor deltas'],
          ['int16_t', '2', '-32768 to 32767', 'Encoder counts on a fast motor wrap in seconds'],
          ['uint16_t', '2', '0 to 65535', 'micros() timing differences, millisecond counters'],
          ['int32_t', '4', 'about +/-2.1e9', 'millis() overflows after about 49.7 days'],
          ['float (32-bit)', '4', 'about 7 significant digits', 'Position drift, accumulated sums'],
          ['double (64-bit)', '8', 'about 15-16 significant digits', 'Rarely available on small MCUs'],
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - the classic float accumulation error',
        problem: 'Adding 0.1 to a float accumulator ten million times: what do you expect, and what do you get?',
        solution: [
          'Expected: 1,000,000.0',
          'Actual with a 32-bit float: around 1,000,000 but with an error that grows as the sum grows, typically off by hundreds',
          'The reason: 0.1 has no exact binary representation, and once the accumulator is large the increment of 0.1 falls below the float\'s resolution at that magnitude, so additions stop having any effect at all',
          'Fix: accumulate in integers (count tenths) or use a 64-bit double, or restructure to multiply instead of repeatedly adding',
        ],
        answer: 'Accumulating small values into a growing float loses precision and eventually stops changing entirely',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Overflow is silent in C and C++',
        body: [
          'Incrementing a uint8_t past 255 wraps to 0 with no error and no warning. A byte counter of sensor packets, a millis()-based timeout on a 32-bit integer, or an encoder count in int16 will all wrap eventually. Write wrap-safe comparisons: `(uint8_t)(a - b) > threshold` rather than `a > b + threshold`, and always compute elapsed time as `now - start` so a single wrap cancels out.',
        ],
      },
    ],
    resources: [
      R('Floating point guide', 'article', 'https://floating-point-gui.de/', { minutes: 40, note: 'The clearest free explanation of why 0.1 + 0.2 != 0.3.' }),
      R('Fixed-width integer types', 'docs', 'https://en.cppreference.com/w/cpp/types/integer', { minutes: 25 }),
      R('Python: floating point arithmetic issues', 'docs', 'https://docs.python.org/3/tutorial/floatingpoint.html', { author: 'Python Software Foundation', minutes: 15 }),
    ],
    exercises: [
      X('code', 'Write a program that adds 0.1 to a float accumulator 1,000,000 times and prints the result. Then repeat with an integer counter of tenths, and with a double. Compare all three against the expected value of 100,000.', 25, {
        solution: 'The float version will be noticeably wrong and will eventually stop increasing. The integer version is exact. The double version is very close. This demonstrates that representation error is a property of the type, not of your arithmetic.',
      }),
      X('question', 'A uint16_t holds a millisecond timer. After how many seconds does it wrap? Write a wrap-safe expression for "has at least 500 ms elapsed since `start`?"', 12, { solution: '65536 ms = 65.5 seconds. Wrap-safe: `(uint16_t)(now - start) >= 500`. Because unsigned subtraction wraps consistently, the difference is correct even across a single wrap.' }),
      X('code', 'Write a function that takes a list of objects and returns a modified copy without mutating the input. Then deliberately write the buggy version that mutates the input, and explain which language feature caused it.', 20, { solution: 'The buggy version aliases the same objects: assigning `b = a` copies references, not values. Use a deep copy or construct new objects. In Python, `copy.deepcopy` or a list/dict comprehension that rebuilds each item.' }),
    ],
    questions: [
      mcq(1, 'In most languages, assigning one object variable to another copies:', ['A reference, so both names refer to the same object', 'The full object', 'Only the first field', 'Nothing until the object is used'], 0, 'Aliasing. Mutating through one name is visible through the other - a very common source of confusing bugs.'),
      mcq(1, 'A static type system checks types:', ['At compile time', 'At run time only', 'Never', 'Only in debug builds'], 0, 'Which shifts error detection earlier and enables optimisation. Dynamic systems check at run time.'),
      mcq(2, 'The maximum value of a uint8_t is:', ['255', '127', '65535', '256'], 0, 'Eight bits unsigned: 2^8 - 1 = 255. Incrementing past it wraps to 0 with no error.'),
      numeric(2, 'A uint16_t millisecond counter wraps after how many seconds?', 65.5, '65536 ms = 65.536 s.', { unit: 's' }),
      mcq(2, 'A 32-bit float provides approximately how many significant decimal digits?', ['7', '15', '3', '32'], 0, 'About 7. A double gives 15-16. This bounds how large an accumulator can grow before small additions vanish.'),
      mcq(3, 'Why does 0.1 + 0.2 != 0.3 exactly in floating point?', ['0.1 and 0.2 have no exact binary representation, so the sum carries a representation error', 'Because of a compiler bug', 'Because addition is not associative', 'It is exactly equal'], 0, 'Decimal fractions with factors other than 2 in the denominator cannot be represented exactly in binary.'),
      mcq(3, 'The wrap-safe way to test whether at least T milliseconds have elapsed is:', ['(now - start) >= T using unsigned arithmetic', 'now >= start + T', 'now > T', '(start - now) >= T'], 0, 'Unsigned subtraction wraps consistently, so the difference remains correct across a single overflow. `start + T` can itself overflow.'),
      mcq(3, 'Why is C++ preferred over Python for a ROS 2 node in a hard real-time control path?', [
        'Deterministic memory management and compiled performance give bounded, predictable timing',
        'C++ has better library support for robotics',
        'Python cannot do arithmetic',
        'C++ is easier to write',
      ], 0, 'Python remains excellent for planning, perception and tooling; the choice is about predictability in the inner loop.'),
    ],
    skills: ['swe-types', 'swe-numeric-representation'],
  }),

  lesson({
    id: 'prog-03',
    subject: 'programming',
    order: 3,
    title: 'Control Flow, Loops and Loop Invariants',
    difficulty: 'beginner',
    minutes: 35,
    prereqs: ['prog-02'],
    description: 'Conditionals, iteration, early exit, and how to reason about what a loop actually guarantees.',
    why: 'Robot control software is a loop with a deadline. Knowing exactly what each iteration guarantees - and what happens on the exit conditions - is the difference between a controller you can reason about and one you have to restart.',
    objectives: [
      'Choose the correct loop construct and state its termination condition',
      'Write and state a loop invariant, and use it to argue a loop is correct',
      'Avoid off-by-one and infinite-loop errors, including in embedded polling loops',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Every loop needs a provable exit',
        body: [
          'A for loop has an explicit counter and bound, so termination is usually obvious. A while loop terminates only if something inside the body moves toward the condition - if that is data-dependent, you need to prove it. Embedded polling loops are the dangerous case: `while (!sensor_ready()) {}` never exits if the sensor has failed or the wire is loose, and the robot stops responding entirely.',
          'The standard fix is a timeout: poll with a deadline, and handle the timeout as a first-class error path rather than hoping it never happens. Every hardware interaction in this roadmap should have a timeout.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Loop invariant reasoning',
        formula: 'An invariant is a statement that is true before the first iteration, preserved by each iteration, and - combined with the exit condition - implies the postcondition',
        defines: [
          'For a sum loop over indices 0..i-1, the invariant is: total equals the sum of elements 0 through i-1',
          'Proving the invariant plus the exit condition proves correctness - without running the code',
          'Off-by-one errors are almost always a mismatch between the invariant and the loop bound',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - off-by-one',
        problem: 'A loop is intended to process every element of a 10-element array. Which of these is wrong, and what does it do? (a) for i in range(10) (b) for i in range(1, 10) (c) for i in range(0, 11) (d) i = 0; while i <= 10',
        solution: [
          '(a) correct - indices 0 through 9',
          '(b) skips index 0 - processes 9 of 10 elements',
          '(c) index 10 is out of bounds - in C/C++ this is undefined behaviour and may read adjacent memory; in Python it raises IndexError',
          '(d) same out-of-bounds problem as (c), and if the body forgets to increment i it never terminates',
        ],
        answer: '(b) misses an element; (c) and (d) read out of bounds',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Out of bounds in C is not an exception - it is silent corruption',
        body: [
          'In Python an out-of-bounds index raises immediately and you fix it. In C, reading past an array returns whatever happens to be in adjacent memory, and writing past it corrupts other variables or the return address. The program may appear to work for weeks. This is why bounds are checked explicitly in embedded code, why buffer sizes are named constants, and why static analysis and sanitizers exist.',
        ],
      },
    ],
    resources: [
      R('Loop invariant', 'article', 'https://en.wikipedia.org/wiki/Loop_invariant', { minutes: 25 }),
      R('CS50x week 2: arrays and bounds', 'course', 'https://cs50.harvard.edu/x/', { author: 'Harvard', minutes: 180 }),
      R('Arduino: while and do-while reference', 'docs', 'https://docs.arduino.cc/language-reference/en/structure/control-structure/while/', { author: 'Arduino', minutes: 10 }),
    ],
    exercises: [
      X('code', 'Write a polling loop that waits for a flag with a 500 ms timeout, and demonstrate (with a simulated stuck flag) that it exits and reports the timeout rather than hanging.', 20, { solution: 'Record the start time, loop while `!ready && (now - start) < 500`, then branch on whether ready was true. The timeout path must be handled - log it, retry with backoff, or enter a safe state.' }),
      X('question', 'State the loop invariant for a loop that counts how many values in an array exceed a threshold, then use it to argue the final count is correct.', 15, { solution: 'Invariant: after processing index i, `count` equals the number of elements among indices 0..i-1 that exceed the threshold. True initially (i=0, count=0, empty range). Each iteration either increments count (element exceeds) or leaves it (does not), preserving the statement for i+1. At exit i == n, so count equals the number of exceeding elements among all n - which is the postcondition.' }),
      X('code', 'Write the same algorithm three ways - for loop, while loop, and a functional/iterator style - and confirm all three agree on a test array including an empty array and one where all elements exceed the threshold.', 20, { solution: 'Edge cases: empty array must give 0; all-exceeding must give n; none-exceeding must give 0. Testing the boundaries is what catches off-by-one errors.' }),
    ],
    questions: [
      mcq(1, 'Which construct is most at risk of never terminating?', ['A while loop whose condition depends on external data', 'A for loop over a fixed range', 'A loop with a constant bound', 'An if statement'], 0, 'If nothing in the body moves toward the condition, the loop runs forever. Always add a deadline for data-dependent waits.'),
      mcq(1, 'The correct fix for `while (!sensor_ready()) {}` in firmware is:', ['Add a timeout and handle the timeout as an error path', 'Add a small delay inside the loop', 'Convert it to a for loop', 'Nothing - it is correct as written'], 0, 'A delay only slows the hang down. A sensor that never asserts ready must be detected and handled.'),
      mcq(2, 'A loop invariant is:', ['A statement true before, during and at exit of every iteration', 'A variable that does not change', 'A comment describing the loop', 'The loop counter'], 0, 'Combined with the exit condition it proves the postcondition - correctness without executing the code.'),
      mcq(2, 'In C, `int a[10]; a[10] = 5;` results in:', ['Undefined behaviour - it writes past the array', 'A compile error', 'A runtime exception', 'The array automatically growing'], 0, 'It silently corrupts adjacent memory. In Python the equivalent raises IndexError immediately.'),
      numeric(2, 'How many iterations does `for (i = 0; i < 7; i += 2)` execute?', 4, 'i takes 0, 2, 4, 6 then becomes 8 and stops: 4 iterations.'),
      mcq(3, 'Which loop bound skips the first element of an array of length n?', ['for i in range(1, n)', 'for i in range(0, n)', 'for i in range(n)', 'for i in range(0, n-1)'], 0, 'range(1, n) starts at index 1. range(0, n-1) instead skips the LAST element.'),
      mcq(3, 'Why are out-of-bounds writes in C especially dangerous?', [
        'They corrupt adjacent memory silently and may not fail for a long time',
        'They always crash immediately, halting the system',
        'The compiler prevents them',
        'They only affect read operations',
      ], 0, 'Silent corruption is far harder to debug than an immediate crash, which is why sanitizers and static analysis are part of professional practice.'),
    ],
    skills: ['swe-control-flow'],
  }),

  lesson({
    id: 'prog-04',
    subject: 'programming',
    order: 4,
    title: 'Functions, Scope and Interfaces',
    difficulty: 'beginner',
    minutes: 40,
    prereqs: ['prog-03'],
    description: 'Designing functions with clear contracts, avoiding hidden state, and using interfaces to decouple modules.',
    why: 'A robot codebase is many subsystems that must be developed and tested separately: motor driver, sensor reader, planner, controller. Clean function and interface boundaries are what let you test the planner against a simulated robot - which is how real robotics development avoids needing hardware for every change.',
    objectives: [
      'Design a function with an explicit contract: inputs, outputs, side effects and error behaviour',
      'Explain scope, closures and the danger of hidden global state',
      'Define an interface (abstract boundary) and substitute a test double behind it',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A function is a contract',
        body: [
          'The contract states what it accepts, what it returns, what it changes outside itself (side effects), and what it does when given bad input. A function that honours its contract can be tested once and then trusted; a function whose behaviour depends on hidden global state cannot be tested at all, because the same call can produce different results.',
          'Prefer pure functions for computation - same inputs, same outputs, no side effects. Confine side effects (writing to hardware, network, disk) to a thin outer layer. This is not stylistic preference; it is what makes a control algorithm testable without a robot.',
        ],
      },
      {
        kind: 'text',
        heading: 'Interfaces let you substitute a simulation',
        body: [
          'An interface declares operations without implementing them: `read_distance()`, `set_motor(power)`, `get_imu()`. Your planner depends on the interface, not on the real ultrasonic driver. In production you inject the hardware implementation; in tests you inject a fake that returns scripted values.',
          'This is the mechanism behind hardware-in-the-loop and software-only development. It is also exactly how ROS 2 works: nodes communicate over typed topics, so a planner node cannot tell whether the sensor data came from a real LiDAR or from a Gazebo simulation. Same interfaces, different implementations.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - a testable motor interface',
        problem: 'Sketch an interface for a differential-drive robot and show how the same controller code runs against hardware and against a simulation.',
        solution: [
          'Interface: set_wheel_speeds(left_mps, right_mps), read_encoders() -> (left_m, right_m), read_imu_yaw() -> radians, stop()',
          'Hardware implementation: writes PWM to a motor driver over I2C and reads encoder counts over interrupt-driven counters',
          'Simulation implementation: integrates a simple kinematic model - given wheel speeds and dt, update x, y and yaw',
          'The controller and planner code is identical for both. You can develop, test and tune the whole stack in simulation before any hardware exists',
        ],
        answer: 'One interface, two implementations, unchanged application logic',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Global state is the usual culprit',
        body: [
          'When a function reads or writes a global, its behaviour depends on execution history. In a robot with interrupts and a main loop sharing globals, that also creates race conditions - a value can change mid-calculation. Use function parameters and return values, keep mutable shared state minimal and explicitly documented, and protect anything shared with an interrupt using a critical section or a volatile-qualified atomic access.',
        ],
      },
    ],
    resources: [
      R('Refactoring Guru: design and SOLID principles', 'article', 'https://refactoring.guru/design-principles/solid-principles', { minutes: 45, note: 'Free. Focus on Dependency Inversion - it is the principle behind testable robot code.' }),
      R('Python: classes and abstract base classes', 'docs', 'https://docs.python.org/3/library/abc.html', { author: 'Python Software Foundation', minutes: 30 }),
      R('Test doubles and dependency injection', 'article', 'https://en.wikipedia.org/wiki/Dependency_injection', { minutes: 25 }),
    ],
    exercises: [
      X('code', 'Define an abstract `Robot` interface with `set_wheel_speeds`, `read_encoders` and `stop`. Implement `SimulatedRobot` with a differential-drive kinematic model and `FakeRobot` returning scripted values. Write a controller that drives 1 m forward and verify it works against both.', 35, {
        solution: 'SimulatedRobot integrates: v = (vl + vr)/2, omega = (vr - vl)/track_width; then x += v*cos(yaw)*dt, y += v*sin(yaw)*dt, yaw += omega*dt. The controller should read encoders, compute remaining distance and stop within tolerance. Both implementations must pass the same test - that is the proof the interface is sufficient.',
      }),
      X('question', 'Below is a function with hidden state. List every way it can produce different results for identical arguments, then rewrite it as a pure function.\n\ncounter = 0\ndef step(cmd):\n    global counter\n    counter += 1\n    if counter % 10 == 0: return None\n    return cmd * gain', 25, {
        solution: 'It depends on the global `counter` (call history) and the global `gain` (which may be changed anywhere). Every tenth call returns None regardless of input. Pure version: `def step(cmd, gain, counter)` returning `(cmd*gain, counter+1)` - the caller owns the state, so behaviour is fully determined by arguments.',
      }),
      X('code', 'Add a timeout and an explicit error return to a hardware-reading function, and write three tests: success, timeout, and invalid argument.', 25, { solution: 'Return a discriminated result (e.g. a tuple or a small result type) rather than raising silently or returning None ambiguously. Tests must cover all three paths - untested error paths are where production failures hide.' }),
    ],
    questions: [
      mcq(1, 'A pure function is one that:', ['Returns the same output for the same input and has no side effects', 'Uses no arguments', 'Never returns None', 'Is short'], 0, 'Purity is what makes a function testable once and trustable forever.'),
      mcq(1, 'A function that reads a global variable modified elsewhere:', ['Has behaviour that depends on execution history, so it cannot be reliably tested', 'Is always faster', 'Is a pure function', 'Cannot have bugs'], 0, 'Hidden state is the most common obstacle to testing embedded and robotic code.'),
      mcq(2, 'An interface in software design is best described as:', ['A declared set of operations without a specific implementation', 'A user-facing screen', 'A global variable shared between modules', 'A compiler directive'], 0, 'It is a boundary that allows substitution - hardware for simulation, real for fake.'),
      mcq(2, 'Why does depending on an interface let you test a planner without hardware?', [
        'A simulated implementation can be injected that provides the same operations',
        'Because interfaces run faster',
        'Because hardware is not needed for compilation',
        'It does not; simulation requires the interface to be bypassed',
      ], 0, 'This is the dependency inversion principle, and it is the architectural basis of ROS 2 simulation.'),
      mcq(3, 'In ROS 2, a planner node cannot tell whether sensor data came from a real LiDAR or a simulator because:', [
        'Both publish the same message type on the same topic - the interface is identical',
        'ROS 2 disables hardware drivers in test mode',
        'Simulations are compiled into the planner',
        'It can always tell',
      ], 0, 'Typed topic interfaces are the substitution mechanism, applied at system scale.'),
      mcq(3, 'A function shared between a main loop and an interrupt handler that writes a global should:', ['Guard the shared state or use an atomic/volatile-qualified access', 'Be called from both without protection', 'Be converted to recursion', 'Use a class instead'], 0, 'Unprotected shared mutable state across an interrupt boundary is a race condition by construction.'),
      short(1, 'What do we call the outside effects a function has, such as writing to hardware or disk?', ['side effects', 'side effect'], 'Side effects. Confine them to a thin outer layer and keep computation pure.'),
    ],
    skills: ['swe-functions', 'swe-interfaces'],
  }),

  lesson({
    id: 'prog-05',
    subject: 'programming',
    order: 5,
    title: 'Problem Decomposition and Algorithmic Cost',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['prog-04'],
    description: 'Breaking a problem into parts, and Big-O reasoning about how cost grows with input size.',
    why: 'A robot\'s control loop has a hard deadline. An O(n^2) path planner that works for 100 grid cells will not finish in time for 10,000. Knowing how cost scales lets you predict failure before it happens on hardware, which is far cheaper than discovering it.',
    objectives: [
      'Decompose a stated problem into modules with defined interfaces and data flow',
      'Classify an algorithm by Big-O time and space complexity from its structure',
      'Predict whether an algorithm will meet a real-time deadline at a given input size',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Decomposition is finding the seams',
        body: [
          'Start from the data, not the code. What comes in (sensor readings, commands), what goes out (motor commands, telemetry), and what state must persist between them? Each distinct responsibility becomes a module with an interface. The test of a good decomposition: you can describe each module in one sentence without using the word "and".',
          'For a robot the natural seams are: acquisition (read sensors), estimation (fuse into a state), planning (decide what to do), control (compute actuator commands), actuation (drive hardware), and supervision (safety, logging, mode management). Nearly every robot architecture in existence is a variation on this.',
        ],
      },
      {
        kind: 'table',
        heading: 'Common complexities and what they cost in practice',
        columns: ['Complexity', 'Name', 'n = 1,000', 'n = 10,000', 'Practical verdict'],
        rows: [
          ['O(1)', 'constant', '1 op', '1 op', 'Ideal for control loops'],
          ['O(log n)', 'logarithmic', 'about 10', 'about 13', 'Excellent - binary search'],
          ['O(n)', 'linear', '1,000', '10,000', 'Fine for most real-time work'],
          ['O(n log n)', 'linearithmic', 'about 10,000', 'about 133,000', 'Good - the best possible for sorting'],
          ['O(n^2)', 'quadratic', '1,000,000', '100,000,000', 'Dangerous - 100x cost for 10x input'],
          ['O(2^n)', 'exponential', 'impossible', 'impossible', 'Only for tiny n - brute-force TSP'],
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - will it meet the deadline?',
        problem: 'A planner does O(n^2) work on a grid of n cells, taking 0.4 ms at n = 100. What does it cost at n = 1000, and can it run in a 50 ms cycle?',
        solution: [
          'Quadratic scaling: (1000/100)^2 = 100 times more work',
          '0.4 ms * 100 = 40 ms',
          'That is 80% of a 50 ms budget with nothing left for control, sensor reading or logging - it will miss the deadline under any load',
          'At n = 2000 it would be 160 ms: three missed cycles',
          'Fix: reduce n (coarser grid or hierarchical planning) or reduce complexity (A* is typically far below O(n^2) on sparse graphs)',
        ],
        answer: '40 ms at n = 1000 - it fits, but with no margin, and it fails as the map grows',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Big-O hides constants, and constants matter on a microcontroller',
        body: [
          'Big-O describes growth, not absolute speed. An O(n log n) algorithm with heavy allocation may lose to an O(n^2) algorithm with a tiny constant for n below a few hundred - which is most embedded workloads. Analyse complexity first to avoid a cliff, then measure to choose between close alternatives. Never optimise before measuring, but never skip the complexity analysis either: it tells you where the cliff is.',
        ],
      },
    ],
    resources: [
      R('Big-O cheat sheet', 'docs', 'https://www.bigocheatsheet.com/', { minutes: 20, note: 'Free one-page reference for data structure and algorithm complexities.' }),
      R('A Gentleman\u2019s Guide to Big-O', 'article', 'https://www.freecodecamp.org/news/big-o-notation/', { author: 'freeCodeCamp', minutes: 30 }),
      R('VisuAlgo - algorithm visualisation', 'simulator', 'https://visualgo.net/en', { author: 'NUS', minutes: 60, note: 'Free animations of sorting and graph algorithms. Watching them is the fastest way to build intuition.' }),
    ],
    exercises: [
      X('question', 'Decompose an obstacle-avoiding robot into modules. For each, state its single responsibility, its inputs, its outputs, and one thing it must NOT know about.', 30, {
        solution: 'Sensor acquisition: in = raw ADC/serial, out = filtered distances in metres, must not know about motor commands. Obstacle detection: in = distances, out = "clearance per direction", must not know about the map. Steering policy: in = clearance plus current speed, out = desired wheel speeds, must not know which sensor model is fitted. Motor driver: in = wheel speeds, out = PWM, must not know why the speeds were chosen. Safety monitor: in = all of the above plus battery, out = enable/stop, must not be bypassable by any other module.',
      }),
      X('calculation', 'An algorithm is O(n^2) and takes 2 ms at n = 200. Compute its cost at n = 400, 800 and 2000. At which n does it exceed a 100 ms budget?', 15, { solution: '400: 8 ms. 800: 32 ms. 2000: 2*(10)^2 = 200 ms. It exceeds 100 ms between n = 1400 (98 ms) and n = 1500 (112.5 ms).' }),
      X('code', 'Implement a duplicate-finder over a list two ways: nested loops and a hash set. Benchmark both on lists of 1,000 and 20,000 elements (random with some duplicates) and report the measured ratio against the predicted ratio.', 30, { solution: 'Nested loops are O(n^2), hash set is O(n) average. Going from 1,000 to 20,000 (20x) should cost about 400x more time for the nested version and about 20x for the hash version. Measured ratios will differ somewhat due to constants and caching - the point is that the growth RATE matches the prediction.' }),
    ],
    questions: [
      mcq(1, 'A good module decomposition is one where:', ['Each module has a single responsibility describable in one sentence', 'Every module can access every other module\'s state', 'There is exactly one module', 'Modules are as large as possible'], 0, 'Cohesion inside, loose coupling between. "And" in the description usually means two modules.'),
      mcq(2, 'Binary search on a sorted array is:', ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'], 0, 'Each step halves the search space - about 13 steps for 10,000 elements.'),
      mcq(2, 'Looking up a key in a hash map is on average:', ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], 0, 'Average case constant; worst case degrades to O(n) with many collisions, which is why hash quality matters.'),
      mcq(2, 'Comparing every pair of n items is:', ['O(n^2)', 'O(n)', 'O(n log n)', 'O(2^n)'], 0, 'About n^2/2 comparisons - the constant does not change the growth class.'),
      numeric(3, 'An O(n^2) algorithm takes 5 ms at n = 300. How many ms at n = 900?', 45, 'Tripling n multiplies cost by 9: 5*9 = 45 ms.', { unit: 'ms' }),
      mcq(3, 'A 20 ms control loop must run a planner. At n = 500 it takes 12 ms with O(n^2) complexity. What happens at n = 1000?', [
        'It takes about 48 ms and misses the deadline every cycle',
        'It takes 24 ms and still fits',
        'It takes 12 ms - complexity does not affect real time',
        'It takes 14 ms',
      ], 0, 'Doubling n quadruples the cost. This is why complexity analysis precedes deployment, not follows it.'),
      mcq(3, 'Why can an O(n^2) algorithm beat an O(n log n) one for small n?', [
        'Big-O hides constant factors, and a small constant can dominate at small input sizes',
        'Big-O is only valid asymptotically and small n is undefined',
        'O(n^2) is always faster',
        'It cannot',
      ], 0, 'Analyse complexity to find the cliff, then measure to decide between close alternatives at your actual n.'),
    ],
    skills: ['swe-decomposition', 'swe-complexity'],
  }),

  lesson({
    id: 'prog-06',
    subject: 'programming',
    order: 6,
    title: 'Systematic Debugging and Instrumentation',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['prog-05'],
    description: 'A repeatable debugging method, instrumentation and logging strategy, and how to debug hardware-coupled systems.',
    why: 'Robot bugs are the hardest kind: software, electronics, mechanics and the environment all interact, and the failure is often intermittent. Guess-and-check wastes weeks. A systematic method plus good instrumentation turns that into hours - this is arguably the highest-value lesson in the Software track.',
    objectives: [
      'Apply a structured debugging method: reproduce, isolate, hypothesise, verify, fix, regress',
      'Design instrumentation that captures enough to diagnose without changing behaviour',
      'Debug a hardware-coupled intermittent fault using bisection and controlled variable changes',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'The method',
        body: [
          '1. REPRODUCE. If you cannot make it happen on demand you cannot verify a fix. Find the conditions, write them down, and reduce them to the smallest reliable trigger. An intermittent bug you can trigger 1 time in 20 is workable; one you cannot trigger at all is not yet a bug you can solve.',
          '2. ISOLATE by bisection. Determine where the data first becomes wrong, not where the symptom appears. Read the value at the midpoint of the pipeline; if correct, move downstream, if wrong, move upstream. Each step halves the search space.',
          '3. HYPOTHESISE a single specific cause, stated so it could be proven false. 4. VERIFY with one change at a time. 5. FIX the cause, not the symptom. 6. REGRESS - add a test that fails before the fix and passes after.',
        ],
      },
      {
        kind: 'text',
        heading: 'Instrumentation is a design activity',
        body: [
          'Log the boundary values of every subsystem: raw sensor readings before filtering, filtered values after, the commanded output, and the measured response. Timestamp everything from a single clock. With those four series you can tell whether the sensor lied, the filter smoothed too hard, the command was wrong, or the mechanism did not follow the command - which are four completely different bugs with four different fixes.',
          'Keep logging cheap and asynchronous. Printing inside a 10 ms control loop over a 115200 baud serial link takes about 0.9 ms for 10 characters - nearly 10% of your budget, and it can change the timing enough to hide the bug you are chasing. Buffer and dump after, or log every Nth cycle.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - the robot drifts left',
        problem: 'A differential-drive robot consistently veers left when commanded to drive straight. Isolate the cause.',
        solution: [
          'Symptom appears at the wheels, but the fault could be anywhere upstream. Bisect.',
          'Check 1: log the commanded left/right PWM. If they are equal, the software command is fine - move downstream.',
          'Check 2: log the encoder counts over a fixed interval. If the left encoder reports more travel, the left wheel IS turning faster.',
          'Check 3: swap the two motor power leads. If it now veers RIGHT, the motors differ mechanically or electrically. If it still veers LEFT, the fault is in the chassis, wheel diameter or alignment.',
          'The likely cause: unequal wheel diameter, a slipping coupling, or motor characteristic mismatch. The fix is closed-loop control using encoder feedback - which is exactly why odometry-based velocity control exists rather than open-loop PWM',
        ],
        answer: 'Bisection plus a swap test localises it to hardware asymmetry, and the real fix is encoder feedback',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'One change at a time',
        body: [
          'Changing three things and having the bug disappear tells you nothing - you do not know which change fixed it, and the other two may have introduced new problems. This is the most common debugging failure mode, and it is why intermittent hardware bugs seem to "fix themselves" and then return. Write down each change and its result. A lab notebook is not bureaucracy; it is the tool.',
        ],
      },
    ],
    resources: [
      R('Debugging: the indispensable guide', 'article', 'https://www.debuggingrules.com/', { author: 'David Agans', minutes: 40, note: 'Free summary of the nine rules. The most practical debugging reference there is.' }),
      R('Arduino: minimal example / debugging practice', 'docs', 'https://docs.arduino.cc/software/ide-v1/tutorials/', { author: 'Arduino', minutes: 60 }),
      R('Logging best practices', 'article', 'https://en.wikipedia.org/wiki/Logging_(computing)', { minutes: 20 }),
    ],
    exercises: [
      X('question', 'Your robot stops responding randomly after 5-30 minutes. List five hypotheses, each stated so it could be proven false, and for each give the single measurement that would test it.', 25, {
        solution: 'Examples: (1) stack overflow from recursion depth growing with map size - measure peak stack usage. (2) memory leak - log free heap each minute. (3) battery voltage sag under load brownouting the MCU - log voltage at the MCU pin, not the battery. (4) a polling loop with no timeout hanging on a failed sensor - instrument each blocking call with a duration counter. (5) watchdog never enabled so a hang is permanent - check whether a watchdog reset flag is set after the freeze. Each hypothesis has one decisive measurement.',
      }),
      X('code', 'Instrument a control loop to log: timestamp, raw sensor, filtered sensor, commanded output, measured response - every 10th cycle to a ring buffer, dumped on demand. Verify the instrumentation adds less than 5% to loop time.', 35, { solution: 'A fixed-size ring buffer of structs, written without allocation, dumped over serial only when triggered. Measure loop time before and after with micros(). If the overhead exceeds 5%, reduce the log rate or defer serial writes to a lower-priority task.' }),
      X('question', 'Describe the swap test for the drifting robot above, and explain why it decisively separates an electrical fault from a mechanical one.', 15, { solution: 'Swapping motor leads reverses which physical motor receives which command. If the drift direction reverses with the swap, the fault travels with the motor (electrical/mechanical asymmetry in the motor or its driver channel). If the drift stays on the same physical side, the fault is in the chassis: wheel diameter, alignment, bearing friction or caster drag.' }),
    ],
    questions: [
      mcq(1, 'The first step in debugging an intermittent fault is:', ['Reproduce it reliably and record the conditions', 'Change the code until it stops', 'Add logging everywhere', 'Rewrite the module'], 0, 'Without reproduction you cannot verify a fix, and you may "fix" a bug that was never the one you saw.'),
      mcq(1, 'Bisection debugging means:', ['Checking the value at the pipeline midpoint and moving toward whichever half is wrong', 'Reading the code from the top down', 'Changing two things at once', 'Removing half the code permanently'], 0, 'Each step halves the search space, which is logarithmic in the size of the system.'),
      mcq(2, 'To diagnose whether a robot\'s fault is in sensing, filtering, control or actuation you should log:', [
        'Raw sensor, filtered value, commanded output and measured response, all on one clock',
        'Only the final motor command',
        'Only the sensor readings',
        'Nothing - reasoning from the code is sufficient',
      ], 0, 'The four boundary series localise the fault to a single stage. Anything less leaves you guessing.'),
      mcq(2, 'Why is printing inside a fast control loop dangerous while debugging?', [
        'Serial output is slow enough to change the loop timing, which can hide or create the fault',
        'Printing corrupts memory',
        'It cannot be removed later',
        'Serial is always asynchronous and free',
      ], 0, 'At 115200 baud, 10 characters take about 0.9 ms. Buffer and dump instead, or log every Nth cycle.'),
      mcq(3, 'You change three settings and the bug stops. What is the correct next action?', [
        'Revert to the original state and reapply the changes one at a time',
        'Keep all three changes and move on',
        'Add two more changes to be certain',
        'Declare the bug fixed',
      ], 0, 'Otherwise you do not know which change mattered, and the other two may have introduced new faults.'),
      mcq(3, 'A regression test for a bug fix must:', ['Fail before the fix and pass after it', 'Pass both before and after', 'Only run in production', 'Be written by a different person'], 0, 'That property is what proves the test actually exercises the bug. A test that passed before the fix proves nothing.'),
      mcq(3, 'A robot drifts left when commanded straight. After swapping motor leads it drifts right. What does that indicate?', [
        'The fault is associated with the motors or driver channels, not the chassis geometry',
        'The software command is wrong',
        'The wheels are different diameters',
        'The battery is failing',
      ], 0, 'A fault that follows the swap is electrical or motor-specific. A chassis fault would stay on the same physical side.'),
    ],
    skills: ['swe-debugging', 'swe-instrumentation'],
  }),
];
