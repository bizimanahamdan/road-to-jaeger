import { R, X, lesson, mcq, numeric, short } from './helpers';
import type { Lesson } from '@/lib/types';

/** SOFTWARE / Python - the working language of robotics prototyping and tooling. */
export const PYTHON_LESSONS: Lesson[] = [
  lesson({
    id: 'py-01',
    subject: 'python',
    order: 1,
    title: 'Python Syntax, Tooling and Virtual Environments',
    difficulty: 'beginner',
    minutes: 40,
    prereqs: ['prog-02'],
    description: 'Python syntax in context, the interpreter, virtual environments, and a sane project layout.',
    why: 'Robotics tooling, ROS 2 scripts, OpenCV, data logging and test harnesses are all Python. Reproducible environments are what let you run the same code on your laptop, a Raspberry Pi and a robot six months later.',
    objectives: [
      'Write correct Python syntax for variables, collections, comprehensions and f-strings',
      'Create and use a virtual environment, and explain why it is necessary',
      'Organise a Python project with a dependency manifest and run it reproducibly',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Python is dynamically typed and whitespace-sensitive',
        body: [
          'Indentation defines blocks - there are no braces. Types are attached to values, not declarations, so the same name can hold an int then a str. That flexibility is why type hints and a checker (mypy or pyright) are worth adding early: they catch a large class of bug before runtime without giving up any dynamism.',
          'Comprehensions replace most map/filter loops and are faster: `[x*2 for x in values if x > 0]`. f-strings are the only formatting you need: `f"distance={d:.3f} m"` - the format spec controls significant figures, which matters when logging measurements.',
        ],
      },
      {
        kind: 'formula',
        heading: 'The environment workflow',
        formula: 'python -m venv .venv  ->  source .venv/bin/activate  ->  pip install -r requirements.txt  ->  pip freeze > requirements.txt',
        defines: [
          'A venv isolates package versions per project',
          'requirements.txt (or pyproject.toml) records exact versions so anyone can reproduce the environment',
          'Without it, "works on my machine" is guaranteed within a few weeks',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Pin your versions',
        body: [
          'numpy 1.x to 2.x broke a great many robotics packages. Pin exact versions in requirements.txt for anything that runs on a robot, and upgrade deliberately rather than incidentally. A robot that works is worth more than a robot with current dependencies.',
        ],
      },
    ],
    resources: [
      R('The Official Python Tutorial', 'docs', 'https://docs.python.org/3/tutorial/', { author: 'Python Software Foundation', minutes: 600, note: 'Free, authoritative, and better than most paid courses.' }),
      R('Automate the Boring Stuff with Python', 'book', 'https://automatetheboringstuff.com/', { author: 'Al Sweigart', minutes: 1200, note: 'Free to read online. Practical from chapter 1.' }),
      R('venv - creation of virtual environments', 'docs', 'https://docs.python.org/3/library/venv.html', { author: 'Python Software Foundation', minutes: 20 }),
    ],
    exercises: [
      X('code', 'Create a venv, install `numpy` pinned to a specific version, write a script that imports it and prints the version, then generate requirements.txt. Delete the venv, recreate it from requirements.txt, and confirm the script still runs.', 30, { solution: 'This full cycle proves reproducibility. If it fails, the dependency was not recorded - which is exactly the bug venvs plus manifests exist to prevent.' }),
      X('code', 'Write a script that reads a CSV of timestamp, left_encoder, right_encoder and prints: total distance per wheel, the ratio between them, and the five largest cycle-to-cycle deltas. Use only the standard library.', 30, { solution: 'csv.DictReader for parsing, floats for values, and max/min tracking in a single pass. The ratio reveals a wheel diameter or slip mismatch; large deltas reveal dropped samples.' }),
    ],
    questions: [
      mcq(1, 'In Python, blocks of code are defined by:', ['Indentation', 'Curly braces', 'The `end` keyword', 'Semicolons'], 0, 'Whitespace is syntax. Inconsistent indentation is an error, not a style issue.'),
      mcq(1, 'What does `[x*2 for x in range(3)]` produce?', ['[0, 2, 4]', '[2, 4, 6]', '[0, 1, 2]', '[1, 2, 3]'], 0, 'A list comprehension over 0, 1, 2 doubled.'),
      mcq(2, 'A virtual environment exists to:', ['Isolate package versions per project so builds are reproducible', 'Make Python run faster', 'Compile Python to machine code', 'Encrypt the source'], 0, 'Without it, a package upgrade for one project breaks every other project on the machine.'),
      mcq(2, 'Which file records the exact package versions of an environment?', ['requirements.txt (or the lock section of pyproject.toml)', 'main.py', 'setup.cfg', '.gitignore'], 0, 'Generated with `pip freeze`. Commit it, and commit the venv directory itself to .gitignore.'),
      mcq(3, 'f"{value:.3f}" formats value as:', ['A float with exactly 3 decimal places', 'A float with 3 significant figures', 'An integer', 'A percentage'], 0, '`.3f` fixes decimal places; `.3g` would fix significant figures. Knowing the difference matters when logging measurements.'),
      short(2, 'What command activates a virtual environment located in .venv on Linux/macOS?', ['source .venv/bin/activate', '. .venv/bin/activate', 'source .venv/bin/activate'], 'Either `source .venv/bin/activate` or `. .venv/bin/activate`. On Windows it is .venv\\Scripts\\activate.'),
      mcq(3, 'Why should robot software pin exact dependency versions?', [
        'Upstream breaking changes can silently invalidate a working, tested robot stack',
        'Pinning makes installation faster',
        'Unpinned versions cannot be installed',
        'It reduces memory usage',
      ], 0, 'The numpy 1.x to 2.x transition broke many robotics packages. Upgrade deliberately, with tests, never incidentally.'),
    ],
    skills: ['py-basics', 'py-environments'],
  }),

  lesson({
    id: 'py-02',
    subject: 'python',
    order: 2,
    title: 'Collections, Slicing and Data Wrangling',
    difficulty: 'beginner',
    minutes: 45,
    prereqs: ['py-01'],
    description: 'Lists, tuples, dicts, sets and deque - choosing the right structure and using it efficiently.',
    why: 'Sensor logs, waypoint lists, configuration and lookup tables are all collections. Choosing a dict over a list for lookup is the difference between O(1) and O(n), which in a control loop is the difference between working and missing deadlines.',
    objectives: [
      'Choose the correct collection type for a task based on lookup, ordering and mutability requirements',
      'Use slicing, including negative and stepped slices, correctly',
      'Use collections.deque and defaultdict for the patterns that recur in robotics code',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Choosing a collection',
        columns: ['Type', 'Ordered', 'Mutable', 'Lookup', 'Use for'],
        rows: [
          ['list', 'yes', 'yes', 'O(n) by value, O(1) by index', 'Sequences, buffers you append to'],
          ['tuple', 'yes', 'no', 'O(1) by index', 'Fixed records, dictionary keys, returning several values'],
          ['dict', 'insertion order', 'yes', 'O(1) average by key', 'Config, lookups, grouping, counters'],
          ['set', 'no', 'yes', 'O(1) membership', 'Deduplication, membership tests'],
          ['collections.deque', 'yes', 'yes', 'O(1) both ends', 'Sliding windows, sensor ring buffers'],
        ],
      },
      {
        kind: 'formula',
        heading: 'Slicing',
        formula: 'seq[start:stop:step]  - stop is EXCLUSIVE, negative indices count from the end',
        defines: [
          'data[-1] is the last element; data[-5:] the last five',
          'data[::-1] reverses',
          'data[::10] takes every tenth sample - the cheapest way to decimate a log',
          'Slices of lists are new lists (copies); slices never raise on out-of-range bounds',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - a moving-average filter with deque',
        problem: 'Smooth a noisy distance stream with a 10-sample moving average without recomputing the whole window each time.',
        solution: [
          'Use deque(maxlen=10): appending automatically discards the oldest element, so the buffer is bounded with no manual index arithmetic',
          'Naive: sum(window)/len(window) each sample is O(n) per sample',
          'Incremental: keep a running total, subtract the value leaving and add the value entering - O(1) per sample',
          'For 10 samples the difference is negligible; for a 500-sample window at 100 Hz it is the difference between 0.5% and 25% of your CPU',
        ],
        answer: 'deque(maxlen=N) plus an incremental running sum',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Do not append to a list inside a hot loop when a deque will do',
        body: [
          'An unbounded list grows forever - that is a memory leak on a robot that runs for hours. Any buffer with a fixed window must have a maximum length. `deque(maxlen=N)` enforces it structurally, so the bug cannot be reintroduced by a future edit.',
        ],
      },
    ],
    resources: [
      R('Python: Data Structures tutorial', 'docs', 'https://docs.python.org/3/tutorial/datastructures.html', { author: 'Python Software Foundation', minutes: 60 }),
      R('collections - container datatypes', 'docs', 'https://docs.python.org/3/library/collections.html', { author: 'Python Software Foundation', minutes: 40 }),
    ],
    exercises: [
      X('code', 'Implement a `MovingAverage(n)` class using deque(maxlen=n) with both a naive and an incremental sum. Verify both give identical results on a 1000-sample noisy signal and report the timing difference for n = 500.', 30, { solution: 'Both must match to within float tolerance. The incremental version should be roughly constant time per sample while the naive version grows with n. Guard the incremental version against drift by periodically recomputing the full sum.' }),
      X('code', 'Given a list of 10,000 log lines "timestamp,level,message", build a dict counting messages per level, and a dict grouping the last 100 ERROR messages by message text. Use defaultdict.', 25, { solution: 'Counter or defaultdict(int) for the level counts; defaultdict(list) with a deque(maxlen=100) window for the errors. defaultdict removes the "if key not in dict" boilerplate that hides bugs.' }),
    ],
    questions: [
      mcq(1, 'Average-case lookup by key in a dict is:', ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], 0, 'Hash-based. Worst case is O(n) with pathological collisions, which is rare with normal keys.'),
      mcq(1, 'data[-3:] returns:', ['The last three elements', 'The first three elements', 'Every third element', 'An error'], 0, 'Negative indices count from the end; the stop bound is omitted so it runs to the end.'),
      mcq(1, 'data[2:5] on a list of 10 elements returns how many items?', ['3', '4', '2', '5'], 0, 'Indices 2, 3 and 4 - the stop index is exclusive.'),
      mcq(2, 'Which collection is best for a bounded sliding window of sensor samples?', ['collections.deque with maxlen', 'list', 'dict', 'set'], 0, 'maxlen enforces the bound structurally, so an unbounded memory leak cannot be reintroduced.'),
      mcq(2, 'Which type is immutable and therefore usable as a dictionary key?', ['tuple', 'list', 'dict', 'set'], 0, 'Keys must be hashable, which requires immutability. A list is unhashable.'),
      mcq(3, 'An unbounded list that a robot appends to every cycle will:', ['Grow until memory is exhausted - a leak', 'Automatically discard old items', 'Stop growing after 1024 items', 'Cause a stack overflow'], 0, 'Bounded buffers must have an explicit maximum. deque(maxlen=N) is the structural fix.'),
      numeric(2, 'Using data[::10] on 1,000 samples yields how many samples?', 100, 'Every tenth element: 1000/10 = 100.', { unit: 'samples' }),
      mcq(3, 'defaultdict(list) differs from dict because:', ['Accessing a missing key creates the default value instead of raising KeyError', 'It is faster', 'It cannot store lists', 'It sorts keys automatically'], 0, 'It removes the existence-check boilerplate that is a common source of grouping bugs.'),
    ],
    skills: ['py-collections'],
  }),

  lesson({
    id: 'py-03',
    subject: 'python',
    order: 3,
    title: 'Functions, Modules and Type Hints',
    difficulty: 'beginner',
    minutes: 40,
    prereqs: ['py-02'],
    description: 'Writing reusable modules, argument patterns, and adding type hints that a checker can verify.',
    why: 'Type hints turn Python into a language where an entire class of robotics bug - passing degrees where radians are expected, passing a list where a float is expected - is caught before you run the code. On a project that lives for months, this pays for itself many times over.',
    objectives: [
      'Write functions with sensible argument patterns: keyword-only, defaults and *args/**kwargs',
      'Structure a multi-file Python package with explicit imports',
      'Annotate functions with type hints and interpret a type checker\'s output',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Type hints are documentation a machine can check',
        body: [
          'Python ignores hints at runtime, but mypy or pyright read them and report mismatches. `def to_radians(angle_deg: float) -> float` says exactly what unit is expected, and a call passing a list of angles is flagged immediately.',
          'The convention that matters most in robotics: put the unit in the name AND the type. `angle_rad: float`, `distance_m: float`, `timeout_s: float`. Between unit errors and hint checking, most interface bugs disappear.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Argument patterns',
        formula: 'def f(positional, *, keyword_only, default=1, **kwargs)',
        defines: [
          'Everything after `*` must be passed by name - prevents argument-order bugs',
          'Mutable default arguments are a trap: `def f(x=[])` shares ONE list across all calls',
          'Use `None` as the default and create the mutable value inside the body',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - the mutable default bug',
        problem: 'What does this print, and why?\ndef add_item(item, bucket=[]):\n    bucket.append(item)\n    return bucket\nprint(add_item(1)); print(add_item(2))',
        solution: [
          'It prints [1] then [1, 2] - not [1] and [2]',
          'The default list is created ONCE when the function is defined, and the same object is reused on every call that omits the argument',
          'Fix: `def add_item(item, bucket=None): bucket = [] if bucket is None else bucket`',
        ],
        answer: '[1] then [1, 2] - a classic Python bug caused by a mutable default argument',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Package layout that scales',
        body: [
          'Put code in a package directory with an `__init__.py`, tests in a sibling `tests/` directory, and a `pyproject.toml` at the root. Import with absolute paths (`from robot.control import pid`) rather than deep relative chains. Relative imports beyond one level make refactoring painful and break when a module is run directly as a script.',
        ],
      },
    ],
    resources: [
      R('Python: typing module', 'docs', 'https://docs.python.org/3/library/typing.html', { author: 'Python Software Foundation', minutes: 45 }),
      R('mypy documentation', 'docs', 'https://mypy.readthedocs.io/en/stable/', { minutes: 60, note: 'Free. Running mypy once on an existing project usually finds real bugs.' }),
      R('Python: modules', 'docs', 'https://docs.python.org/3/tutorial/modules.html', { author: 'Python Software Foundation', minutes: 30 }),
    ],
    exercises: [
      X('code', 'Annotate a small robot module (at least 6 functions) with full type hints, run mypy in strict mode, and fix every reported issue. Record what it found.', 35, { solution: 'Typical findings: a function that can return None on an error path but is annotated -> float; a variable reassigned to a different type; an argument passed positionally where the order was ambiguous. All are real bugs or latent ones.' }),
      X('code', 'Write a function `clamp(value, lo, hi, *, unit="")` that is keyword-only for `unit`, and demonstrate that the mutable-default trap does not apply to it. Then write a version WITH the trap and show the differing behaviour.', 20, { solution: 'Immutable defaults (str, int, None, tuple) are safe because they are never mutated in place. Only mutable defaults (list, dict, set) exhibit the shared-object bug.' }),
    ],
    questions: [
      mcq(1, 'Type hints in Python are:', ['Checked by external tools but ignored at runtime', 'Enforced by the interpreter', 'Only usable on function arguments', 'Compiled into machine code'], 0, 'mypy or pyright check them statically. The runtime does not enforce them, which is why the checker must be part of CI.'),
      mcq(1, 'What is wrong with `def f(items=[])`?', ['The list is created once and shared across all calls that use the default', 'Lists cannot be defaults', 'It raises a SyntaxError', 'Nothing - it is idiomatic'], 0, 'Use `items=None` and create the list inside the body. This bug produces baffling accumulation across calls.'),
      mcq(2, 'Parameters after `*` in a signature must be:', ['Passed by keyword', 'Passed positionally', 'Optional', 'Type-annotated'], 0, 'Keyword-only parameters prevent argument-order mistakes, which are invisible when two parameters have the same type.'),
      mcq(2, 'The best naming convention for a robotics function argument holding an angle is:', ['angle_rad', 'angle', 'a', 'angle_degrees_or_radians'], 0, 'Encode the unit in the name. Combined with a type hint, this removes the most common interface bug in robot code.'),
      mcq(3, 'Absolute imports (`from robot.control import pid`) are preferred over deep relative imports because:', [
        'They keep working when modules are moved or run directly as scripts',
        'They execute faster',
        'Relative imports are deprecated',
        'They avoid the need for __init__.py',
      ], 0, 'Deep relative chains (../../) break under refactoring and when a module is executed directly.'),
      short(1, 'What tool would you run to statically check Python type hints?', ['mypy', 'pyright', 'pyre', 'mypy or pyright'], 'mypy is the standard; pyright (used by VS Code) is a fast alternative.'),
      mcq(3, 'A function annotated `-> float` has a code path that returns None. What does a type checker report?', [
        'An error: the return type does not include None; the annotation should be `float | None`',
        'Nothing - None is a float',
        'A warning only at runtime',
        'It converts None to 0.0',
      ], 0, 'This is a real bug class: the caller will do arithmetic on None and crash. Make the possibility explicit and handle it.'),
    ],
    skills: ['py-functions', 'py-typing'],
  }),

  lesson({
    id: 'py-04',
    subject: 'python',
    order: 4,
    title: 'Files, JSON and Serial Communication',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['py-03'],
    description: 'Persisting and exchanging data: file I/O, JSON, CSV, and reading from a serial port.',
    why: 'Every robot you build needs to log data, load configuration and talk to a microcontroller. JSON is the interchange format for configuration and APIs; pyserial is how a laptop talks to an Arduino. These three skills cover most practical robot integration work.',
    objectives: [
      'Read and write text and JSON files safely, including handling missing and malformed files',
      'Serialise robot state and configuration to JSON and validate it on load',
      'Read framed data from a serial port robustly, handling partial and corrupt frames',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Always use a context manager for files',
        body: [
          '`with open(path) as f:` guarantees the file is closed even if an exception is thrown. An unclosed file on an embedded Linux device can silently lose buffered data on power loss - and robots lose power abruptly.',
          'When writing a configuration file, write to a temporary name then `os.replace()` it into place. That operation is atomic on the same filesystem, so a crash mid-write leaves either the old file or the new one, never a half-written one. This pattern is used by essentially every robust piece of software that persists state - including this app.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Robust serial reading',
        formula: 'read until delimiter -> parse -> validate -> on failure, resynchronise by discarding to the next delimiter',
        defines: [
          'Never assume a read returns a complete frame: serial delivers whatever bytes have arrived',
          'A fixed header plus a length plus a checksum lets you detect corruption and resynchronise',
          'Always set a read timeout, or a dead link blocks forever',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - a minimal framed protocol',
        problem: 'Design a serial frame for sending telemetry from a microcontroller, and show how the receiver resynchronises after a corrupted byte.',
        solution: [
          'Frame: 0xAA (start) | length (1 byte) | payload (length bytes) | checksum (XOR of length and payload)',
          'Receiver: scan for 0xAA, read length, read that many bytes, read checksum, verify',
          'On checksum failure: discard the buffer up to and including the next 0xAA and continue - do not abort',
          'This recovers from any single corrupted byte within one frame and loses at most that frame',
        ],
        answer: 'Start byte + length + payload + checksum, with resynchronisation on the next start byte',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Validate configuration on load',
        body: [
          'A config file with a typo produces behaviour that looks like a hardware fault. Validate every field: types, ranges, units, and required keys. Fail loudly at startup with the field name and the offending value. A robot that refuses to start and tells you why is far better than one that starts and drives into a wall because `max_speed` was read as a string.',
        ],
      },
    ],
    resources: [
      R('json - JSON encoder and decoder', 'docs', 'https://docs.python.org/3/library/json.html', { author: 'Python Software Foundation', minutes: 30 }),
      R('pyserial documentation', 'docs', 'https://pyserial.readthedocs.io/en/latest/', { minutes: 60, note: 'Free. Read the "Short Introduction" and the timeout section carefully.' }),
      R('Python: os.replace', 'docs', 'https://docs.python.org/3/library/os.html#os.replace', { author: 'Python Software Foundation', minutes: 10 }),
    ],
    exercises: [
      X('code', 'Write a config loader that reads robot.json, validates every field (types, ranges, required keys), and on any error reports the exact field and value. Test it against four deliberately broken configs.', 35, { solution: 'Cases to test: missing required key, wrong type (string where number expected), out-of-range value, malformed JSON. Each must produce a distinct, actionable message and a non-zero exit - never a silent default.' }),
      X('code', 'Implement an atomic JSON writer (temp file plus os.replace) and a serial frame parser with the protocol above. Test the parser with a byte stream containing a corrupted checksum and a truncated frame.', 40, { solution: 'The parser must resynchronise and still deliver the frames after the corruption. Test by feeding bytes one at a time and in random chunk sizes - a parser that only works with whole-frame reads is broken.' }),
    ],
    questions: [
      mcq(1, 'Why use `with open(...)` instead of a bare open/close?', ['It guarantees closure even if an exception is raised, preventing lost buffered data', 'It is faster', 'It encrypts the file', 'Bare open is not permitted'], 0, 'Robots lose power abruptly; unflushed buffers mean lost logs and corrupt configuration.'),
      mcq(1, 'The atomic way to replace a config file is:', ['Write to a temporary file then os.replace() it into place', 'Open the target in write mode and write', 'Delete then write', 'Append and truncate'], 0, 'os.replace is atomic on the same filesystem, so a crash leaves the old file or the new file, never a partial one.'),
      mcq(2, 'json.load on a malformed file raises:', ['json.JSONDecodeError', 'ValueError only in Python 2', 'Nothing - it returns None', 'OSError'], 0, 'JSONDecodeError subclasses ValueError. Catch it explicitly and report the position it gives you.'),
      mcq(2, 'A serial read with no timeout on a dead link will:', ['Block forever', 'Return empty immediately', 'Raise an exception', 'Return the last good frame'], 0, 'Always set a timeout. A blocked reader thread makes the whole robot unresponsive with no error message.'),
      mcq(3, 'Why must a serial parser handle partial frames?', ['Serial delivers whatever bytes have arrived, which may be less than one frame', 'Because baud rates vary', 'Because USB is unreliable', 'It does not need to'], 0, 'Buffer bytes until a complete frame is available. A parser tested only with whole-frame reads fails in production.'),
      mcq(3, 'The purpose of a checksum plus a start byte in a frame protocol is:', ['To detect corruption and to resynchronise the stream after losing alignment', 'To compress the data', 'To encrypt the data', 'To reduce the baud rate needed'], 0, 'Without a start byte you cannot recover alignment; without a checksum you cannot detect corruption.'),
      short(1, 'Which Python standard-library module serialises dicts to JSON text?', ['json'], 'The `json` module: json.dumps / json.loads for strings, json.dump / json.load for files.'),
    ],
    skills: ['py-io', 'py-serial'],
  }),

  lesson({
    id: 'py-05',
    subject: 'python',
    order: 5,
    title: 'Classes, Exceptions and Testing',
    difficulty: 'intermediate',
    minutes: 50,
    prereqs: ['py-04'],
    description: 'Object design for hardware abstraction, exception handling that does not hide faults, and unit testing with pytest.',
    why: 'The motor driver, the sensor and the simulated versions of both should be interchangeable. That is class design. And a robot that swallows exceptions silently fails in ways that take days to find. Tests are what let you change control gains without re-verifying the whole robot by hand.',
    objectives: [
      'Design a class hierarchy that lets hardware and simulation be substituted',
      'Handle exceptions without masking failures, and choose when to let them propagate',
      'Write pytest tests including fixtures, parametrisation and mocks for hardware',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Never write a bare except',
        body: [
          '`except:` catches everything including KeyboardInterrupt and SystemExit, and hides the very error you were trying to diagnose. Catch the specific exception you expect, handle it if you can, and re-raise if you cannot. A robot that logs "error" and continues after a failed sensor read will drive blind.',
          'The useful pattern is: catch narrowly, add context, re-raise. `except OSError as e: raise SensorError(f"I2C read failed on {self.address}") from e`. The original traceback is preserved by `from e`, and the new message tells you which device failed.',
        ],
      },
      {
        kind: 'formula',
        heading: 'pytest essentials',
        formula: 'test_*.py files, test_* functions, assert statements, @pytest.fixture, @pytest.mark.parametrize',
        defines: [
          'Fixtures provide setup (a simulated robot, a temp directory) with automatic teardown',
          'Parametrisation runs one test body across many input/expected pairs - ideal for math and control code',
          'Mocks stand in for hardware: assert the right command was sent without a motor attached',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - testing a controller with no hardware',
        problem: 'How do you unit test a PID controller that normally commands a real motor?',
        solution: [
          'Define the controller against an actuator interface with a single method, set_output(value)',
          'In the test, inject a recording double that stores every value it was given',
          'Drive the controller with a scripted error sequence and assert on the recorded outputs',
          'Test the specific behaviours that matter: proportional response scales with error, integral accumulates, derivative responds to a step, and the output is clamped at the saturation limits',
          'Also test anti-windup: saturate the output for many cycles, then reverse the error, and assert recovery within a bounded number of cycles',
        ],
        answer: 'Dependency injection plus a recording double - no hardware, fully deterministic, runs in milliseconds',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Test the failure paths',
        body: [
          'For robot software the error paths matter more than the happy path: sensor timeout, out-of-range reading, motor driver fault, low battery, command watchdog expiry. Each of these should have a test asserting the system enters a defined safe state. Untested error handling is unimplemented error handling.',
        ],
      },
    ],
    resources: [
      R('pytest documentation', 'docs', 'https://docs.pytest.org/en/stable/', { minutes: 90, note: 'Free. The parametrize and fixture chapters are the ones that matter.' }),
      R('Python: errors and exceptions', 'docs', 'https://docs.python.org/3/tutorial/errors.html', { author: 'Python Software Foundation', minutes: 30 }),
      R('unittest.mock', 'docs', 'https://docs.python.org/3/library/unittest.mock.html', { author: 'Python Software Foundation', minutes: 40 }),
    ],
    exercises: [
      X('code', 'Implement `MotorDriver` as an abstract base with `HardwareMotorDriver` and `RecordingMotorDriver`. Write pytest tests for a PID controller using the recording driver, covering P, I, D, output clamping and anti-windup.', 45, { solution: 'Parametrise over error sequences. For anti-windup: drive a large constant error until the output saturates for 20 cycles, then flip the error sign and assert the output leaves saturation within a bounded number of cycles. Without anti-windup that assertion fails dramatically - which is the point of the test.' }),
      X('code', 'Write a sensor wrapper that raises a specific `SensorTimeout` after N ms, and test all three paths: success, timeout, and out-of-range value. Confirm no bare excepts exist in your codebase.', 30, { solution: 'Run a linter rule or grep for `except:` and `except Exception:` without a re-raise. Each catch must either fully handle the condition or add context and re-raise.' }),
    ],
    questions: [
      mcq(1, 'A bare `except:` clause is dangerous because:', ['It catches everything including KeyboardInterrupt and hides the fault you were diagnosing', 'It is slower', 'It cannot log', 'It only works in Python 2'], 0, 'Catch narrowly, add context, re-raise when you cannot genuinely handle it.'),
      mcq(1, 'The correct way to add context to an exception without losing the original is:', ['raise NewError(msg) from e', 'raise NewError(msg)', 'log and continue', 'except: pass'], 0, '`from e` chains the causes so the traceback shows both. Silent continuation is how robots drive blind.'),
      mcq(2, 'A pytest fixture is used to:', ['Provide setup and teardown for tests, such as a simulated robot instance', 'Skip tests', 'Mark tests as slow', 'Generate random data only'], 0, 'Fixtures are dependency injection for tests - the same principle that makes production code testable.'),
      mcq(2, '@pytest.mark.parametrize is most useful for:', ['Running one test body across many input/expected pairs', 'Skipping slow tests', 'Mocking hardware', 'Measuring coverage'], 0, 'Ideal for math, filtering and control code where a table of cases documents the behaviour.'),
      mcq(3, 'To test a PID controller without hardware you should:', ['Inject a recording double behind the actuator interface', 'Run it on the real robot', 'Comment out the hardware calls', 'Test it manually with a multimeter'], 0, 'Dependency injection makes the test deterministic and fast enough to run on every commit.'),
      mcq(3, 'Which behaviour most needs an explicit test in a controller?', ['Anti-windup recovery after prolonged saturation', 'That the code compiles', 'Variable naming', 'That logging is enabled'], 0, 'It only appears after many cycles under saturation - exactly the condition that is hard to reproduce on hardware.'),
      mcq(3, 'A robot logs "sensor error" and continues with the last known value. What is the main risk?', [
        'The system keeps acting on stale data indefinitely, and the failure looks like a control bug',
        'Logging is too slow',
        'The last value is always wrong',
        'There is no risk if the value is recent',
      ], 0, 'Stale data must be time-bounded: reject readings older than a threshold and enter a defined safe state.'),
    ],
    skills: ['py-oop', 'py-testing'],
  }),

  lesson({
    id: 'py-06',
    subject: 'python',
    order: 6,
    title: 'Python for Robotics Data: NumPy and Plotting',
    difficulty: 'intermediate',
    minutes: 50,
    prereqs: ['py-05', 'math-16'],
    description: 'Vectorised computation with NumPy, and plotting telemetry so you can see what your robot did.',
    why: 'Robot state is vectors and matrices; logs are time series. NumPy gives you the linear algebra from the maths track at C speed, and plotting is how you actually diagnose a control problem - a graph of error over time reveals an oscillation that a table of numbers hides.',
    objectives: [
      'Use NumPy arrays for vector and matrix operations instead of Python loops',
      'Explain why vectorisation is faster and how broadcasting works',
      'Produce a diagnostic multi-panel plot of robot telemetry with correct time axes',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Vectorisation removes the interpreter from the loop',
        body: [
          'A Python `for` loop re-executes interpreter bytecode per element. A NumPy operation runs a compiled loop over a contiguous C array. For element-wise math on thousands of samples the difference is typically 50-100x.',
          'The rule: express your computation as operations on whole arrays. Instead of looping over timesteps to rotate a vector, build an (N,2) array of points and multiply by the rotation matrix once. This also removes a class of index bug, because there are no indices.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Broadcasting and the operations you will use',
        formula: '(N,2) @ (2,2) -> (N,2)      np.linalg.norm(v)      np.arctan2(y, x)      np.diff(a) / dt',
        defines: [
          'Broadcasting applies an operation across a trailing dimension: (N,3) * (3,) scales each row',
          '@ is matrix multiplication; * is element-wise - mixing them up is a silent bug',
          'np.diff gives finite differences, which is how you estimate velocity from position',
          'np.gradient is a central difference and is less noisy at the endpoints',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - rotating a point cloud',
        problem: 'Rotate 10,000 2D points by 30 degrees without a loop.',
        solution: [
          'Build R = [[cos a, -sin a], [sin a, cos a]] with a in RADIANS: np.deg2rad(30)',
          'points_rotated = points @ R.T, where points has shape (10000, 2)',
          'The transpose is needed because @ applies R to each row treated as a column vector',
          'Verify: the norm of every point must be unchanged - np.allclose(np.linalg.norm(points, axis=1), np.linalg.norm(points_rotated, axis=1))',
        ],
        answer: 'One matrix multiply, plus a norm-preservation check as the test',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'The diagnostic plot that solves most control problems',
        body: [
          'Four stacked panels sharing a time axis: setpoint versus measured value, error, controller output (with saturation limits drawn as horizontal lines), and the disturbance or a sensor health flag. Almost every control problem is visible in that view: oscillation shows in the error panel, saturation shows as a flat-topped output, lag shows as a setpoint/measured offset, and sensor dropouts show as gaps. Learn to produce it automatically for every test run.',
        ],
      },
    ],
    resources: [
      R('NumPy: absolute beginner\u2019s guide', 'docs', 'https://numpy.org/doc/stable/user/absolute_beginners.html', { author: 'NumPy developers', minutes: 60 }),
      R('NumPy: broadcasting', 'docs', 'https://numpy.org/doc/stable/user/basics.broadcasting.html', { author: 'NumPy developers', minutes: 30 }),
      R('Matplotlib documentation', 'docs', 'https://matplotlib.org/stable/index.html', { minutes: 60 }),
    ],
    exercises: [
      X('code', 'Generate a synthetic 2-link arm trajectory: 1000 joint angle pairs over time. Compute end-effector positions with vectorised forward kinematics, plot the path, and verify the maximum distance from the origin never exceeds L1 + L2.', 40, { solution: 'x = L1*cos(q1) + L2*cos(q1+q2), y likewise, all as array operations. The reach check is a real assertion: any point beyond L1+L2 means a sign or angle-sum error.' }),
      X('code', 'Build the four-panel diagnostic plot described above from a CSV of a simulated PID run. Include saturation limit lines and a shared time axis.', 35, { solution: 'fig, axes = plt.subplots(4, 1, sharex=True). axhline for the saturation limits on the output panel. Save as PNG at a fixed DPI so results are comparable across runs.' }),
      X('calculation', 'Estimate the speedup from vectorising a loop that multiplies 100,000 floats by a scalar, given that the Python loop costs about 50 ns per element and NumPy costs about 1 ns per element.', 10, { solution: 'Loop: 5 ms. NumPy: 0.1 ms. A 50x speedup - typical for element-wise operations, and the reason telemetry processing is written with arrays.' }),
    ],
    questions: [
      mcq(1, 'In NumPy, `a * b` on two arrays performs:', ['Element-wise multiplication', 'Matrix multiplication', 'Broadcasting only if shapes match exactly', 'Concatenation'], 0, 'Matrix multiplication is `a @ b` or np.dot. Confusing the two is a silent bug that produces plausible-looking wrong numbers.'),
      mcq(1, 'Vectorised NumPy code is faster than an equivalent Python loop mainly because:', ['The loop runs in compiled code over contiguous memory, not in the interpreter', 'NumPy uses multiple threads for every operation', 'NumPy caches results', 'Python loops are deprecated'], 0, 'Small element-wise operations are usually single-threaded; the win comes from removing interpreter overhead.'),
      mcq(2, 'Broadcasting allows:', ['An operation between arrays of different but compatible shapes, such as (N,3) * (3,)', 'Any two arrays to be combined', 'Arrays to be resized automatically', 'Only 1D operations'], 0, 'Shapes are compared from the trailing dimension; a size-1 dimension is stretched.'),
      mcq(2, 'To estimate velocity from a sampled position array you would use:', ['np.diff(positions) / dt', 'np.sum(positions) * dt', 'np.mean(positions)', 'positions ** 2'], 0, 'A finite difference. np.gradient uses central differences and handles endpoints more gracefully.'),
      mcq(3, 'You rotate points with `points @ R` and get unexpected results. The most likely cause is:', [
        'R needs transposing because @ treats each row as a column vector on the right',
        'NumPy cannot rotate points',
        'The angles must be in degrees',
        'Broadcasting does not apply to matrices',
      ], 0, 'For row-vector layouts use points @ R.T, or equivalently (R @ points.T).T. Angles must be in radians.'),
      mcq(3, 'Which assertion best verifies a rotation implementation?', ['Vector norms are unchanged for every point', 'The output shape is unchanged', 'The mean of the points is unchanged', 'The first point is unchanged'], 0, 'Rotation preserves length. It is a property-based test that catches sign errors, degree/radian mix-ups and transpose errors at once.'),
      numeric(2, 'How many elements are in a NumPy array of shape (200, 3)?', 600, '200 rows times 3 columns.', { unit: 'elements' }),
    ],
    skills: ['py-numpy', 'py-plotting'],
  }),
];
