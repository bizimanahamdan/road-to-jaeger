import { R, X, lesson, mcq, numeric, short } from './helpers';
import type { Lesson } from '@/lib/types';

/**
 * SOFTWARE / C & C++.
 *
 * The languages firmware and ROS 2 are written in. The emphasis throughout is
 * memory, determinism and the specific mistakes that cause a robot to crash
 * hours after startup rather than immediately.
 */
export const C_CPP_LESSONS: Lesson[] = [
  lesson({
    id: 'cc-01',
    subject: 'c-cpp',
    order: 1,
    title: 'C Fundamentals: Types, Control and Compilation',
    difficulty: 'intermediate',
    minutes: 50,
    prereqs: ['prog-03'],
    description: 'C syntax, fixed-width types, the compilation model, and the discipline C requires.',
    why: 'Every microcontroller you will program is programmed in C or C++. Arduino is C++. ESP-IDF is C. Linux device drivers are C. There is no path into embedded robotics that avoids it.',
    objectives: [
      'Write correct C using fixed-width integer types and explain why they are mandatory in embedded work',
      'Describe the compile, link and execute stages, and diagnose errors at each',
      'Use arrays, strings and functions correctly, including the pitfalls of C string handling',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Use stdint.h types, never bare int',
        body: [
          'The C standard does not fix the size of `int`, `long` or `short` - only their relative ordering. On an 8-bit AVR an int is 16 bits; on a 32-bit ARM it is 32 bits. Code written with bare `int` and tested on a desktop can silently overflow on the microcontroller it was written for.',
          'Always use `uint8_t`, `int16_t`, `uint32_t`, `int64_t` from stdint.h when the size matters - which is whenever you touch a register, a serial protocol, a buffer or a timing value. Format them with the macros from inttypes.h (PRIu32) rather than guessing %u or %lu.',
        ],
      },
      {
        kind: 'formula',
        heading: 'From source to running program',
        formula: 'preprocess (cpp) -> compile to object (cc1) -> assemble -> link (ld) -> executable',
        defines: [
          'A compile error is a syntax or type problem in one translation unit',
          'A LINK error (undefined reference) means a declaration existed but no definition was linked in',
          'A runtime crash with no message is usually memory corruption - a different problem entirely',
          'Each .c file is compiled independently; headers only provide declarations',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'C strings are a pointer and a convention',
        body: [
          'A C string is a char array terminated by a NUL byte. `strlen` counts until it finds that terminator, so an unterminated buffer makes it read past the end - undefined behaviour and a classic crash. Never use `strcpy` or `strcat`; use `strncpy` with an explicit size and force termination, or better `snprintf(dst, sizeof(dst), "%s", src)`. A buffer whose size is not tracked alongside it is a bug waiting for input.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - the overflow that only happens in the field',
        problem: 'A function accumulates a uint16_t millisecond counter and compares `if (now > start + timeout)`. What goes wrong after about 65 seconds?',
        solution: [
          'start + timeout can itself overflow uint16_t, wrapping to a small value',
          'Then now > small_value is true immediately, so the timeout fires early - or the comparison never becomes true and the wait never ends',
          'Correct form: if ((uint16_t)(now - start) > timeout)',
          'Because unsigned arithmetic wraps modulo 2^16 consistently, the DIFFERENCE remains correct across a single wrap while the SUM does not',
        ],
        answer: 'Compare elapsed time as a wrapped difference, never as an absolute sum',
      },
    ],
    resources: [
      R('Beej\u2019s Guide to C', 'book', 'https://beej.us/guide/bgc/', { author: 'Brian "Beej" Hall', minutes: 900, note: 'Free, complete and unusually clear. The best starting point for C.' }),
      R('Learn C (interactive)', 'practice', 'https://www.learn-c.org/', { minutes: 300, note: 'Free browser-based exercises - useful when your phone is the only device available.' }),
      R('stdint.h fixed-width types', 'docs', 'https://en.cppreference.com/w/c/types/integer', { minutes: 20 }),
    ],
    exercises: [
      X('code', 'Write a C program that reads a buffer of uint16_t ADC samples, computes the mean as a float, finds the median using a small insertion sort, and prints both with correct format specifiers. Compile with -Wall -Wextra -Wconversion and fix every warning.', 45, { solution: '-Wconversion catches the implicit narrowing from int to uint16_t and from float to int that cause most embedded bugs. Sum in a uint32_t to avoid overflowing uint16_t accumulation: 64 samples of 4095 needs 18 bits.' }),
      X('code', 'Implement a wrap-safe elapsed-time function for a uint32_t millisecond clock and test it across a simulated wrap (start near 0xFFFFFFFF).', 30, { solution: 'uint32_t elapsed(uint32_t now, uint32_t start) { return now - start; } Unsigned subtraction wraps correctly, so elapsed is right across one overflow. Test with start = 0xFFFFFF00 and now = 0x00000100, which should give 0x200 = 512 ms.' }),
    ],
    questions: [
      mcq(1, 'Why use uint16_t instead of int in embedded code?', ['Because the C standard does not fix the size of int, so behaviour can change between platforms', 'int is slower', 'int cannot hold positive values', 'uint16_t uses less memory than uint8_t'], 0, 'On an 8-bit AVR int is 16 bits; on ARM it is 32. Fixed-width types make the code portable and its limits explicit.'),
      mcq(1, 'An "undefined reference" error occurs at:', ['Link time - a declaration exists but no definition was linked in', 'Compile time', 'Run time', 'Preprocessing'], 0, 'Distinct from a compile error, which is a syntax or type problem inside one translation unit.'),
      mcq(2, 'A C string is:', ['A char array terminated by a NUL byte', 'A struct with a length field', 'A pointer plus a size', 'Immutable'], 0, 'The missing length is why buffer overruns happen: nothing tracks the capacity.'),
      mcq(2, 'Which is the safe replacement for strcpy?', ['snprintf(dst, sizeof(dst), "%s", src)', 'strcpy with a longer buffer', 'strcat', 'memcpy without a size'], 0, 'strncpy is better than strcpy but does not guarantee termination; snprintf always terminates within the given size.'),
      mcq(3, 'The wrap-safe test for "has timeout elapsed" on an unsigned clock is:', ['(uint16_t)(now - start) > timeout', 'now > start + timeout', 'now - start == timeout', 'start + timeout > now'], 0, 'Unsigned subtraction wraps consistently; the sum in the second form can itself overflow.'),
      numeric(3, 'A uint16_t millisecond counter wraps after how many seconds (1 dp)?', 65.5, '65536 ms = 65.536 s.', { unit: 's' }),
      mcq(3, 'Compiling with -Wall -Wextra -Wconversion is valuable because:', ['It surfaces implicit narrowing conversions that cause silent overflow on the target', 'It makes the binary smaller', 'It is required by the C standard', 'It enables optimisation'], 0, 'Warnings are free bug detection. Treating them as errors (-Werror) in CI prevents regressions.'),
      short(1, 'Which header provides uint8_t and uint32_t?', ['stdint.h', '<stdint.h>', 'stdint'], 'stdint.h in C, <cstdint> in C++.'),
    ],
    skills: ['c-basics'],
  }),

  lesson({
    id: 'cc-02',
    subject: 'c-cpp',
    order: 2,
    title: 'Pointers, Arrays and Memory in C',
    difficulty: 'advanced',
    minutes: 60,
    prereqs: ['cc-01', 'prog-01'],
    description: 'Pointer arithmetic, arrays versus pointers, stack versus heap, and the memory bugs that crash embedded systems.',
    why: 'Pointers are how you access hardware registers, how you write zero-copy drivers, and how you corrupt memory. There is no intermediate level of embedded competence that skips them. Most "random crashes after hours of running" are pointer or heap bugs.',
    objectives: [
      'Read and write pointer declarations, dereference correctly, and use pointer arithmetic',
      'Explain the difference between an array and a pointer, including array decay',
      'Identify and prevent the four classic memory errors: buffer overrun, dangling pointer, double free and memory leak',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Reading declarations',
        formula: 'int *p          - pointer to int      int arr[10]     - array of 10 ints      int *f()        - function returning pointer to int      void (*cb)(int) - pointer to a function taking int, returning void',
        defines: [
          '*p dereferences: reads or writes the pointed-to value',
          '&x takes the address of x',
          'p + 1 advances by sizeof(*p) bytes, NOT one byte',
          'arr decays to &arr[0] in most expressions - which is why sizeof(arr) works but sizeof(pointer) does not',
        ],
      },
      {
        kind: 'table',
        heading: 'The four memory bugs',
        columns: ['Bug', 'Cause', 'Symptom'],
        rows: [
          ['Buffer overrun', 'Writing past the end of an array', 'Corrupts adjacent variables or the return address; may work for weeks then crash'],
          ['Dangling pointer', 'Using memory after it was freed or after its stack frame returned', 'Reads garbage or crashes unpredictably'],
          ['Double free', 'Freeing the same heap block twice', 'Heap corruption, immediate or delayed crash'],
          ['Memory leak', 'Allocating without freeing', 'Free heap shrinks until allocation fails - the classic "works for 6 hours then dies"'],
        ],
      },
      {
        kind: 'text',
        heading: 'Embedded practice: do not use the heap at all',
        body: [
          'On a small microcontroller the professional approach is static allocation: fixed-size arrays and structs declared at file scope, plus ring buffers for anything that grows. There is then no fragmentation, no allocation failure at an inconvenient moment, and total memory use is known at compile time - you can read it off the linker map.',
          'If you must allocate, do it once during initialisation and never in the run loop. Dynamic allocation inside an interrupt handler or a control loop is a defect, not a style choice.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Never return a pointer to a local variable',
        body: [
          'A local array lives on the stack frame of the function that created it. When that function returns, the frame is released and may be overwritten by the next call. The returned pointer still holds an address - it just points at memory that now belongs to something else. The code often appears to work in a simple test and fails in the real program, which is the worst possible failure pattern.',
        ],
      },
    ],
    resources: [
      R('Beej\u2019s Guide to C: pointers', 'book', 'https://beej.us/guide/bgc/html/split/pointers.html', { author: 'Brian "Beej" Hall', minutes: 90 }),
      R('C pointer declaration reference', 'docs', 'https://en.cppreference.com/w/c/language/pointer', { minutes: 40 }),
      R('Valgrind / AddressSanitizer', 'tool', 'https://valgrind.org/', { minutes: 60, note: 'Free. Run every C program you write under a sanitizer during development; it finds bugs you cannot.' }),
    ],
    exercises: [
      X('code', 'Write a function that copies a NUL-terminated string with an explicit destination capacity, guaranteeing termination and reporting truncation. Test it with a destination one byte too small, exactly the right size, and larger.', 35, { solution: 'Signature like `bool safe_copy(char *dst, size_t dst_size, const char *src)` returning false on truncation. Always write dst[dst_size-1] = 0. Test the one-byte case specifically - that is where off-by-one lives.' }),
      X('code', 'Compile a program with a deliberate buffer overrun and a deliberate leak under -fsanitize=address and report exactly what it detects and where. Then fix both and confirm a clean run.', 40, { solution: 'ASan reports the overrun with the offending line and the allocation site, and LeakSanitizer reports leaked blocks at exit with their allocation stacks. This exercise teaches you to trust the tool, which is the point.' }),
      X('question', 'Explain why a program with a small heap leak can run correctly for six hours and then fail, and give two design choices that make this class of failure impossible.', 20, { solution: 'Free heap shrinks monotonically until an allocation fails; if the failure path is unhandled the program crashes or behaves unpredictably, and the timing depends on allocation rate. Fixes: (1) static allocation only - no heap at all, so memory use is fixed at link time, (2) allocate once at initialisation and reuse buffers via ring buffers, so no allocation occurs in the run loop. Monitoring free heap and alerting on a downward trend catches it in test.' }),
    ],
    questions: [
      mcq(1, 'For `int *p` pointing at arr[0], `p + 1` points to:', ['arr[1] - it advances by sizeof(int) bytes', 'The next byte in memory', 'arr[0] plus one', 'Undefined memory'], 0, 'Pointer arithmetic is scaled by the pointed-to type. This is why casting a pointer changes how arithmetic behaves.'),
      mcq(1, 'When an array is passed to a function it:', ['Decays to a pointer, so the function cannot determine its length', 'Is copied entirely', 'Becomes a struct', 'Retains its size via sizeof'], 0, 'Always pass the length as a separate parameter. This single rule prevents most buffer overruns.'),
      mcq(2, 'Returning a pointer to a local array is:', ['Undefined behaviour - the stack frame no longer belongs to you', 'Safe if the array is small', 'Safe if the caller uses it immediately', 'A memory leak'], 0, 'It often appears to work in simple tests and fails in real programs, which makes it especially dangerous.'),
      mcq(2, 'A program that runs for six hours then fails on allocation most likely has:', ['A memory leak', 'A stack overflow', 'A double free', 'A compile error'], 0, 'Free heap decreases monotonically. Log free heap during long tests to catch it early.'),
      mcq(2, 'A double free causes:', ['Heap corruption that may crash immediately or much later', 'A compiler warning', 'Nothing - the second free is ignored', 'A memory leak'], 0, 'Set pointers to NULL after freeing, and check before freeing, to make the error impossible.'),
      mcq(3, 'The professional embedded approach to dynamic memory is:', ['Avoid the heap; use static allocation and fixed-size buffers', 'Always use malloc/free in pairs', 'Use a garbage collector', 'Allocate freely and monitor'], 0, 'Static allocation makes total memory use known at compile time and eliminates fragmentation and allocation failure.'),
      mcq(3, 'Which tool detects buffer overruns and leaks in C on a desktop build?', ['AddressSanitizer (-fsanitize=address) or Valgrind', 'A debugger alone', 'printf statements', 'The compiler warnings alone'], 0, 'Run every C program under a sanitizer during development. They find bugs that testing cannot.'),
      numeric(1, 'If `int` is 4 bytes and p points to arr[0], how many bytes does p + 3 advance?', 12, '3 * sizeof(int) = 12 bytes.', { unit: 'bytes' }),
    ],
    skills: ['c-pointers', 'c-memory'],
  }),

  lesson({
    id: 'cc-03',
    subject: 'c-cpp',
    order: 3,
    title: 'C for Embedded: Registers, volatile and Interrupts',
    difficulty: 'advanced',
    minutes: 55,
    prereqs: ['cc-02'],
    description: 'Memory-mapped registers, bit manipulation, volatile, interrupt service routines and shared data.',
    why: 'This is the layer directly above the silicon. Whether you use a framework or not, you will read datasheet register descriptions and debug an ISR. Understanding it turns a microcontroller from a black box into a device you can reason about.',
    objectives: [
      'Manipulate individual bits with masks to set, clear, toggle and test register fields',
      'Explain what volatile means and when it is required',
      'Write an interrupt service routine and protect data shared with the main loop',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Bit manipulation - the four operations',
        formula: 'set:   reg |= (1 << n)      clear: reg &= ~(1 << n)      toggle: reg ^= (1 << n)      test:  if (reg & (1 << n))',
        defines: [
          'Use |= and &= rather than reg = value, which would destroy the other bits in the register',
          'For multi-bit fields: reg = (reg & ~MASK) | ((value << SHIFT) & MASK)',
          'Always read the datasheet for the bit layout; guessing it is how peripherals get misconfigured',
        ],
      },
      {
        kind: 'text',
        heading: 'volatile tells the compiler the value can change underneath you',
        body: [
          'Without volatile the optimiser is free to cache a variable in a register, because from its view of the code nothing modifies it. But a hardware register changes when the peripheral updates it, and a variable changes when an interrupt handler writes it - neither is visible to the optimiser\'s analysis.',
          'The consequences are concrete: `while (!flag) {}` with a non-volatile flag that an ISR sets becomes an infinite loop at -O2, because the compiler loads flag once and loops on the cached copy. `while (!(REG & MASK)) {}` without volatile on a hardware register can be optimised into a single read. Mark both volatile.',
          'Note that volatile does NOT make an access atomic and does NOT provide memory ordering between cores. On a multi-core system you need proper synchronisation primitives; volatile alone is not sufficient.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Interrupt service routine discipline',
        body: [
          'An ISR must be short and must not block. Never call a blocking function, never allocate memory, never take a mutex that the main loop might hold (the ISR can preempt the holder - deadlock), and avoid printf or float arithmetic unless you have measured the cost. Set a flag or write to a ring buffer and return. Do the work in the main loop.',
          'Data shared between an ISR and the main loop needs protection. For a single byte or an aligned word on most 8/32-bit targets, the read or write is naturally atomic - use volatile. For anything larger (a 32-bit value on an 8-bit CPU, a struct, a buffer index pair), disable interrupts briefly around the access: a critical section.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - encoder counting in an ISR',
        problem: 'An encoder produces interrupts on each edge. Count pulses and make the count safely readable from the main loop on an 8-bit MCU with a 32-bit counter.',
        solution: [
          'volatile uint32_t pulse_count; incremented inside the ISR',
          'On an 8-bit MCU a 32-bit read is NOT atomic - it is four byte reads, and an interrupt between them gives a torn value',
          'Main loop: disable interrupts, copy pulse_count to a local, re-enable, then use the copy',
          'In Arduino terms: noInterrupts(); uint32_t local = pulse_count; interrupts();',
          'Alternatively, have the ISR only increment a uint8_t and let the main loop accumulate - keeping the shared object to a naturally atomic size',
        ],
        answer: 'Copy the shared value inside a critical section, or keep the shared object naturally atomic',
      },
    ],
    resources: [
      R('AVR datasheets and register descriptions', 'docs', 'https://ww1.microchip.com/downloads/en/DeviceDoc/ATmega48A-PA-88A-PA-168A-PA-328-P-Data-Sheet-40002061A.pdf', { author: 'Microchip', minutes: 120, note: 'Free. Reading a real datasheet register table is the skill this lesson is about.' }),
      R('ESP-IDF programming guide', 'docs', 'https://docs.espressif.com/projects/esp-idf/en/stable/esp32/', { author: 'Espressif', minutes: 300, note: 'Free, and representative of modern embedded C practice including FreeRTOS.' }),
      R('volatile keyword', 'article', 'https://en.wikipedia.org/wiki/Volatile_(computer_programming)', { minutes: 25 }),
    ],
    exercises: [
      X('code', 'Write macros SET_BIT(reg, n), CLEAR_BIT(reg, n), TOGGLE_BIT(reg, n), TEST_BIT(reg, n) and a WRITE_FIELD(reg, mask, shift, value). Test them on a uint8_t with a known pattern and verify no other bits change.', 35, { solution: 'Test each macro against 0x00, 0xFF and 0xA5 and check every bit position. WRITE_FIELD must clear the field before setting it: reg = (reg & ~(mask << shift)) | ((value & mask) << shift).' }),
      X('code', 'Write a program where an ISR increments a shared counter and the main loop reads it safely. Demonstrate the failure mode by removing volatile and compiling with -O2, then restore it and explain what changed.', 40, { solution: 'Without volatile at -O2 the compiler may hoist the read out of the loop, so the main loop never sees updates. With volatile it must reload each iteration. Show the generated assembly difference if you can - it makes the concept concrete.' }),
      X('question', 'Your ISR calls a function that prints over serial at 115200 baud. Explain the consequences for a 1 kHz interrupt rate and redesign it correctly.', 20, { solution: 'At 115200 baud, one character takes about 87 us. A 20-character print takes 1.7 ms - longer than the 1 ms interrupt period, so interrupts queue, the buffer overflows, and the main loop starves. Redesign: the ISR writes compact binary records to a ring buffer; a low-priority task formats and transmits them, or the buffer is dumped after the run completes.' }),
    ],
    questions: [
      mcq(1, 'To set bit 3 of a register without disturbing other bits, use:', ['reg |= (1 << 3)', 'reg = (1 << 3)', 'reg &= (1 << 3)', 'reg |= 3'], 0, 'Assignment would clear every other bit - a common and destructive mistake when configuring peripherals.'),
      mcq(1, 'To clear bit 5 use:', ['reg &= ~(1 << 5)', 'reg |= ~(1 << 5)', 'reg ^= (1 << 5)', 'reg &= (1 << 5)'], 0, 'AND with the complement of the mask clears exactly that bit and leaves the rest.'),
      mcq(2, 'volatile is required for a variable when:', ['It can be modified outside the compiler\'s view - by hardware or an interrupt handler', 'It is a global', 'It is used in a loop', 'It is a pointer'], 0, 'Without it the optimiser may cache the value, turning a wait loop into an infinite loop.'),
      mcq(2, 'volatile guarantees:', ['That the compiler reloads the value on each access - nothing more', 'Atomic access', 'Memory ordering across cores', 'Thread safety'], 0, 'It prevents caching and reordering of that access by the compiler. Atomicity and cross-core ordering need separate mechanisms.'),
      mcq(3, 'An ISR must NOT:', ['Block, allocate memory, or take a mutex the main loop may hold', 'Set a flag', 'Write to a ring buffer', 'Increment a counter'], 0, 'It preempts the main loop, so blocking or locking there can deadlock or starve everything else.'),
      mcq(3, 'Reading a 32-bit shared counter on an 8-bit MCU from the main loop requires:', ['A critical section, because the read is four byte reads and can be torn', 'Nothing - 32-bit reads are always atomic', 'volatile only', 'A mutex'], 0, 'volatile does not make multi-word access atomic. Disable interrupts briefly and copy.'),
      numeric(3, 'At 115200 baud with 8N1 (10 bits per character), how many microseconds does one character take?', 86.8, '10/115200 s = 86.8 us.', { unit: 'us' }),
      mcq(3, 'Why is printing inside a high-rate ISR harmful?', [
        'Serial transmission is slow relative to the interrupt period, so the system queues and starves',
        'Printing corrupts the serial peripheral',
        'ISRs cannot call functions',
        'It only wastes memory',
      ], 0, 'Buffer binary records in the ISR; format and transmit from a lower-priority context.'),
    ],
    skills: ['c-embedded', 'c-interrupts'],
  }),

  lesson({
    id: 'cc-04',
    subject: 'c-cpp',
    order: 4,
    title: 'C++: Classes, RAII and Resource Ownership',
    difficulty: 'advanced',
    minutes: 55,
    prereqs: ['cc-03'],
    description: 'Classes, constructors and destructors, RAII, and smart pointers as explicit ownership.',
    why: 'RAII is the single most valuable idea in C++ for robotics: resources are released automatically and deterministically when an object goes out of scope. It is how you guarantee a motor is stopped, a file is closed and a lock is released even when an exception or early return occurs.',
    objectives: [
      'Design a class with correct construction, destruction and copy/move semantics',
      'Explain RAII and apply it to hardware resources such as a motor driver or a serial port',
      'Choose between unique_ptr, shared_ptr and no dynamic allocation, with justification',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'RAII: acquisition is initialisation',
        body: [
          'A resource is acquired in a constructor and released in a destructor. Because C++ guarantees a destructor runs when an object leaves scope - including on an early return or during exception unwinding - the resource cannot leak. This replaces the error-prone C pattern of "remember to close it on every path".',
          'Applied to robotics: a `MotorGuard` object sets the motor to a safe state in its destructor. A `SerialPort` closes the device. A `LockGuard` releases the mutex. A `StopOnExit` object halts all actuators if the control task dies for any reason. These are the mechanisms that make a robot fail safe rather than fail running.',
        ],
      },
      {
        kind: 'formula',
        heading: 'The rule of five (and zero)',
        formula: 'If a class manages a resource, declare or delete: destructor, copy constructor, copy assignment, move constructor, move assignment',
        defines: [
          'If it manages nothing, declare none of them - the compiler-generated versions are correct (rule of zero)',
          'A class with a destructor but no copy control will double-free when copied',
          'Simplest fix for a hardware handle: delete copying entirely (ClassName(const ClassName&) = delete)',
          'unique_ptr enforces single ownership and cannot be copied, only moved',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Smart pointers allocate - and embedded may not want that',
        body: [
          'std::unique_ptr and std::shared_ptr are heap-based. In a small MCU project the RAII principle still applies, but you implement it with static objects and no allocation: a class whose constructor configures a peripheral and whose destructor disables it, created at file scope or inside a bounded initialisation function. shared_ptr additionally carries a control block and an atomic reference count, which is measurably expensive - avoid it in real-time paths.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - a fail-safe motor wrapper',
        problem: 'Design a C++ wrapper that guarantees a motor is stopped if the controlling function exits for any reason.',
        solution: [
          'class Motor { public: explicit Motor(Pin pwm, Pin dir); ~Motor() { stop(); } void set(int16_t speed); void stop(); Motor(const Motor&) = delete; Motor& operator=(const Motor&) = delete; private: Pin pwm_, dir_; };',
          'The destructor calls stop(), so any scope exit - normal return, early return, exception - leaves the motor safe',
          'Copying is deleted because two objects driving the same pin would both try to stop it',
          'For a whole-robot guarantee, hold a top-level `SafetyGuard` in the control task whose destructor commands every actuator to a safe state',
        ],
        answer: 'RAII destructor plus deleted copy operations, with a top-level guard for the whole machine',
      },
    ],
    resources: [
      R('LearnCpp.com', 'book', 'https://www.learncpp.com/', { minutes: 2400, note: 'Free, thorough and kept current. Chapters on classes, constructors and smart pointers are the ones to read.' }),
      R('cppreference: RAII and smart pointers', 'docs', 'https://en.cppreference.com/w/cpp/memory/unique_ptr', { minutes: 60 }),
      R('C++ Core Guidelines', 'docs', 'https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines', { author: 'Stroustrup and Sutter', minutes: 300, note: 'Free. Read the R (resource) and CP (concurrency) sections.' }),
    ],
    exercises: [
      X('code', 'Implement a SerialPort RAII wrapper that opens a device in the constructor and closes it in the destructor, with copying deleted and moving allowed. Verify with a test that the descriptor is closed on every exit path including an exception.', 45, { solution: 'Move operations must transfer ownership and null out the source handle, otherwise both objects close the same descriptor - a double-close bug identical to a double free. Test by forcing an exception between open and the end of scope.' }),
      X('code', 'Write a Motor class as described above with a destructor that stops the motor, and a scope-based test proving the motor is stopped when the enclosing function throws. Then add a top-level SafetyGuard for two motors.', 40, { solution: 'The test should record the sequence of calls; destruction order is reverse of construction, so guards should be declared in the order you want them released last-first.' }),
    ],
    questions: [
      mcq(1, 'RAII guarantees that:', ['A resource held by an object is released when the object is destroyed, on every scope exit path', 'Memory is garbage collected', 'Exceptions cannot occur', 'Constructors run before main'], 0, 'Destructors run on normal return, early return and exception unwinding - which is what makes it reliable.'),
      mcq(1, 'A class that manages a raw resource but declares no copy operations will:', ['Double-free when copied, because the compiler-generated copy duplicates the handle', 'Fail to compile', 'Work correctly', 'Leak only'], 0, 'This is the rule of five. For hardware handles the simplest correct fix is to delete copying.'),
      mcq(2, 'std::unique_ptr enforces:', ['Single ownership - it cannot be copied, only moved', 'Shared ownership', 'Stack allocation', 'Reference counting'], 0, 'shared_ptr is the reference-counted shared-ownership pointer, and carries an atomic count.'),
      mcq(2, 'Why is shared_ptr often avoided in real-time embedded code?', ['Its control block and atomic reference count cost heap allocation and measurable time', 'It cannot hold hardware objects', 'It is not standard C++', 'It leaks memory'], 0, 'Prefer static objects with RAII semantics, or unique_ptr allocated once at initialisation.'),
      mcq(3, 'A Motor class whose destructor calls stop() provides:', ['A fail-safe guarantee that the motor is not left driven after an abnormal exit', 'Better performance', 'Thread safety', 'Automatic calibration'], 0, 'This is the pattern that makes a robot stop when its software fails rather than continuing to drive.'),
      mcq(3, 'When implementing move operations for a resource handle you must:', ['Transfer ownership and null the source handle, so only one object closes it', 'Copy the handle', 'Do nothing', 'Call the destructor twice'], 0, 'Leaving the source holding a valid handle causes a double close - the file-descriptor equivalent of a double free.'),
      short(1, 'What is the name of the guideline that says declare none of the special members if you manage no resource?', ['rule of zero', 'the rule of zero'], 'The rule of zero. Its counterpart for resource-managing classes is the rule of five.'),
      mcq(3, 'Destructors of objects in the same scope run in:', ['Reverse order of construction', 'Construction order', 'Alphabetical order', 'An unspecified order'], 0, 'Which is why a safety guard declared first is destroyed last - and must be declared with that in mind.'),
    ],
    skills: ['cpp-classes', 'cpp-raii'],
  }),

  lesson({
    id: 'cc-05',
    subject: 'c-cpp',
    order: 5,
    title: 'C++ for Robotics: Determinism, STL and Real-Time Constraints',
    difficulty: 'advanced',
    minutes: 55,
    prereqs: ['cc-04'],
    description: 'Writing C++ that meets deadlines: allocation discipline, container costs, and the structure of a control node.',
    why: 'ROS 2 nodes are C++. A control loop that misses its deadline does not merely run slowly - it changes the dynamics the controller was tuned for, and can destabilise the robot. This lesson is about writing C++ whose timing you can predict.',
    objectives: [
      'Identify which standard library operations allocate and therefore threaten a real-time deadline',
      'Structure a control loop with a fixed period, allocation-free steady state and jitter measurement',
      'Explain how ROS 2 node structure relates to these constraints',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Allocation behaviour of common containers',
        columns: ['Operation', 'Allocates?', 'Real-time safe?'],
        rows: [
          ['std::vector push_back beyond capacity', 'Yes - reallocation and copy', 'No'],
          ['std::vector push_back within reserved capacity', 'No', 'Yes'],
          ['std::array access', 'No - fixed size at compile time', 'Yes'],
          ['std::deque push', 'Yes - new chunk', 'No'],
          ['std::map / std::set insert', 'Yes - one node per element', 'No'],
          ['std::unordered_map insert', 'Yes, and may rehash', 'No'],
          ['std::string append beyond capacity', 'Yes', 'No'],
          ['Ring buffer over std::array', 'No', 'Yes'],
        ],
      },
      {
        kind: 'text',
        heading: 'The pattern that works',
        body: [
          'Allocate everything during initialisation: reserve vector capacity, create buffers, open handles, warm up any lazily-initialised paths. In the steady-state loop, do no allocation at all. Use fixed-capacity containers (std::array plus a count, or a ring buffer), reuse message objects, and avoid std::function or virtual dispatch in the innermost loop if you have measured them to matter.',
          'Then measure. Log the loop period every cycle and report the maximum and the distribution - not the average. A loop with a 10 ms mean and a 40 ms maximum is a broken loop. Jitter is the metric that matters, and you cannot know it without measuring it.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - a fixed-period control loop',
        problem: 'Write the skeleton of a 100 Hz control loop that does not drift and measures its own jitter.',
        solution: [
          'Compute the next deadline absolutely: next += period. Do NOT sleep a fixed duration after doing work, or the loop period becomes work_time + period and drifts',
          'If now > next, a cycle was missed - count it and log it rather than silently running slow',
          'Read sensors, estimate state, run the controller, write actuators, log - all with preallocated buffers',
          'Track period_min, period_max and a histogram; publish the maximum, because that is the number that determines stability margins',
          'Optionally catch up by running the controller with the true elapsed dt, so the maths stays correct even if the timing does not',
        ],
        answer: 'Absolute deadlines, missed-cycle detection, and max-jitter reporting',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'How ROS 2 relates',
        body: [
          'A ROS 2 node runs callbacks driven by an executor. Timers give you a periodic callback; the executor decides when it runs. On a general-purpose Linux kernel this jitter is milliseconds, which is fine for navigation at 10 Hz and not fine for balance control at 500 Hz. For hard real-time you need a real-time kernel (PREEMPT_RT), pinned CPU cores, a locked memory pool and careful QoS settings - or you move that loop onto a microcontroller, which is the common and pragmatic architecture: an MCU runs the fast inner loop, a single-board computer runs perception and planning.',
        ],
      },
    ],
    resources: [
      R('C++ Core Guidelines: concurrency and real-time rules', 'docs', 'https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines', { author: 'Stroustrup and Sutter', minutes: 180 }),
      R('ROS 2 executors and real-time considerations', 'docs', 'https://docs.ros.org/en/rolling/Concepts/Intermediate/About-Executors.html', { author: 'Open Robotics', minutes: 60 }),
      R('cppreference: container requirements', 'docs', 'https://en.cppreference.com/w/cpp/container', { minutes: 60 }),
    ],
    exercises: [
      X('code', 'Implement a 100 Hz loop with absolute deadlines, missed-cycle counting, and min/max/mean period reporting. Run it for 60 seconds while another thread does heavy allocation, and report the measured maximum period.', 45, { solution: 'On a general-purpose OS the maximum will be far above 10 ms under load - often 20-60 ms. That single number is the argument for PREEMPT_RT, CPU isolation, or moving the loop to an MCU.' }),
      X('code', 'Refactor a loop that uses std::map and push_back into one that allocates nothing in steady state: reserve capacity, replace the map with a fixed array indexed by an enum, and replace dynamic buffers with a ring buffer. Measure the improvement in maximum period.', 45, { solution: 'The typical result is a dramatic reduction in worst-case period, with the mean barely changed. This demonstrates that mean performance hides the problem - the tail is what matters.' }),
    ],
    questions: [
      mcq(1, 'Which operation is safe in a real-time steady-state loop?', ['Accessing a std::array element', 'std::map insert', 'vector push_back beyond capacity', 'std::string append'], 0, 'std::array has a compile-time size and no allocation. All the others can allocate.'),
      mcq(1, 'vector::push_back within reserved capacity:', ['Does not allocate, so it is safe after an explicit reserve()', 'Always allocates', 'Is O(n)', 'Cannot be used in a loop'], 0, 'reserve() up front converts an amortised reallocation into a bounded, pre-paid cost.'),
      mcq(2, 'A control loop should compute its next deadline by:', ['Adding the period to the previous deadline (absolute)', 'Sleeping for the period after finishing work', 'Sleeping a fixed 1 ms', 'Using the mean loop time'], 0, 'Sleeping a fixed duration after work makes the period equal work_time + period, which drifts and varies with load.'),
      mcq(2, 'The most important timing metric for a control loop is:', ['The maximum (worst-case) period, not the mean', 'The mean period', 'The total runtime', 'CPU usage percentage'], 0, 'A loop with a 10 ms mean and a 40 ms maximum misses deadlines and invalidates the tuning. Measure the tail.'),
      mcq(3, 'When a cycle is missed, the correct behaviour is to:', ['Count and log it, and run the controller with the true elapsed dt', 'Silently continue', 'Stop the robot immediately every time', 'Double the next period'], 0, 'Detection plus correct dt keeps the maths valid; the log tells you whether the deadline is achievable at all.'),
      mcq(3, 'For a 500 Hz balance loop the usual architecture is:', ['Run it on a microcontroller, with the single-board computer handling perception and planning', 'Run it in a ROS 2 node on a desktop kernel', 'Run it in Python', 'Run it in the same loop as the planner'], 0, 'General-purpose Linux jitter of milliseconds is unacceptable at 2 ms periods without a real-time kernel and isolation.'),
      mcq(3, 'Why does std::function in an inner loop sometimes matter?', ['It may allocate for large captures and adds indirect call overhead that blocks inlining', 'It cannot be used in C++17', 'It is always slower than a virtual call', 'It requires heap memory always'], 0, 'Measure before optimising, but in a tight 2 ms loop these costs can be a significant fraction of the budget.'),
      numeric(2, 'A 100 Hz loop has what period in milliseconds?', 10, '1/100 s = 10 ms.', { unit: 'ms' }),
    ],
    skills: ['cpp-realtime', 'cpp-stl'],
  }),

  lesson({
    id: 'cc-06',
    subject: 'c-cpp',
    order: 6,
    title: 'Build Systems: Compilation Model, Make and CMake',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['cc-01'],
    description: 'Headers, translation units, linking, and reproducible builds with Make and CMake.',
    why: 'A robot project mixes firmware, host tools and ROS packages across machines. If it cannot be built reproducibly from a clean checkout, you cannot deploy it, test it in CI, or hand it to anyone else. Build knowledge is what makes a project real rather than a folder of files.',
    objectives: [
      'Explain translation units, headers, the one-definition rule and how linking resolves symbols',
      'Write a Makefile with correct dependency tracking for a multi-file C project',
      'Configure a CMake project with targets, include paths and a toolchain file for cross-compilation',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'What actually happens when you build',
        body: [
          'Each .c or .cpp file is a translation unit: the preprocessor expands its #includes into one large source, which the compiler turns into an object file containing machine code plus a table of defined and undefined symbols. The linker then combines object files and libraries, resolving each undefined symbol to exactly one definition.',
          'That is why a header should contain declarations, not definitions. A variable or non-inline function defined in a header included by three translation units produces three definitions and a link error - the one-definition rule. Inline functions, templates and constexpr values are the deliberate exceptions.',
          'Include guards (#pragma once or #ifndef) prevent a header being expanded twice in one translation unit, which would otherwise redeclare everything.',
        ],
      },
      {
        kind: 'formula',
        heading: 'A minimal correct Makefile',
        formula: 'CC, CFLAGS (-Wall -Wextra -O2 -MMD -MP), objects from sources, link rule, per-object compile rule, -include $(DEPS), clean target',
        defines: [
          '-MMD -MP makes the compiler emit header dependencies, so touching a header rebuilds exactly the right objects',
          '-include $(DEPS) pulls those .d files in; the leading dash ignores their absence on a first build',
          'Automatic variables: $@ is the target, $< the first prerequisite, $^ all prerequisites',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Cross-compilation is a toolchain file, not a hack',
        body: [
          'Building ARM firmware on an x86 laptop is cross-compilation: a different compiler (arm-none-eabi-gcc), different flags (-mcpu, -mthumb), a linker script describing the target\'s memory layout, and no host standard library. CMake handles this cleanly through a toolchain file that sets CMAKE_SYSTEM_NAME, CMAKE_C_COMPILER and the flags - so the same project builds for host tests and for the target. This separation is what lets you unit-test logic on your laptop while the hardware-specific parts build for the MCU.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - reproducible build from clean',
        problem: 'A teammate clones your robot repository and cannot build it. List the things that make a build reproducible and how to verify each.',
        solution: [
          'All dependencies are declared, with versions, and obtainable without manual steps',
          'No absolute paths, no files outside the repository, no reliance on the author\'s home directory',
          'Generated files are not committed and are regenerated by the build; committed generated files are a source of drift',
          'The compiler version and flags are recorded, because warnings and behaviour differ between versions',
          'Verify by building in a clean container or a fresh VM from a clean checkout with only the documented tools installed',
          'CI running that clean build on every commit is the only reliable proof - it is why this project builds its APK in GitHub Actions',
        ],
        answer: 'Declared dependencies, no absolute paths, generated files excluded, and a verified clean-environment build',
      },
    ],
    resources: [
      R('GNU Make manual', 'docs', 'https://www.gnu.org/software/make/manual/', { minutes: 120, note: 'Free. Chapters 2-4 and 10 (implicit rules) are enough for most projects.' }),
      R('CMake tutorial', 'docs', 'https://cmake.org/cmake/help/latest/guide/tutorial/', { minutes: 120, note: 'Free official step-by-step.' }),
      R('An Introduction to Modern CMake', 'article', 'https://cliutils.gitlab.io/modern-cmake/', { minutes: 90, note: 'Free, and teaches target-based CMake rather than the older variable-based style.' }),
    ],
    exercises: [
      X('code', 'Write a Makefile for a 4-file C project that: tracks header dependencies automatically, builds objects into a build directory, supports `make`, `make clean` and `make test`, and prints the exact command it runs. Verify that touching a header rebuilds only the affected objects.', 45, { solution: 'The dependency-tracking test is the one that matters: without -MMD -MP, editing a header silently produces a stale binary - a bug class that wastes hours and is completely invisible.' }),
      X('code', 'Convert the same project to CMake with an executable target, a library target for the hardware-independent logic, and a test target. Confirm the library can be linked into a host test executable.', 45, { solution: 'Splitting hardware-independent logic into a library is what makes unit testing possible: the test links the library plus a fake hardware layer, with no device required. This is the same dependency-inversion principle from the Python lesson, expressed in the build system.' }),
    ],
    questions: [
      mcq(1, 'A translation unit is:', ['One source file after preprocessing, compiled independently into an object file', 'One header file', 'The whole project', 'A linked executable'], 0, 'The compiler never sees more than one translation unit at a time - the linker joins them.'),
      mcq(1, 'Defining a non-inline variable in a header included by three .c files causes:', ['A link error - three definitions of the same symbol', 'Nothing', 'A compile warning only', 'Three separate variables'], 0, 'The one-definition rule. Declare in the header with extern, define once in a .c file.'),
      mcq(2, 'Include guards exist to:', ['Prevent a header being expanded twice in one translation unit', 'Speed up linking', 'Hide implementation details', 'Enable cross-compilation'], 0, 'Without them, double inclusion redeclares types and produces confusing compile errors.'),
      mcq(2, 'The Make flags -MMD -MP provide:', ['Automatic header dependency tracking, so editing a header rebuilds the right objects', 'Optimisation', 'Parallel builds', 'Cross-compilation'], 0, 'Without them you get stale binaries after header edits - an invisible and time-wasting failure.'),
      mcq(3, 'Cross-compiling firmware for ARM on an x86 host requires:', ['A target compiler, target flags and a linker script for the target memory layout', 'Only a different Makefile name', 'Nothing special', 'A virtual machine running the target OS'], 0, 'In CMake this is expressed as a toolchain file setting the compiler, system name and flags.'),
      mcq(3, 'The reliable way to prove a build is reproducible is to:', ['Build from a clean checkout in a clean container or fresh VM, ideally in CI', 'Build it yourself twice', 'Ask a colleague to try', 'Check the Makefile by reading it'], 0, 'Author machines carry undeclared state. Only a clean environment proves reproducibility - which is why CI matters.'),
      short(2, 'Which Make automatic variable means "the target"?', ['$@', '@', '$@ (dollar at)'], '$@ is the target, $< the first prerequisite and $^ all prerequisites.'),
      mcq(3, 'Separating hardware-independent logic into a library target enables:', ['Unit testing that logic on the host with a fake hardware layer', 'Faster compilation only', 'Smaller binaries', 'Nothing useful'], 0, 'It is dependency inversion expressed in the build system, and it is what makes embedded code testable.'),
    ],
    skills: ['c-build-systems'],
  }),
];
