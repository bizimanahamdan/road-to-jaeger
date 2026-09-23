import { R, X, lesson, mcq, numeric, short } from './helpers';
import type { Lesson } from '@/lib/types';

/**
 * EMBEDDED SYSTEMS - the engineering layer above bare microcontroller work.
 *
 * `microcontrollers` teaches you to make a board do things. This subject teaches
 * you to make it do things reliably, on time, with a sensor picture you can
 * trust, and with firmware you can identify and update in the field. These are
 * the skills that turn a weekend project into a machine you can leave running.
 *
 * DAG: emb-01 -> emb-03 -> emb-04, with emb-02 (sensor fusion) branching from
 * the IMU bring-up in mcu-08 and the filtering/estimation maths.
 */
export const EMBEDDED_LESSONS: Lesson[] = [
  lesson({
    id: 'emb-01',
    subject: 'embedded-systems',
    order: 1,
    title: 'Real-Time Firmware Architecture',
    difficulty: 'advanced',
    minutes: 55,
    prereqs: ['mcu-06', 'cc-05'],
    hardware: ['microcontroller board'],
    description: 'What "real time" actually means - not fast, but predictable. Deadline analysis, jitter, superloops versus cooperative schedulers versus an RTOS, and how to decide which one your robot needs.',
    why: 'Control loops that run "usually about every 10 ms" produce controllers whose behaviour you cannot analyse. Everything downstream - PID tuning, state estimation, locomotion - assumes a known sample interval, so predictability is not a refinement, it is a precondition.',
    objectives: [
      'Define hard, firm and soft real-time requirements and give a robot example of each',
      'Compute whether a task set fits its deadlines from execution time and period',
      'Compare superloop, cooperative scheduler and RTOS architectures by strengths and failure modes',
      'Assign priorities correctly and explain priority inversion',
      'Measure and report jitter in a running system',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'The three kinds of real time',
        columns: ['Class', 'Consequence of missing a deadline', 'Robot example'],
        rows: [
          ['Hard', 'Failure, damage or injury', 'Motor current-limit protection acting before the driver is destroyed'],
          ['Firm', 'The result is useless but nothing breaks', 'A perception frame arriving too late to be fused - drop it'],
          ['Soft', 'Quality degrades gradually', 'Telemetry or a display refreshing a little late'],
        ],
      },
      {
        kind: 'formula',
        heading: 'Utilisation - the first feasibility check',
        formula: 'U = sum over tasks of (Ci / Ti)     where Ci = worst-case execution time, Ti = period',
        defines: ['U = fraction of CPU consumed', 'Ci must be the WORST case, measured, not estimated'],
        body: [
          'If U exceeds 1 the task set cannot be scheduled, full stop. In practice you want U well below 1 - around 0.7 or less - because interrupt load, cache effects and rare paths are not in your Ci figures until you measure them.',
          'For rate-monotonic scheduling there is a classical bound, U <= n(2^(1/n) - 1), which is about 0.69 for large n. It is a sufficient condition, not necessary: exceeding it does not prove failure, but it does mean you must analyse further instead of assuming.',
          'The number that actually matters is Ci, and the only way to get it is to instrument the code and record the maximum over a long run. Typical-case timings are not engineering data.',
        ],
      },
      {
        kind: 'text',
        heading: 'Choosing an architecture',
        body: [
          'A superloop with non-blocking tasks is the right default: simple, no RTOS to learn, and deterministic in the sense that you can reason about the whole thing. Its ceiling is that one slow task delays every other task.',
          'Move to an RTOS when tasks genuinely need different priorities, when something must preempt something else, or when you want blocking primitives such as queues and semaphores instead of hand-rolled buffers. The cost is RAM for stacks, a new class of bugs (races, deadlocks, priority inversion), and much harder timing analysis.',
          'Whichever you choose, keep the hard-real-time work in as few places as possible. A single well-instrumented control task is far easier to prove correct than five tasks that all matter.',
        ],
        bullets: [
          'Superloop: one stack, no preemption, easy to measure, one slow task hurts everyone',
          'Cooperative scheduler: superloop plus an explicit task table and deadlines',
          'RTOS: preemption and priorities, at the cost of concurrency bugs and RAM',
          'Interrupts: the only true preemption on a bare-metal system - keep them minimal',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Priority inversion - the bug that reaches space missions',
        body: [
          'A high-priority task waits for a resource held by a low-priority task. A medium-priority task, needing no resource, then runs continuously and starves the low-priority holder - so the high-priority task is blocked by something less important than itself. The priorities have inverted.',
          'The standard fix is priority inheritance: while a task holds a contended resource, it temporarily runs at the priority of the highest task waiting for it. Most RTOS mutexes do this; hand-rolled ones often do not.',
          'If you are on a bare-metal superloop you avoid the problem entirely by not having priorities - which is one more argument for the simpler architecture.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - does the task set fit?',
        problem: 'Three periodic tasks: control at 2 ms every 10 ms, sensing at 3 ms every 20 ms, telemetry at 5 ms every 50 ms. An ISR load of 8% is measured separately. Is this schedulable on a single core?',
        solution: [
          'U_control = 2/10 = 0.20',
          'U_sensing = 3/20 = 0.15',
          'U_telemetry = 5/50 = 0.10',
          'Task total = 0.45, plus ISR load 0.08 gives U = 0.53',
          'Rate-monotonic bound for n = 3: 3 * (2^(1/3) - 1) = 0.7798',
          '0.53 < 0.78, so the sufficient condition is satisfied',
        ],
        answer: 'Yes - U = 0.53 is below the rate-monotonic bound of about 0.78 for three tasks. Verify anyway by measuring actual worst-case lateness, because the bound assumes ideal conditions.',
      },
    ],
    resources: [
      R('Wikipedia: Real-time computing', 'article', 'https://en.wikipedia.org/wiki/Real-time_computing', { minutes: 25 }),
      R('Wikipedia: Rate-monotonic scheduling', 'article', 'https://en.wikipedia.org/wiki/Rate-monotonic_scheduling', { minutes: 30, note: 'The utilisation bound and its assumptions - worth reading once properly.' }),
      R('FreeRTOS documentation', 'docs', 'https://www.freertos.org/Documentation/RTOS_book', { author: 'Amazon/FreeRTOS', minutes: 60, note: 'Only needed if you decide an RTOS is justified. Read the sections on priorities and mutexes.' }),
    ],
    exercises: [
      X('calculation', 'List every periodic task in your robot firmware with its period and measured worst-case execution time. Compute total utilisation including ISR load and state, with the arithmetic shown, whether it fits with headroom.', 30, { hardware: ['microcontroller board'], solution: 'Sum Ci/Ti for each task, add measured ISR load as a fraction. Below about 0.7 is comfortable; above 0.9 means something must move off the critical path.' }),
      X('code', 'Add instrumentation recording min, mean and worst-case loop period over at least 1000 iterations, using firmware timestamps only. Report all three numbers and the jitter (worst minus ideal).', 35, { hardware: ['microcontroller board'], solution: 'Timestamp at loop entry, difference against the previous entry, keep min/max/sum. Report worst-case period, not the average - deadlines are missed by the worst case.' }),
      X('measurement', 'Insert a deliberate 5 ms busy-wait into one task, re-measure jitter across all tasks, and explain exactly which tasks were affected and why.', 25, { hardware: ['microcontroller board'], solution: 'In a cooperative system every task is affected, because nothing preempts the busy-wait. The magnitude of the effect on the 10 ms task shows how little headroom that design had.' }),
    ],
    questions: [
      mcq(1, 'Which is a hard real-time requirement on a robot?', ['Motor current-limit protection must act before the driver is damaged', 'Telemetry should update about once per second', 'The display should redraw within a few frames', 'Logs should eventually reach disk'], 0, 'Missing it causes damage or injury. Soft requirements degrade quality; firm ones produce a useless result.'),
      mcq(1, 'A soft real-time task is one where:', ['Missing an occasional deadline degrades quality but is not catastrophic', 'The task runs at low priority', 'The task may run at any unbounded time', 'The task uses floating point'], 0, 'The classification is about the consequence of being late, not about priority or speed.'),
      numeric(2, 'A control loop takes 1.8 ms of CPU per iteration and must run every 10 ms. What is its utilisation as a percentage? [0-100]', 18, 'U = Ci/Ti = 1.8/10 = 0.18 = 18%.', { tolerance: 1 }),
      numeric(2, 'Three tasks take 2 ms every 10 ms, 3 ms every 20 ms and 5 ms every 50 ms. What is total utilisation as a percentage? [0-100]', 45, '0.20 + 0.15 + 0.10 = 0.45 = 45%. Add ISR and aperiodic load before calling it comfortable.', { tolerance: 1 }),
      numeric(2, 'For n = 3 tasks the rate-monotonic bound is n(2^(1/n) - 1). Compute it as a percentage. [0-100]', 78.0, '3 * (2^(1/3) - 1) = 3 * 0.2599 = 0.7798, about 78%. A sufficient condition for schedulability.', { tolerance: 1 }),
      mcq(3, 'A superloop with cooperative tasks is best when:', ['Tasks are short, non-blocking and none needs to preempt another', 'One task must interrupt another within microseconds', 'You need many threads with independent stacks', 'Deadlines are unknown'], 0, 'Cooperative scheduling is simple and analyzable - but one slow task delays everything, which is its ceiling.'),
      mcq(3, 'You would move to an RTOS when:', ['Tasks have genuinely different priorities and some must preempt others, or you need blocking primitives', 'The code passes a thousand lines', 'You want to use C++', 'The MCU has more than 64 KB flash'], 0, 'An RTOS buys preemption and synchronisation at the cost of RAM, complexity, and concurrency bugs: races, deadlocks, priority inversion.'),
      mcq(4, 'Priority inversion occurs when:', ['A high-priority task waits on a resource held by a low-priority task that cannot run because a medium-priority task hogs the CPU', 'Two tasks share a priority', 'A task exceeds its deadline', 'An ISR fires too often'], 0, 'The fix is priority inheritance: temporarily raise the holder to the waiter\'s priority. Most RTOS mutexes implement it.'),
      mcq(4, 'Which task should have the highest priority?', ['The one whose missed deadline has the worst consequence, usually safety or hard-timing work', 'The one that runs most often', 'The one that takes longest', 'The one written first'], 0, 'Rate-monotonic theory assigns higher priority to shorter periods, but consequence outranks rate: a slow safety task still wins.'),
      numeric(5, 'A 10 ms loop records start times of 0, 10.1, 20.3, 30.2, 40.6 ms. What is the maximum jitter (deviation from ideal 10 ms spacing) in ms? [0-5]', 0.6, 'Ideal starts are 0, 10, 20, 30, 40. The largest deviation is |40.6 - 40| = 0.6 ms.', { tolerance: 0.02 }),
      short(5, 'Which number do you report to prove a loop meets its deadline: mean period or worst case? Why?', ['worst case', 'the worst case', 'worst-case period'], 'Worst case. A mean of 2 ms with occasional 40 ms spikes still misses a 10 ms deadline, and the average hides exactly those spikes.'),
    ],
    skills: ['realtime-concepts', 'scheduling', 'priority-inversion', 'jitter-analysis'],
  }),

  lesson({
    id: 'emb-02',
    subject: 'embedded-systems',
    order: 2,
    title: 'Sensor Fusion: From Raw IMU Data to a Trustworthy Attitude',
    difficulty: 'expert',
    minutes: 65,
    prereqs: ['mcu-08', 'madv-05', 'dsa-05'],
    hardware: ['microcontroller board', 'I2C IMU breakout (MPU-6050 class)', 'a physical angle reference (protractor or square)'],
    description: 'An accelerometer measures gravity plus any other acceleration; a gyroscope measures rate but drifts. Fusing them gives an orientation estimate that is both responsive and stable - the complementary filter, then why a Kalman filter is the principled version of the same idea.',
    why: 'This is the exact problem that keeps a two-wheeled robot upright and that a humanoid must solve thousands of times per second. It is also the clearest example in the whole curriculum of two noisy, individually useless measurements combining into one trustworthy estimate.',
    objectives: [
      'Explain what an accelerometer and a gyroscope each actually measure, and their distinct failure modes',
      'Integrate gyroscope rate into angle and demonstrate why the result drifts',
      'Implement a complementary filter that combines both sensors',
      'Explain what a Kalman filter adds over a complementary filter in terms of prediction and correction',
      'Validate a fused estimate against a physical reference and report the error',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'What each sensor really measures',
        columns: ['Sensor', 'Measures', 'Good at', 'Fails at'],
        rows: [
          ['Accelerometer', 'Specific force (gravity plus linear acceleration)', 'Absolute tilt when stationary', 'Any linear acceleration corrupts it; also noisy'],
          ['Gyroscope', 'Angular rate', 'Fast, smooth short-term angle changes', 'Bias integrates into unbounded drift'],
          ['Magnetometer', 'Magnetic field direction', 'Absolute heading over long periods', 'Distorted by motors, steel and wiring currents'],
        ],
      },
      {
        kind: 'formula',
        heading: 'The complementary filter',
        formula: 'angle = a * (angle + gyroRate * dt) + (1 - a) * angleFromAccelerometer',
        defines: ['a = weighting, typically 0.9-0.99', 'dt = sample interval', 'angleFromAccelerometer = atan2 of the gravity components'],
        body: [
          'Read it as two paths: the gyro path is integrated and high-pass filtered (trusted for fast changes), the accelerometer path is low-pass filtered (trusted for long-term stability). They complement each other because their failure modes are opposite.',
          'A smaller a trusts the accelerometer more, so it tracks drift slowly but lets vibration straight through. A larger a is smoother but drifts more before the correction catches up. There is no correct universal value - tune it against measured behaviour.',
          'The whole thing assumes dt is accurate. If your loop jitters and you use a fixed dt, the gyro integration is wrong by exactly that jitter - which is why emb-01 comes first.',
        ],
      },
      {
        kind: 'text',
        heading: 'Why a Kalman filter is the same idea, done properly',
        body: [
          'A complementary filter blends with a fixed hand-chosen weight. A Kalman filter keeps an uncertainty estimate alongside the state and computes the blend (the Kalman gain) from the predicted process noise and the measured sensor noise. When the accelerometer is being shaken, its uncertainty is high, so the filter automatically trusts the gyro more.',
          'Structurally it is predict then correct: propagate the state forward with the gyro (the fast model), then correct it toward the accelerometer measurement (the slow but absolute one). That two-step shape is the entire idea, and it generalises to position, velocity and many more states.',
          'For a first attitude estimate on a small MCU, a well-tuned complementary filter is usually adequate and much cheaper. Move to Kalman when you can state the noise covariances and need the estimate to adapt - and be honest that the covariances are tuning parameters too.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Gating the accelerometer - the practical refinement',
        body: [
          'The accelerometer only tells you tilt when the only acceleration acting on it is gravity. Check that: if the magnitude of the reading deviates from 1 g by more than a threshold, the robot is accelerating, so reduce the accelerometer weight temporarily or skip the correction entirely.',
          'This one test removes most of the "pitch swings wildly when the robot drives fast" behaviour, and it costs a few instructions. It is a good example of physics informing the algorithm rather than the other way round.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - how fast does drift accumulate?',
        problem: 'A MEMS gyroscope has a bias of 0.05 degrees per second. If you integrate its output with no correction, how much angle error accumulates in 10 minutes, and what does that imply for a balancing robot?',
        solution: [
          'Error grows linearly with time: bias * elapsed time',
          '10 minutes = 600 s',
          'Error = 0.05 deg/s * 600 s = 30 degrees',
          'A balancing robot tipped 30 degrees from its true vertical has fallen long before that',
          'So pure gyro integration is unusable on a timescale of seconds to minutes',
        ],
        answer: '30 degrees of error in 10 minutes. Integration alone is unusable; you must correct against an absolute reference (the accelerometer when stationary) continuously.',
      },
    ],
    resources: [
      R('Wikipedia: Kalman filter', 'article', 'https://en.wikipedia.org/wiki/Kalman_filter', { minutes: 45, note: 'Read the derivation once and the "intuitive explanation" section twice. The one-dimensional case is all you need to start.' }),
      R('Wikipedia: Inertial measurement unit', 'article', 'https://en.wikipedia.org/wiki/Inertial_measurement_unit', { minutes: 25 }),
      R('TDK InvenSense: 6-axis motion sensors (MPU-6050/9250 datasheets)', 'docs', 'https://invensense.tdk.com/products/motion-tracking/6-axis/', { author: 'TDK InvenSense', minutes: 40, note: 'The sensitivity table per full-scale range is the part you need.' }),
    ],
    exercises: [
      X('measurement', 'Log raw gyro integration alone for 5 minutes with the board sitting perfectly still. Plot angle versus time, quantify the drift rate in degrees per minute, and compare it with the bias you measured earlier.', 30, { hardware: ['microcontroller board', 'I2C IMU breakout (MPU-6050 class)'], solution: 'The slope of the angle-time line is the bias. It should match the near-constant reading you logged at rest in the IMU bring-up exercise - that agreement is your first real validation.' }),
      X('code', 'Implement a complementary filter. Sweep a through 0.5, 0.9, 0.98 and 0.995 and record, for each: static accuracy, response time to a quick tilt, and sensitivity to vibration. Choose a value and justify it from your own measurements.', 60, { hardware: ['microcontroller board', 'I2C IMU breakout (MPU-6050 class)'], solution: 'Small a is responsive but noisy; large a is smooth but slow and drifts more. The right value is the one that meets your actual requirement - state the requirement first, then pick.' }),
      X('measurement', 'Set the board at three known physical angles using a protractor or square and report the estimate error at each, with your acceptance threshold stated in advance.', 30, { hardware: ['microcontroller board', 'I2C IMU breakout (MPU-6050 class)', 'a physical angle reference (protractor or square)'], solution: 'Two or three degrees is typical for a hobby MEMS IMU after calibration. Write the threshold down BEFORE measuring, otherwise you will move it to match the result.' }),
      X('code', 'Implement a simple one-dimensional Kalman filter for the same angle and compare it against your best complementary filter on the same recorded dataset. Report which is better and why, in terms of the noise each one rejects.', 60, { hardware: ['microcontroller board', 'I2C IMU breakout (MPU-6050 class)'], solution: 'On stationary data they perform similarly. The Kalman filter shows its advantage when the noise level changes, because its gain adapts while the complementary filter weight does not.' }),
    ],
    questions: [
      mcq(1, 'A stationary accelerometer reads about 9.81 m/s^2 on one axis. What is it measuring?', ['The reaction to gravity - a stationary accelerometer reads proper acceleration, not zero', 'A calibration error', 'Bench vibration', 'Magnetic interference'], 0, 'Accelerometers measure specific force. In free fall they read zero; resting on a table they read 1 g upward.'),
      mcq(1, 'The main weakness of a MEMS gyroscope is:', ['Bias drift - a small constant offset integrates into ever-growing angle error', 'It cannot measure fast rotation', 'It is affected by magnetic fields', 'It needs recalibration every second'], 0, 'Rate noise integrates. Even a 0.01 deg/s bias becomes 36 degrees of error in an hour.'),
      mcq(1, 'The main weakness of using an accelerometer for tilt is:', ['Any linear acceleration corrupts the gravity estimate, and the signal is noisy', 'It drifts over time', 'It cannot measure static tilt', 'It only works when level'], 0, 'During acceleration the inferred "down" direction is wrong - which is exactly why you fuse it with a gyro.'),
      numeric(2, 'A gyroscope reports a constant 12.0 degrees per second for 3.5 seconds, starting from zero. What angle does integration give in degrees? [0-360]', 42.0, 'angle = rate * time = 12.0 * 3.5 = 42.0 degrees.', { tolerance: 0.5 }),
      numeric(2, 'A gyro bias of 0.05 degrees per second is integrated for 10 minutes with no correction. How many degrees of error accumulate? [0-360]', 30, '0.05 * 600 = 30 degrees. Pure integration is unusable alone beyond a few seconds.', { tolerance: 1 }),
      mcq(3, 'The complementary filter angle = a*(angle + gyro*dt) + (1-a)*accelAngle does what?', ['Trusts the gyro for fast changes and the accelerometer for long-term stability', 'Averages both sensors equally at all frequencies', 'Uses only the accelerometer and smooths it', 'Removes the need to calibrate the gyro'], 0, 'It is a high-pass on the gyro path and a low-pass on the accelerometer path. Their failure modes are opposite, so they complement each other.'),
      numeric(3, 'With a = 0.98, what percentage of each update comes from the accelerometer? [0-100]', 2, '1 - 0.98 = 0.02 = 2%. Over many steps that 2% is enough to cancel gyro drift without letting much vibration through.', { tolerance: 0.1 }),
      mcq(3, 'Choosing a smaller a (for example 0.5) makes the estimate:', ['More responsive to linear acceleration noise but slower to drift away', 'Less affected by vibration', 'More stable during rapid motion', 'Independent of the sample rate'], 0, 'A small a weights the accelerometer heavily, so bumps and vibration appear directly in the angle.'),
      mcq(4, 'A Kalman filter differs from a complementary filter mainly because it:', ['Maintains an uncertainty estimate and adapts the weighting from predicted and measured noise', 'Always gives smaller angle error', 'Does not need a gyro', 'Requires no tuning'], 0, 'The complementary filter uses a fixed hand-tuned blend. The Kalman gain is computed from covariances, so the blend adapts - though the covariances are themselves tuning parameters.'),
      mcq(4, 'In Kalman terms, predict uses the gyro to propagate the state; correct uses:', ['The accelerometer measurement, weighted by the Kalman gain', 'A second gyroscope', 'Only the previous corrected value', 'A fixed constant'], 0, 'Predict from the fast model, correct from the slow but absolute measurement. That structure is the whole idea.'),
      mcq(5, 'A fused pitch estimate is correct when static but swings wildly whenever the robot accelerates. Most likely cause?', ['The accelerometer is trusted too much during linear acceleration; gate it when the magnitude deviates from 1 g', 'The gyro bias is too large', 'The sample rate is too high', 'The board needs a magnetometer'], 0, 'Detect acceleration (|a| far from 1 g) and temporarily trust the gyro more. This is the standard practical refinement.'),
      short(5, 'What physical object do you need to validate a fused attitude estimate?', ['a protractor or a square or a known angle reference', 'a protractor', 'a physical angle reference'], 'Something with a known angle: a protractor, a machinist\'s square, or an inclinometer. Validation needs an independent reference, not another estimate from the same sensor.'),
    ],
    skills: ['imu-fusion', 'complementary-filter', 'kalman-filter', 'sensor-validation'],
  }),

  lesson({
    id: 'emb-03',
    subject: 'embedded-systems',
    order: 3,
    title: 'Debugging Firmware on Target',
    difficulty: 'advanced',
    minutes: 50,
    prereqs: ['emb-01', 'tool-05'],
    hardware: ['microcontroller board', 'logic analyser or oscilloscope (strongly recommended)'],
    description: 'Embedded bugs are the hardest kind: no console, no stack trace, timing-dependent, and sometimes caused by your own debugger. Building a systematic on-target workflow - assertions, structured logs, hardware observation and firmware bisect.',
    why: 'You will spend more time debugging firmware than writing it. A repeatable workflow turns a lost evening into twenty minutes; without one, every bug is a fresh negotiation with a machine that cannot tell you what happened.',
    objectives: [
      'Build a layered debug strategy using assertions, structured logs and hardware observation',
      'Inspect running state with a debugger or SWD/JTAG without changing timing much',
      'Diagnose timing-dependent bugs that disappear when you add logging',
      'Interpret a hard fault or crash dump to find the faulting instruction',
      'Apply systematic elimination, including firmware bisect, to a reproducible failure',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Debug layers, from cheapest to most powerful',
        columns: ['Layer', 'What it tells you', 'Cost'],
        rows: [
          ['Assertions on invariants', 'That a specific assumption was violated, at the exact location', 'Near zero in time, a little flash'],
          ['Structured serial logs', 'Sequence of events and values over time', 'Perturbs timing; can be very slow'],
          ['Counters and a status word', 'How often each path ran, since boot', 'Tiny; readable on demand'],
          ['GPIO toggles plus logic analyser', 'True timing across many channels at once', 'One pin per signal; almost no perturbation'],
          ['Ring buffer kept in noinit RAM', 'What happened immediately before a reset', 'Small fixed RAM cost; survives reset'],
          ['SWD/JTAG debugger', 'Registers, memory and call stack at a breakpoint', 'Changes timing; some bugs vanish'],
        ],
      },
      {
        kind: 'text',
        heading: 'Heisenbugs: when observation changes the outcome',
        body: [
          'Adding a print changes memory pressure, execution time and cache behaviour. Bugs caused by a race or a marginal timing will often disappear - which tells you something valuable, even though it feels like failure.',
          'For those, use non-intrusive observation: a logic analyser on spare GPIO pins, a hardware trace buffer, or a debugger with data watchpoints. If a bug vanishes when you look at it, the timing hypothesis just moved to the top of your list.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Rare bugs need a black box, not a debugger',
        body: [
          'A failure that happens once per hour cannot be chased interactively. Instrument it to capture itself: keep the last N events in a ring buffer stored in a noinit RAM section that survives reset, dump it on boot, and add counters for every suspicious path.',
          'Then wait. The next occurrence arrives with evidence attached, and you will know more from that one dump than from a week of guessing.',
          'Before changing any code, write down what you believe is happening and what evidence would confirm or refute it. Bugs you fix without a confirmed cause come back.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - reading a hard fault',
        problem: 'A Cortex-M board resets randomly. On boot, the firmware prints the reset reason "hard fault" with a stacked PC of 0x00004A2C and a stacked LR of 0x00003188. How do you find the faulting line?',
        solution: [
          'Look up 0x00004A2C in the disassembly (objdump -d of the ELF) to find the faulting instruction',
          'The stacked LR (0x00003188) tells you the caller, so you get a two-frame backtrace',
          'Cross-reference both addresses against the .map file to name the functions and the source lines',
          'Read the fault status registers (CFSR, HFSR) to learn the class: bus fault, usage fault, unaligned, divide by zero',
          'Common conclusions: a null or wild pointer dereference, an out-of-bounds array index, or a stack overflow that corrupted a return address',
        ],
        answer: 'Resolve the stacked PC and LR through the disassembly and map file to get source lines, then read CFSR/HFSR for the fault class. Two addresses plus the status register usually names the culprit.',
      },
    ],
    resources: [
      R('Wikipedia: ARM Cortex-M (debug, NVIC and fault handling)', 'article', 'https://en.wikipedia.org/wiki/ARM_Cortex-M', { minutes: 30 }),
      R('OpenOCD user guide', 'docs', 'https://openocd.org/pages/documentation.html', { author: 'OpenOCD', minutes: 45, note: 'For on-chip debugging with a cheap SWD probe.' }),
      R('Saleae Logic software and measurement guides', 'tool', 'https://www.saleae.com/pages/downloads', { author: 'Saleae', minutes: 30, note: 'Free software; an eight-channel analyser is one of the highest-value tools in embedded work.' }),
    ],
    exercises: [
      X('code', 'Implement a ring buffer of the last 64 events held in a noinit section and dumped over serial after any reset. Trigger a watchdog reset deliberately and confirm the buffer survived with useful content.', 45, { hardware: ['microcontroller board'], solution: 'Mark the buffer with a linker section attribute that is not zero-initialised, plus a magic value to detect a cold start. The test is: does the dump after a watchdog reset show the events leading up to it?' }),
      X('measurement', 'Fill the stack with a known pattern at startup, run a long session, then measure how much of the pattern was overwritten. Report peak stack usage and remaining headroom as a percentage.', 30, { hardware: ['microcontroller board'], solution: 'Scan from the stack base for the first byte that differs from the pattern. Size the stack from this measurement, not from a guess - and re-measure after any significant code change.' }),
      X('code', 'Deliberately cause a null-pointer dereference and (if trapped on your core) a divide by zero. Capture the fault registers and stacked PC, then identify the faulting source line from the map file.', 45, { hardware: ['microcontroller board', 'logic analyser or oscilloscope (strongly recommended)'], solution: 'Implement a hard fault handler that reads the stacked frame from the correct stack pointer (MSP or PSP, from bit 2 of EXC_RETURN), prints PC, LR and CFSR, then enters the safe state.' }),
    ],
    questions: [
      mcq(1, 'What is the primary value of an assert() in firmware?', ['It turns a silent wrong assumption into an immediate, located failure', 'It makes code run faster', 'It replaces logging', 'It prevents all crashes'], 0, 'A violated invariant should stop the world at the point of violation, not corrupt state and fail somewhere unrelated later.'),
      mcq(1, 'In a release build for a small MCU, what should happen to asserts?', ['Keep the check but route failure to a safe state and record it, rather than removing it', 'Remove them all with NDEBUG', 'Convert them to printf statements', 'Replace them with exceptions'], 0, 'Deleting safety checks in the field is how bugs escape. Degrade gracefully: log, enter the safe state, keep running if possible.'),
      mcq(2, 'Why is printf-style serial debugging sometimes useless?', ['Adding prints changes timing and memory pressure, so the bug may disappear', 'Serial is always too slow to read', 'printf cannot print floats', 'The compiler removes prints'], 0, 'Observation perturbs the system. For timing bugs use non-intrusive tools: a scope on a GPIO pin, or a trace buffer.'),
      mcq(2, 'A good non-intrusive way to see whether a function runs and how long it takes:', ['Toggle a spare GPIO on entry and exit and view it on a logic analyser', 'Print a timestamp at 9600 baud', 'Add a delay to slow everything down', 'Run it only in a simulator'], 0, 'A logic analyser shows timing across many channels simultaneously with negligible impact on the running system.'),
      mcq(3, 'A bug occurs about once per hour and cannot be reproduced on demand. Best approach?', ['Add persistent logging of state and counters so the next occurrence captures itself', 'Attach a debugger and wait', 'Rewrite the module', 'Increase the watchdog timeout'], 0, 'Rare bugs need a black box: ring-buffer logs in noinit RAM, error counters, and a snapshot written on fault.'),
      mcq(3, 'You can bisect firmware the same way you bisect commits when:', ['The failure is reproducible and you can flash any past build', 'The bug only happens in the field', 'You have no version control', 'The failure is a hardware defect'], 0, 'Reproducibility plus known-good builds is the precondition. Without both, bisect gives you noise - exactly as in the git lesson.'),
      mcq(4, 'A hard fault reports a stacked PC value. What is it for?', ['It is the address of the instruction that faulted - resolve it through the disassembly or map file', 'It is the address of the fault handler', 'It is the current stack pointer', 'It is random'], 0, 'Combined with the fault status registers and the map file, it usually names the culprit.'),
      mcq(4, 'A stack overflow on an MCU typically shows up as:', ['Corrupted locals or return addresses, bizarre crashes in unrelated code, or a stack-limit fault if hardware checks it', 'A clean message naming the overflowing function', 'Slower but correct execution', 'Flash write errors'], 0, 'It rarely announces itself. Measure the stack high-water mark at runtime and size it from measurement, not hope.'),
      numeric(5, 'You measure worst-case stack usage of 1.4 KB, the MCU has 2 KB SRAM, and statics use 600 B. What is the largest heap you could safely reserve, in KB? [0-2]', 0.0, '2 - 1.4 - 0.6 = 0 KB. There is no room at all: you must reduce stack or statics, or choose a bigger part. This arithmetic is why you measure.', { tolerance: 0.05 }),
      short(5, 'Before changing code to fix a bug you cannot reproduce, what should you write down?', ['a hypothesis and what evidence would confirm or refute it', 'your hypothesis and the evidence that would confirm or refute it', 'hypothesis and expected evidence'], 'A hypothesis plus the evidence that would confirm or refute it. Bugs "fixed" without a confirmed cause come back, and you lose the ability to tell a real fix from a coincidence.'),
    ],
    skills: ['embedded-debugging', 'assertions', 'fault-analysis', 'stack-analysis'],
  }),

  lesson({
    id: 'emb-04',
    subject: 'embedded-systems',
    order: 4,
    title: 'Firmware as a Product: Versioning, Build and Release',
    difficulty: 'advanced',
    minutes: 45,
    prereqs: ['emb-03', 'cc-06'],
    hardware: ['microcontroller board', 'USB cable'],
    description: 'Firmware you cannot identify in the field is firmware you cannot support: reproducible builds, version reporting over serial, configuration separated from logic, automated hardware smoke tests and a release checklist.',
    why: 'The moment you have two boards running different code, "which firmware is on this one?" becomes the question that decides whether an afternoon is productive. Treating firmware as a released artefact - versioned, tested, reproducible - is what lets a robot project survive its own complexity.',
    objectives: [
      'Make a firmware build reproducible and embed identifiable version information',
      'Report version, build time and git commit over serial on boot and on demand',
      'Separate hardware configuration from application logic',
      'Design an automated smoke test that runs on real hardware',
      'Write a release checklist that prevents shipping known-bad firmware',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Reproducibility and provenance',
        body: [
          'Two builds from the same commit should produce the same binary. The usual offenders are embedded __DATE__/__TIME__ macros, absolute paths in debug info, and non-deterministic link order. Pin your toolchain version and record it alongside the build.',
          'Provenance means any device in the field can tell you exactly what it is running: a semantic version, the git commit hash, the branch, and the build timestamp - generated from git at build time, never typed by hand. Hand-maintained version strings drift from reality, and then the binary lies about itself.',
          'The payoff is immediate: a support question becomes answerable in one serial command, and a regression can be bisected across firmware builds the same way you bisect commits.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Separate board configuration from logic',
        body: [
          'Every pin number, I2C address, motor polarity and calibration constant belongs in one board configuration header or file - never scattered through drivers and application code. Then a single application image can serve several hardware revisions, and a wiring change is a one-line diff you can review.',
          'The test is mechanical: grep your application files for numeric pin constants. If any appear, the separation is not finished.',
        ],
      },
      {
        kind: 'table',
        heading: 'A release checklist, cheapest checks first',
        columns: ['Order', 'Check', 'Evidence that it passed'],
        rows: [
          ['1', 'Clean build from a fresh checkout', 'Build log, zero warnings, recorded flash and SRAM usage'],
          ['2', 'Version string matches the git commit', 'Serial VERSION response equals git describe'],
          ['3', 'Unit tests and static analysis', 'Test runner exit code zero, linter clean'],
          ['4', 'Automated hardware smoke test', 'Script exit code zero on real hardware'],
          ['5', 'Fault injection: watchdog, sensor loss, safe state', 'Logged transitions showing each fault handled'],
          ['6', 'Long-run soak (at least an hour)', 'No drift, no memory growth, worst-case timing within budget'],
          ['7', 'Rollback path verified', 'A deliberately bad image rolled back automatically'],
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - what a smoke test must actually do',
        problem: 'Write the outline of an automated smoke test for a two-wheeled robot board, such that it can run unattended in CI on a bench rig and fail loudly.',
        solution: [
          'Flash the built image over USB and wait for the boot banner',
          'Query VERSION and assert it matches the expected commit hash',
          'Read every sensor and assert plausible values: IMU near 1 g on the vertical axis at rest, battery voltage within range, encoder counts changing when a wheel is spun by the rig motor',
          'Command each actuator briefly and assert the expected feedback (encoder moves, current rises within limits)',
          'Inject a fault (kill a sensor read, force a watchdog reset) and assert the device reaches the safe state and reports it',
          'Exit non-zero with a specific message on the first failure, and print a timing summary at the end',
        ],
        answer: 'Flash, verify identity, verify every sensor against physics, verify every actuator against feedback, inject a fault and verify the safe state, then exit non-zero on any failure.',
      },
    ],
    resources: [
      R('PlatformIO: build system, environments and extra scripting', 'docs', 'https://docs.platformio.org/', { author: 'PlatformIO', minutes: 45, note: 'The extra_scripts hook is how you inject the git hash at build time.' }),
      R('Wikipedia: Reproducible build', 'article', 'https://en.wikipedia.org/wiki/Reproducible_build', { minutes: 20 }),
      R('Wikipedia: Hardware-in-the-loop simulation', 'article', 'https://en.wikipedia.org/wiki/Hardware-in-the-loop_simulation', { minutes: 25 }),
    ],
    exercises: [
      X('code', 'Make your build embed the git commit hash, branch, build date and a semantic version, then print all of it on boot and in response to a VERSION serial command. Rebuild twice from the same commit and confirm the version output is identical.', 35, { hardware: ['microcontroller board', 'USB cable'], solution: 'Generate a header from a build script (git rev-parse --short HEAD, git describe --tags). Rebuilding from the same commit must give the same version string - if it does not, something non-deterministic has crept in.' }),
      X('code', 'Refactor so every pin number, I2C address and calibration constant lives in one board configuration file. Verify with a search that no application file contains a hardcoded pin number.', 40, { hardware: ['microcontroller board'], solution: 'One header with named constants, included everywhere. The verification is the grep - report zero matches in application sources.' }),
      X('build', 'Write a script that flashes the board, waits for boot, queries VERSION, reads each sensor, briefly commands each actuator, triggers the safe state, and exits non-zero on any failure. Run it and paste the output.', 60, { hardware: ['microcontroller board', 'USB cable'], solution: 'Python plus pyserial, or a Makefile target calling arduino-cli. The value is that it is repeatable: run it after every change and it catches the regression you would otherwise find in the field.' }),
    ],
    questions: [
      mcq(1, 'Two builds from the same commit produce different binaries. Most likely cause?', ['Embedded timestamps, absolute paths, or non-deterministic link order', 'Optimisation level differences', 'A different target MCU', 'Different flash sizes'], 0, 'Strip __DATE__/__TIME__, avoid absolute paths, pin the toolchain. Reproducibility is what makes a field binary traceable to a commit.'),
      mcq(2, 'A device in the field misbehaves. Which single piece of information saves the most time?', ['The exact firmware version and git commit it is running, reported on demand', 'The device serial number', 'The last log file', 'The supply voltage'], 0, 'If you cannot tell which build is running, every diagnosis is a guess. Version reporting is not optional.'),
      mcq(2, 'Version strings should be:', ['Generated from git at build time and compiled into the image, not typed by hand', 'Stored in a separate file on the device', 'Kept only in release notes', 'Incremented manually before each flash'], 0, 'Hand-maintained versions drift from reality. Automate provenance so the binary cannot lie about itself.'),
      mcq(3, 'Board A uses an IMU at I2C address 0x68 and board B at 0x69. Where should that difference live?', ['In a board configuration file, so application logic never hardcodes the address', 'In an if statement inside the driver', 'In a comment', 'Nowhere - edit it before flashing'], 0, 'Separating board config from logic means one application image can serve several hardware revisions, and a wiring change is a one-line diff.'),
      mcq(4, 'An automated hardware smoke test should:', ['Flash a build to real hardware, then verify boot, version, sensor presence, actuator response and safe-state behaviour', 'Only check that the binary compiles', 'Run only in simulation', 'Be done manually before every release'], 0, 'Compile success says nothing about the device working. A scripted flash-and-verify loop catches regressions unit tests cannot reach.'),
      mcq(4, 'Why must a smoke test verify the safe state, not just nominal operation?', ['A regression in fault handling is invisible during normal operation and catastrophic during a fault', 'Safe-state code is the largest part of firmware', 'The watchdog must be tested daily', 'Nominal operation cannot be automated'], 0, 'Test the paths you hope never run, by injecting the fault deliberately - exactly as in the robustness lesson.'),
      mcq(5, 'A rollback plan matters most when:', ['The update is remote, because you cannot physically re-flash a device that fails to boot', 'The device is on your desk', 'The firmware is under version control', 'The build is reproducible'], 0, 'Field devices need A/B partitions or a bootloader fallback. On your desk, the cable is the rollback plan.'),
      short(5, 'In a release checklist, why do the cheapest checks come first?', ['so failures are found quickly and cheaply before wasting time on slow checks', 'fail fast: cheap checks catch most problems before expensive ones run', 'to fail fast and avoid spending minutes on a build that fails a one-second check'], 'Fail fast. A one-second version check that fails should not wait behind a one-hour soak test - ordering by cost means most defects are caught in seconds.'),
    ],
    skills: ['firmware-versioning', 'reproducible-builds', 'hardware-in-the-loop', 'release-process'],
  }),
];
