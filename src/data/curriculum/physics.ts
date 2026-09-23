import { R, X, lesson, mcq, numeric, short } from './helpers';
import type { Lesson } from '@/lib/types';

/**
 * FOUNDATION / Physics.
 *
 * Ordered so that measurement comes before motion, motion before forces, forces
 * before energy, and rotation before centre of mass - which is the exact
 * sequence the Humanoid track later depends on.
 */
export const PHYSICS_LESSONS: Lesson[] = [
  lesson({
    id: 'phys-01',
    subject: 'physics',
    order: 1,
    title: 'Units, SI and Dimensional Analysis',
    difficulty: 'intro',
    minutes: 35,
    prereqs: ['math-08'],
    description: 'The SI base units, derived units, prefixes, and how to check an equation by its dimensions alone.',
    why: 'Units are the cheapest error detector in engineering. If the two sides of an equation do not have the same dimensions, the equation is wrong regardless of how good the algebra looked. Dimensional analysis has caught more robotics bugs than any debugger.',
    objectives: [
      'Name the SI base units and the derived units used in mechanics and electronics',
      'Convert between units using factor-label method without arithmetic slips',
      'Check whether an equation is dimensionally consistent, and use that to find errors',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Units you will use every week',
        columns: ['Quantity', 'SI unit', 'Symbol', 'In base units'],
        rows: [
          ['Length', 'metre', 'm', 'm'],
          ['Mass', 'kilogram', 'kg', 'kg'],
          ['Time', 'second', 's', 's'],
          ['Force', 'newton', 'N', 'kg m / s^2'],
          ['Energy / work', 'joule', 'J', 'kg m^2 / s^2'],
          ['Power', 'watt', 'W', 'kg m^2 / s^3'],
          ['Pressure / stress', 'pascal', 'Pa', 'kg / (m s^2)'],
          ['Charge', 'coulomb', 'C', 'A s'],
          ['Voltage', 'volt', 'V', 'kg m^2 / (A s^3)'],
          ['Current', 'ampere', 'A', 'A'],
          ['Resistance', 'ohm', 'ohm', 'V / A'],
          ['Torque', 'newton metre', 'Nm', 'kg m^2 / s^2'],
        ],
      },
      {
        kind: 'text',
        heading: 'Torque and energy share units but are not the same thing',
        body: [
          'Both Nm and J reduce to kg m^2/s^2, yet a torque of 10 Nm is not 10 J of energy. Torque is a vector-like quantity describing a turning effort; energy is a scalar. This is a genuine case where dimensional analysis is necessary but not sufficient - it cannot tell you everything, and pretending otherwise is its own error.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Factor-label conversion',
        formula: 'value * (wanted unit / current unit) = value in wanted unit',
        defines: [
          '5 m/s * (3600 s / 1 h) * (1 km / 1000 m) = 18 km/h',
          'Multiply by fractions equal to 1 so the value never changes, only the units',
          'Cancel units like algebra terms - if they do not cancel, your factor is upside down',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - catching a formula error',
        problem: 'Someone claims kinetic energy is KE = m * v. Is that possible?',
        solution: [
          'Left side: joules = kg m^2 / s^2',
          'Right side: kg * (m/s) = kg m / s',
          'kg m^2/s^2 != kg m/s, so the equation is dimensionally impossible',
          'The correct form KE = (1/2) m v^2 gives kg * (m/s)^2 = kg m^2/s^2, which matches',
        ],
        answer: 'No - the dimensions do not match. KE = 1/2 m v^2 does.',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'The Mars Climate Orbiter',
        body: [
          'In 1999 a $125M spacecraft was lost because one team used pound-force seconds and another used newton seconds in the same navigation software. Units are not a formality. In every calculation you write, state the units, and convert once at the boundary rather than repeatedly in the middle.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Units and measurement', 'course', 'https://www.khanacademy.org/science/physics/one-dimensional-motion', { author: 'Khan Academy', minutes: 120 }),
      R('NIST: SI base units', 'docs', 'https://www.nist.gov/pml/owm/si-units', { author: 'NIST', minutes: 30, note: 'The authoritative free reference.' }),
      R('Dimensional analysis', 'article', 'https://en.wikipedia.org/wiki/Dimensional_analysis', { minutes: 25 }),
    ],
    exercises: [
      X('calculation', 'Convert: (a) 3 m/s to km/h  (b) 72 km/h to m/s  (c) 250 g to kg  (d) 1.5 kWh to joules', 12, {
        solution: '(a) 10.8 km/h  (b) 20 m/s  (c) 0.25 kg  (d) 1.5 * 3.6e6 = 5.4e6 J',
      }),
      X('question', 'Check by dimensional analysis whether F = m * a is consistent, and whether F = m * v / t is also consistent. Explain what that tells you about the limits of the method.', 12, {
        solution: 'F = m*a: kg * m/s^2 = kg m/s^2 = N. Consistent. F = m*v/t: kg * (m/s)/s = kg m/s^2 = N. Also dimensionally consistent, and in fact algebraically identical to m*a when a = v/t. Dimensional analysis confirms consistency but cannot prove an equation is the correct physical law - a dimensionless constant or a wrong-but-matching structure would pass.',
      }),
      X('calculation', 'Express 1 watt and 1 volt in terms of SI base units, and verify that P = V * I is dimensionally consistent.', 12, {
        solution: 'W = J/s = kg m^2/s^3. V = W/A = kg m^2/(A s^3). V * I = kg m^2/(A s^3) * A = kg m^2/s^3 = W. Consistent.',
      }),
    ],
    questions: [
      mcq(1, 'The SI unit of force is the:', ['newton', 'joule', 'watt', 'pascal'], 0, 'One newton accelerates one kilogram at one metre per second squared.'),
      mcq(1, 'One joule expressed in base units is:', ['kg m^2 / s^2', 'kg m / s^2', 'kg m^2 / s^3', 'kg / (m s^2)'], 0, 'J = N m = (kg m/s^2) * m = kg m^2/s^2.'),
      numeric(2, 'Convert 5 m/s to km/h.', 18, '5 * 3.6 = 18 km/h.', { unit: 'km/h' }),
      numeric(2, 'Convert 90 km/h to m/s.', 25, '90 / 3.6 = 25 m/s.', { unit: 'm/s' }),
      mcq(3, 'An equation gives energy = m * v. What does dimensional analysis say?', [
        'It is impossible: kg m/s is not kg m^2/s^2',
        'It is correct',
        'It is correct only in SI units',
        'Dimensional analysis cannot judge it',
      ], 0, 'The dimensions differ by one factor of length per time, so the equation cannot be right.'),
      mcq(3, 'Dimensional analysis CANNOT detect which of these errors?', [
        'A missing dimensionless factor such as the 1/2 in KE = 1/2 m v^2',
        'Using velocity where acceleration belongs',
        'Adding metres to seconds',
        'A formula returning force when energy was expected',
      ], 0, 'Dimensionless constants carry no units, so the method is blind to them. It is a filter, not a proof.'),
      short(1, 'What is the SI unit of electrical resistance?', ['ohm', 'ohms', 'omega'], 'The ohm, equal to one volt per ampere.'),
    ],
    skills: ['phys-units'],
  }),

  lesson({
    id: 'phys-02',
    subject: 'physics',
    order: 2,
    title: 'Measurement, Error and Uncertainty',
    difficulty: 'beginner',
    minutes: 35,
    prereqs: ['phys-01', 'math-03'],
    description: 'Precision versus accuracy, systematic and random error, repeatability and instrument limits.',
    why: 'A robot only knows the world through sensors, and sensors are wrong. Every filter, calibration routine and control loop in this roadmap exists because measurements carry error. Until you can characterise that error, you cannot design around it.',
    objectives: [
      'Distinguish accuracy from precision and systematic from random error',
      'Compute absolute, relative and percentage error of a measurement',
      'Explain why averaging reduces random error but not systematic error',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Two independent ways to be wrong',
        body: [
          'Accuracy is closeness to the true value. Precision is closeness of repeated measurements to each other. A sensor can be precise but inaccurate (consistently 0.3 V high), accurate but imprecise (correct on average, noisy per reading), both, or neither.',
          'Systematic error shifts every reading the same way: a miscalibrated scale, a zero offset, a thermal drift. Random error scatters readings around the true value: electrical noise, vibration, quantisation. The distinction decides what you do about it - systematic error must be calibrated out, random error must be averaged or filtered out.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Error quantities',
        formula: 'absolute error = |measured - true|      relative error = absolute / true      percent error = relative * 100',
        defines: [
          'Resolution: the smallest change an instrument can display (an ADC with 10 bits over 5 V resolves about 4.9 mV)',
          'Repeatability: spread of readings under identical conditions',
          'Standard error of the mean falls as 1/sqrt(N): 4 samples halve the noise, 100 samples cut it to a tenth',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - ADC resolution',
        problem: 'An Arduino-class ADC has 10 bits and a 5 V reference. What is the smallest voltage change it can resolve, and what is the percentage uncertainty on a 1.0 V reading?',
        solution: [
          'Resolution = 5 V / 2^10 = 5 / 1024 = 4.88 mV',
          'Quantisation error is up to half a step: about 2.44 mV',
          'Percentage uncertainty on 1.0 V: 0.00244 / 1.0 * 100 = 0.24%',
        ],
        answer: 'About 4.9 mV resolution; 0.24% quantisation uncertainty at 1 V',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Averaging is not free',
        body: [
          'Averaging N samples reduces random noise by sqrt(N) but costs time, and during that time the quantity may have changed. Averaging a distance reading while the robot moves produces a value that was never true at any instant. Choose the window based on how fast the measured quantity changes - that trade-off is the whole subject of filtering.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Measurement and uncertainty', 'article', 'https://www.khanacademy.org/science/physics/introduction-to-physics', { author: 'Khan Academy', minutes: 90 }),
      R('Measurement error and uncertainty', 'docs', 'https://en.wikipedia.org/wiki/Observational_error', { minutes: 20 }),
    ],
    exercises: [
      X('measurement', 'Measure the same object five times with a ruler, record all five values, compute the mean and the range. Then state whether the spread you see is random or systematic, and how you would tell the difference.', 20, {
        solution: 'Compute mean and range. Random error shows as scatter around a stable mean; systematic error shows as a mean that differs from a known reference. To distinguish them you need a second instrument or a known standard - scatter alone cannot reveal a bias.',
      }),
      X('calculation', 'A multimeter reads 4.95 V for a supply that is truly 5.00 V. Compute absolute, relative and percentage error.', 8, { solution: 'absolute 0.05 V; relative 0.01; percent 1%.' }),
      X('question', 'Your distance sensor has a 0 offset of +3 cm (systematic) plus 1 cm of random noise. You average 16 readings. What is the resulting uncertainty, and what is still wrong?', 10, {
        solution: 'Random noise reduces to 1/sqrt(16) = 0.25 cm. The +3 cm systematic offset is completely unaffected by averaging - it must be removed by calibration (subtracting a measured offset).',
      }),
    ],
    questions: [
      mcq(1, 'A scale reads 1.200 kg, 1.201 kg, 1.199 kg for a true mass of 1.000 kg. It is:', ['Precise but not accurate', 'Accurate but not precise', 'Both accurate and precise', 'Neither'], 0, 'Readings cluster tightly (precise) but are all far from the true value (inaccurate) - a calibration offset.'),
      numeric(2, 'A sensor reads 12.4 cm for a true length of 12.0 cm. What is the percentage error?', 3.33, '(0.4/12.0)*100 = 3.33%.', { unit: '%' }),
      mcq(3, 'Averaging many samples reduces:', ['Random error only', 'Systematic error only', 'Both equally', 'Neither'], 0, 'Random scatter shrinks as 1/sqrt(N); a constant bias is unaffected no matter how many samples you take.'),
      numeric(3, 'Averaging 25 samples instead of 1 reduces random noise by what factor?', 5, 'sqrt(25) = 5.'),
      mcq(1, 'A 10-bit ADC with a 3.3 V reference resolves approximately:', ['3.2 mV', '33 mV', '0.33 mV', '320 mV'], 0, '3.3 / 1024 = 3.22 mV per step.'),
      mcq(2, 'Which of these is a systematic error?', ['Every reading is 0.5 V too high because the reference is miscalibrated', 'Readings jitter due to electrical noise', 'A reading is corrupted by a one-off voltage spike', 'Quantisation of the ADC'], 0, 'A consistent bias in one direction is systematic; jitter and spikes are random.'),
      mcq(3, 'Why can averaging be harmful when measuring a moving robot?', [
        'The quantity changes during the averaging window, so the result may never have been true at any instant',
        'Averaging uses too much memory',
        'Averaging increases noise',
        'It cannot be harmful',
      ], 0, 'Averaging assumes the quantity is stationary over the window. If it is not, you have introduced lag rather than reduced error.'),
    ],
    skills: ['phys-measurement'],
  }),

  lesson({
    id: 'phys-03',
    subject: 'physics',
    order: 3,
    title: 'Distance, Displacement, Speed and Velocity',
    difficulty: 'beginner',
    minutes: 35,
    prereqs: ['phys-01'],
    description: 'Scalar versus vector descriptions of motion, average and instantaneous values.',
    why: 'Odometry, path length, waypoints, dead reckoning - all of these depend on knowing the difference between how far something travelled and how far it ended up from where it started. Confusing them is how a robot that drove a loop reports progress it did not make.',
    objectives: [
      'Distinguish distance from displacement and speed from velocity',
      'Compute average speed and average velocity from a described path',
      'Explain what instantaneous velocity means and how a robot estimates it',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Path length is not position change',
        body: [
          'Distance is the total path travelled - a scalar, always non-negative. Displacement is the straight-line vector from start to finish, with a direction. Drive 100 m east then 100 m west and your distance is 200 m while your displacement is zero.',
          'Speed is distance over time. Velocity is displacement over time, so velocity can be negative or zero even when the robot has been moving the whole time.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Definitions',
        formula: 'average speed = total distance / total time      average velocity = displacement / total time      v = d / t',
        defines: [
          'Instantaneous velocity is the limit as the time interval goes to zero',
          'A robot estimates it by differencing encoder counts over a short window - which reintroduces the noise-versus-lag trade-off from measurement',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - a patrol loop',
        problem: 'A robot drives 12 m north in 6 s, then 5 m south in 5 s. Find total distance, displacement, average speed and average velocity.',
        solution: [
          'Distance = 12 + 5 = 17 m',
          'Displacement = 12 - 5 = 7 m north',
          'Total time = 11 s',
          'Average speed = 17 / 11 = 1.55 m/s',
          'Average velocity = 7 / 11 = 0.64 m/s north',
        ],
        answer: '17 m travelled, 7 m north displacement, 1.55 m/s speed, 0.64 m/s north velocity',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Units of velocity in code',
        body: [
          'Pick one convention and write it into your variable names: pos_m, vel_mps, dt_s. Encoder ticks per loop iteration is not a velocity until you divide by the actual elapsed time - and if your loop time jitters, dividing by a nominal 20 ms instead of the measured interval produces a velocity error that looks exactly like mechanical slip.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Motion in 1D', 'course', 'https://www.khanacademy.org/science/physics/one-dimensional-motion', { author: 'Khan Academy', minutes: 300 }),
      R('Physics Classroom: Distance and Displacement', 'article', 'https://www.physicsclassroom.com/class/descKin/Lesson-1/Distance-and-Displacement', { minutes: 20 }),
    ],
    exercises: [
      X('calculation', 'A robot travels 30 m in 12 s at constant speed. What is its speed in m/s and km/h?', 6, { solution: '2.5 m/s = 9 km/h.' }),
      X('calculation', 'A robot drives 8 m east, 6 m north, then 8 m west, in 20 s total. Compute distance, displacement magnitude and direction, average speed and average velocity magnitude.', 12, { solution: 'Distance 22 m. Displacement 6 m north. Average speed 1.1 m/s. Average velocity 0.3 m/s north.' }),
      X('question', 'Your wheel encoders report 1200 ticks in a loop you expect to take 100 ms at 20 ticks/ms nominal. The loop actually took 130 ms. What velocity error results from using the nominal time?', 12, {
        solution: 'Nominal: 1200/0.1 = 12000 ticks/s. Actual: 1200/0.13 = 9231 ticks/s. Using the nominal time overstates velocity by about 30%, which a controller would interpret as the robot moving far too fast and would brake hard - a classic source of jitter.',
      }),
    ],
    questions: [
      mcq(1, 'Which is a vector quantity?', ['Velocity', 'Speed', 'Distance', 'Time'], 0, 'Velocity has magnitude and direction; speed and distance have magnitude only.'),
      numeric(2, 'A robot covers 45 m in 9 s at constant speed. What is its speed in m/s?', 5, '45/9 = 5 m/s.', { unit: 'm/s' }),
      mcq(2, 'A robot drives 10 m forward then 10 m back. Its displacement is:', ['0 m', '20 m', '10 m', '-20 m'], 0, 'It ends where it started, so displacement is zero even though distance travelled is 20 m.'),
      numeric(2, 'In the previous scenario the trip took 8 s. What was the average SPEED in m/s?', 2.5, '20 m of path / 8 s = 2.5 m/s. Average velocity would be 0 m/s.'),
      mcq(3, 'Instantaneous velocity is best described as:', ['The velocity over an infinitesimally small time interval', 'The average velocity of the whole trip', 'The maximum velocity reached', 'The total distance divided by total time'], 0, 'It is the limit of displacement/time as the interval shrinks to zero.'),
      mcq(3, 'Why must encoder-based velocity use measured loop time rather than a nominal interval?', [
        'Loop jitter otherwise appears as a velocity error that the controller misreads as real motion',
        'Because encoders do not produce ticks',
        'Because nominal time is always wrong',
        'It does not matter',
      ], 0, 'Dividing by the wrong dt scales the velocity error directly, and the controller reacts to a phantom error.'),
    ],
    skills: ['phys-kinematics-basics'],
  }),

  lesson({
    id: 'phys-04',
    subject: 'physics',
    order: 4,
    title: 'Acceleration and the Equations of Motion',
    difficulty: 'beginner',
    minutes: 45,
    prereqs: ['phys-03'],
    description: 'Acceleration as the rate of change of velocity, and the four constant-acceleration (SUVAT) equations.',
    why: 'Acceleration determines force (F = ma), force determines motor torque and current, and current determines whether your driver board survives. Acceleration limits are also what make a robot\'s motion smooth instead of jerky - trajectory planning is entirely about shaping acceleration.',
    objectives: [
      'Define acceleration and compute it from a change in velocity over time',
      'Apply the constant-acceleration equations to solve for any one unknown',
      'Relate acceleration limits to motor torque and to motion smoothness',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'The SUVAT equations (constant acceleration only)',
        formula: 'v = u + at      s = ut + 0.5at^2      v^2 = u^2 + 2as      s = 0.5(u + v)t',
        defines: [
          's = displacement, u = initial velocity, v = final velocity, a = acceleration, t = time',
          'These require CONSTANT acceleration - which is exactly what a trapezoidal motion profile provides',
          'Deceleration is simply negative acceleration',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - stopping distance',
        problem: 'A robot moves at 2 m/s and can decelerate at 1.5 m/s^2. How far does it take to stop, and how long?',
        solution: [
          'Using v^2 = u^2 + 2as with v = 0, a = -1.5: 0 = 4 + 2(-1.5)s',
          '3s = 4, so s = 1.33 m',
          'Using v = u + at: 0 = 2 - 1.5t, so t = 1.33 s',
        ],
        answer: '1.33 m and 1.33 s',
      },
      {
        kind: 'example',
        heading: 'Worked example - acceleration to torque',
        problem: 'A 3 kg robot must accelerate at 0.8 m/s^2. What net force is required, and if the drive wheel radius is 0.03 m, what torque?',
        solution: [
          'F = m * a = 3 * 0.8 = 2.4 N',
          'Torque = F * r = 2.4 * 0.03 = 0.072 Nm = 72 mNm per drive wheel if two wheels share it, or 72 mNm total if one wheel drives',
          'Add rolling friction and any incline to this before selecting a motor - this is the net force, not the total',
        ],
        answer: '2.4 N net force; 72 mNm of torque at a 30 mm wheel',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Why jerk matters',
        body: [
          'Instantly switching acceleration from 0 to maximum is an infinite rate of change of acceleration (jerk), which excites mechanical resonance and makes structures ring. Real motion profiles ramp acceleration in and out - trapezoidal velocity profiles for most robots, S-curve profiles for precision machines. You will build this in the Control track.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Acceleration', 'course', 'https://www.khanacademy.org/science/physics/one-dimensional-motion', { author: 'Khan Academy', minutes: 240 }),
      R('Physics Classroom: Kinematic Equations', 'article', 'https://www.physicsclassroom.com/class/1DKin/Lesson-6/Kinematic-Equations', { minutes: 25 }),
    ],
    exercises: [
      X('calculation', 'A robot accelerates from rest at 0.5 m/s^2 for 6 s. Find final velocity and distance covered.', 8, { solution: 'v = 0 + 0.5*6 = 3 m/s. s = 0 + 0.5*0.5*36 = 9 m.' }),
      X('calculation', 'A robot at 4 m/s decelerates to rest over 10 m. What deceleration and time?', 10, { solution: 'v^2 = u^2 + 2as -> 0 = 16 + 2a*10 -> a = -0.8 m/s^2. t = (0-4)/(-0.8) = 5 s.' }),
      X('calculation', 'A 5 kg robot needs to accelerate at 1.2 m/s^2 up a slope where friction opposes with 4 N. What total force and wheel torque (radius 0.04 m) are needed?', 12, { solution: 'F_net = 5*1.2 = 6 N, plus 4 N friction = 10 N total. Torque = 10 * 0.04 = 0.4 Nm.' }),
    ],
    questions: [
      mcq(1, 'Acceleration is defined as:', ['The rate of change of velocity', 'The rate of change of position', 'Velocity times time', 'Force divided by mass times velocity'], 0, 'a = (v - u)/t, with units m/s^2.'),
      numeric(1, 'A robot goes from 0 to 3 m/s in 6 s. What is its acceleration in m/s^2?', 0.5, '3/6 = 0.5 m/s^2.', { unit: 'm/s^2' }),
      numeric(2, 'Starting from rest at a = 2 m/s^2, how far does it travel in 4 s?', 16, 's = 0.5*a*t^2 = 0.5*2*16 = 16 m.', { unit: 'm' }),
      numeric(2, 'A robot at 5 m/s decelerates at 2 m/s^2. How many seconds to stop?', 2.5, 't = (0-5)/(-2) = 2.5 s.', { unit: 's' }),
      numeric(2, 'Using v^2 = u^2 + 2as, find the stopping distance from 3 m/s at a = -1 m/s^2.', 4.5, '0 = 9 - 2s, so s = 4.5 m.', { unit: 'm' }),
      mcq(3, 'A 4 kg robot must accelerate at 1 m/s^2 against 3 N of friction. The required drive force is:', ['7 N', '4 N', '3 N', '12 N'], 0, 'F = ma = 4 N net, plus 3 N to overcome friction = 7 N total.'),
      mcq(3, 'Why do motion profiles ramp acceleration instead of stepping it?', [
        'To limit jerk, which otherwise excites mechanical resonance and causes ringing',
        'To save battery',
        'Because motors cannot change speed',
        'To reduce encoder noise',
      ], 0, 'An instantaneous acceleration step is infinite jerk. Structures respond by oscillating at their natural frequency.'),
    ],
    skills: ['phys-acceleration'],
  }),

  lesson({
    id: 'phys-05',
    subject: 'physics',
    order: 5,
    title: 'Graphs of Motion',
    difficulty: 'beginner',
    minutes: 30,
    prereqs: ['phys-04', 'math-11'],
    description: 'Reading displacement-time, velocity-time and acceleration-time graphs, including slope and area meanings.',
    why: 'When you log a robot\'s motion you get graphs. The slope of a velocity-time graph is acceleration and its area is displacement - so a single plot tells you three different physical quantities. Being able to read these is the difference between debugging a motion problem in minutes and guessing for days.',
    objectives: [
      'Interpret slope and area on displacement-time and velocity-time graphs',
      'Sketch the velocity and acceleration graphs corresponding to a described motion',
      'Extract numerical values from a motion graph, including from a trapezoidal profile',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'What slope and area mean',
        columns: ['Graph', 'Slope gives', 'Area under curve gives'],
        rows: [
          ['Displacement vs time', 'Velocity', '(no direct physical meaning)'],
          ['Velocity vs time', 'Acceleration', 'Displacement'],
          ['Acceleration vs time', 'Jerk', 'Change in velocity'],
          ['Force vs displacement', '-', 'Work done'],
        ],
      },
      {
        kind: 'text',
        heading: 'The trapezoidal velocity profile',
        body: [
          'Most robot motion looks like a trapezoid on a velocity-time graph: ramp up at constant acceleration, cruise at constant velocity, ramp down at constant deceleration. The acceleration graph for it is a square pulse: +a, then 0, then -a.',
          'The area of that trapezoid is the total distance travelled, and it decomposes into two triangles and a rectangle - which is how you size a move given limits on speed and acceleration.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - distance from a velocity graph',
        problem: 'A robot accelerates uniformly from 0 to 2 m/s in 2 s, holds 2 m/s for 5 s, then decelerates to 0 in 2 s. What is the total distance?',
        solution: [
          'Ramp up: triangle area = 0.5 * 2 * 2 = 2 m',
          'Cruise: rectangle area = 2 * 5 = 10 m',
          'Ramp down: triangle area = 0.5 * 2 * 2 = 2 m',
          'Total: 2 + 10 + 2 = 14 m',
        ],
        answer: '14 m',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Flat sections are information',
        body: [
          'A flat (zero-slope) section on a velocity-time graph means constant speed, not a stopped robot. A flat section on a displacement-time graph means the robot is stationary. Reading the wrong graph is the most common interpretation error, so always check which quantity is on the vertical axis before you conclude anything.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Motion graphs', 'article', 'https://www.khanacademy.org/science/physics/one-dimensional-motion', { author: 'Khan Academy', minutes: 120 }),
      R('Physics Classroom: Representing Acceleration with Graphs', 'article', 'https://www.physicsclassroom.com/class/1DKin/Lesson-4/Representing-Acceleration-with-Graphs', { minutes: 20 }),
    ],
    exercises: [
      X('question', 'Sketch (on paper) the displacement-time, velocity-time and acceleration-time graphs for a robot that: waits 2 s, moves at 1 m/s for 4 s, then stops instantly. State what is physically wrong with the last part.', 15, {
        solution: 'Displacement: flat, then a straight line of slope 1, then flat. Velocity: 0, then 1, then 0 - a square pulse. Acceleration: zero everywhere except at the transitions, where it would be infinite. Instantaneous stopping requires infinite deceleration and therefore infinite force, which no real motor can deliver.',
      }),
      X('calculation', 'From a velocity-time graph: 0 to 1.5 m/s in 3 s, cruise 4 s, decelerate to 0 in 3 s. Compute total distance and the acceleration magnitude in each ramp.', 12, {
        solution: 'Acceleration = 1.5/3 = 0.5 m/s^2 (and -0.5 m/s^2 decelerating). Distance = 0.5*3*1.5 + 1.5*4 + 0.5*3*1.5 = 2.25 + 6 + 2.25 = 10.5 m.',
      }),
    ],
    questions: [
      mcq(1, 'The slope of a displacement-time graph represents:', ['Velocity', 'Acceleration', 'Distance', 'Force'], 0, 'Change in displacement over change in time is velocity.'),
      mcq(1, 'The area under a velocity-time graph represents:', ['Displacement', 'Acceleration', 'Speed', 'Jerk'], 0, 'Integrating velocity over time gives displacement.'),
      mcq(2, 'A horizontal line on a velocity-time graph means:', ['Constant velocity', 'Zero velocity', 'Constant acceleration', 'The object is stationary'], 0, 'Velocity is unchanging but not necessarily zero. A stationary object would show a horizontal line at v = 0.'),
      numeric(2, 'A robot holds 2 m/s for 6 s. How far does it travel?', 12, 'Area = 2 * 6 = 12 m.', { unit: 'm' }),
      numeric(2, 'A velocity graph is a triangle: 0 to 3 m/s in 4 s, back to 0 in 4 s. What is the total distance?', 12, 'Area = 0.5 * base 8 * height 3 = 12 m.', { unit: 'm' }),
      mcq(3, 'On a trapezoidal velocity profile, the acceleration graph looks like:', ['A positive pulse, then zero, then a negative pulse', 'A triangle', 'A constant positive value', 'Zero everywhere'], 0, 'Constant positive acceleration, then none, then constant negative.'),
      mcq(3, 'Why is an instant stop physically impossible?', ['It requires infinite deceleration and therefore infinite force', 'Because friction prevents it', 'Because motors cannot reverse', 'It is possible with good motors'], 0, 'a = dv/dt with dt = 0 is infinite, and F = ma would be infinite.'),
    ],
    skills: ['phys-motion-graphs'],
  }),

  lesson({
    id: 'phys-06',
    subject: 'physics',
    order: 6,
    title: 'Forces and Free-Body Diagrams',
    difficulty: 'beginner',
    minutes: 40,
    prereqs: ['phys-03', 'math-16'],
    description: 'Types of force, vector addition of forces, resultant force, and drawing free-body diagrams.',
    why: 'A free-body diagram is the first step of every mechanical calculation in this roadmap: sizing a motor, checking a bracket, predicting whether a robot tips over. If you cannot draw the forces, you cannot solve for them - and guessing produces parts that break.',
    objectives: [
      'Identify the forces acting on a body: weight, normal, friction, tension, applied, drag',
      'Draw a correct free-body diagram for a simple situation',
      'Compute a resultant force from components and state its direction',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A free-body diagram shows one body and every force on it',
        body: [
          'Isolate the body. Draw it as a box or a dot. Draw every external force as an arrow starting at the body, pointing in the direction the force acts, labelled with its type and magnitude. Do not draw forces the body exerts on other things - only forces on it.',
          'The usual suspects: weight (down, through the centre of mass), normal reaction (perpendicular to the contact surface, away from it), friction (parallel to the contact surface, opposing relative motion), tension (along a cable or link, pulling), applied force, and drag (opposing motion through a fluid).',
        ],
      },
      {
        kind: 'formula',
        heading: 'Resultant force',
        formula: 'F_resultant = sum of all force vectors      Fx = sum of x-components, Fy = sum of y-components      |F| = sqrt(Fx^2 + Fy^2)',
        defines: [
          'If the resultant is zero the body is in equilibrium: either at rest or moving at constant velocity',
          'If the resultant is non-zero, a = F/m in the direction of the resultant',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - robot on a slope',
        problem: 'A 4 kg robot sits on a 20 degree slope. Resolve its weight into components parallel and perpendicular to the slope (g = 9.81).',
        solution: [
          'Weight W = 4 * 9.81 = 39.24 N, acting vertically down',
          'Parallel to slope: W sin(20) = 39.24 * 0.342 = 13.42 N (pulls it downhill)',
          'Perpendicular to slope: W cos(20) = 39.24 * 0.940 = 36.88 N (this sets the normal force and therefore friction)',
        ],
        answer: '13.4 N downhill, 36.9 N into the slope',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'The normal force is not always mg',
        body: [
          'On flat ground the normal force equals the weight. On a slope it equals mg cos(theta), which is smaller. Under downward aerodynamic load or an arm pushing down, it is larger. Friction depends on the normal force, so assuming N = mg on a slope overestimates available traction - and that is exactly how a robot slips on a ramp it was designed to climb.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Forces and Newton\u2019s laws', 'course', 'https://www.khanacademy.org/science/physics/forces-newtons-laws', { author: 'Khan Academy', minutes: 360 }),
      R('Physics Classroom: Free-Body Diagrams', 'article', 'https://www.physicsclassroom.com/class/newtlaws/Lesson-2/Free-Body-Diagrams', { minutes: 25, note: 'The best free introduction to drawing these correctly.' }),
    ],
    exercises: [
      X('question', 'Draw a free-body diagram for a robot being pulled by a rope at 30 degrees above horizontal across a rough floor at constant velocity. Label every force and state which pairs must be equal in magnitude.', 15, {
        solution: 'Forces: weight down, normal up, tension along the rope at 30 degrees, friction opposing motion horizontally. Constant velocity means equilibrium: horizontal components sum to zero (T cos30 = friction) and vertical components sum to zero (N + T sin30 = W, so N is LESS than W here).',
      }),
      X('calculation', 'A 6 kg robot on a 15 degree slope: compute weight, the parallel component and the perpendicular component (g = 9.81).', 10, { solution: 'W = 58.86 N. Parallel = 58.86*sin15 = 15.23 N. Perpendicular = 58.86*cos15 = 56.85 N.' }),
      X('calculation', 'Two forces act on a point: 8 N east and 6 N north. Find the resultant magnitude and its direction as a bearing from east.', 10, { solution: 'sqrt(64+36) = 10 N. Direction = atan2(6,8) = 36.87 degrees north of east.' }),
    ],
    questions: [
      mcq(1, 'A free-body diagram shows:', ['All forces acting ON the body', 'All forces the body exerts on others', 'Both of the above', 'Only the resultant force'], 0, 'Only external forces applied to the isolated body appear.'),
      mcq(1, 'The normal force on a body resting on a horizontal surface acts:', ['Perpendicular to the surface, away from it', 'Parallel to the surface', 'Vertically downward', 'Toward the surface'], 0, 'Normal means perpendicular. It pushes the body away from the contact surface.'),
      numeric(3, 'Forces of 8 N east and 6 N north act on a point. What is the resultant magnitude in N?', 10, 'sqrt(64 + 36) = 10 N.', { unit: 'N' }),
      mcq(3, 'The resultant of two equal forces in opposite directions is:', ['Zero', 'Twice one force', 'The same as one force', 'Undefined'], 0, 'They cancel exactly - vector addition, not scalar addition.'),
      mcq(2, 'A 4 kg robot on a 20 degree slope: the component of weight pulling it downhill is:', ['mg sin(20)', 'mg cos(20)', 'mg / sin(20)', 'mg tan(20)'], 0, 'The slope-parallel component uses sine of the slope angle.'),
      mcq(2, 'Why is the normal force on a slope less than the weight?', [
        'Only the cosine component of weight presses into the slope; the rest pulls along it',
        'Because gravity is weaker on slopes',
        'Because the robot is lighter on a slope',
        'It is not less; they are always equal',
      ], 0, 'N = mg cos(theta). Assuming N = mg overestimates friction and therefore traction.'),
    ],
    skills: ['phys-forces'],
  }),

  lesson({
    id: 'phys-07',
    subject: 'physics',
    order: 7,
    title: 'Newton\u2019s Laws of Motion',
    difficulty: 'beginner',
    minutes: 45,
    prereqs: ['phys-06'],
    description: 'Inertia, F = ma, and action-reaction - plus what each law means for a real robot.',
    why: 'These three laws are the operating system of mechanics. Every motor sizing calculation is the second law. Every explanation of why a light robot is easier to control is the first and second. Every reason a legged robot must push down on the ground to move forward is the third.',
    objectives: [
      'State all three laws and identify which one applies in a given situation',
      'Use F = ma to solve for force, mass or acceleration, including rearranging it',
      'Explain inertia and action-reaction in terms of a robot\'s actual behaviour',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'The three laws',
        body: [
          'First law (inertia): a body stays at rest or in uniform motion unless acted on by a net external force. This is why a heavy robot is hard to start and hard to stop, and why stopping distance grows with mass.',
          'Second law: the net force on a body equals its mass times its acceleration, F = ma, in the direction of the net force. This is the equation you will use most often in all of robotics.',
          'Third law: for every action there is an equal and opposite reaction, acting on a DIFFERENT body. A walking robot pushes the ground backward; the ground pushes the robot forward. Without that reaction - on ice, or in the air - there is no locomotion.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Second law in the forms you need',
        formula: 'F = m a      a = F / m      m = F / a      sum(F) = m a (use the NET force)',
        defines: [
          '1 N = 1 kg m/s^2',
          'Weight is a special case: W = m g with g = 9.81 m/s^2',
          'For rotation the analogue is torque = moment of inertia * angular acceleration',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - can this motor move this robot?',
        problem: 'A robot has mass 2.5 kg. Each of two drive motors can produce 0.15 Nm of torque at a wheel radius of 0.032 m. Rolling friction opposes with 2 N total. What is the maximum acceleration on level ground?',
        solution: [
          'Total drive force = 2 * (torque / radius) = 2 * (0.15 / 0.032) = 2 * 4.69 = 9.38 N',
          'Net force = 9.38 - 2 = 7.38 N',
          'a = F / m = 7.38 / 2.5 = 2.95 m/s^2',
        ],
        answer: 'About 3.0 m/s^2 - comfortable for a small robot',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Equal and opposite does not mean cancelled',
        body: [
          'Action-reaction pairs never cancel each other out, because they act on different bodies. The robot pushes the ground (force on the ground) and the ground pushes the robot (force on the robot). Only the second one appears in the robot\'s free-body diagram. Confusing this is the single most common Newton\'s-third-law mistake.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Newton\u2019s laws', 'course', 'https://www.khanacademy.org/science/physics/forces-newtons-laws/laws-newton/v/newton-s-laws-of-motion', { author: 'Khan Academy', minutes: 300 }),
      R('Physics Classroom: Newton\u2019s Three Laws', 'article', 'https://www.physicsclassroom.com/class/newtlaws', { minutes: 45 }),
    ],
    exercises: [
      X('calculation', 'Compute the net force needed to accelerate: (a) 3 kg at 2 m/s^2  (b) 0.5 kg at 9.81 m/s^2  (c) 12 kg at 0.25 m/s^2', 8, { solution: '(a) 6 N  (b) 4.905 N (its own weight)  (c) 3 N' }),
      X('calculation', 'A 1.8 kg robot experiences 5 N of drive force and 1.4 N of friction. Find the acceleration. Then find how long it takes to reach 2 m/s from rest.', 12, { solution: 'F_net = 3.6 N, a = 3.6/1.8 = 2 m/s^2. t = v/a = 2/2 = 1 s.' }),
      X('question', 'A quadruped robot pushes backward on the ground with its foot. Use Newton\'s third law to explain how it moves forward, and explain what happens on a smooth wet tile floor.', 10, {
        solution: 'The foot exerts a backward force on the ground; the ground exerts an equal forward force on the foot, which accelerates the robot forward. On wet tile the available friction is far lower, so the foot slips backward before the reaction force can reach the value needed - the robot cannot accelerate and may not move at all. Locomotion is limited by friction, not by motor strength.',
      }),
    ],
    questions: [
      mcq(1, 'Newton\'s first law explains why:', ['A heavy robot resists changes to its motion', 'Force equals mass times acceleration', 'Every action has a reaction', 'Friction always opposes motion'], 0, 'Inertia: a body maintains its state of motion unless a net force acts.'),
      numeric(2, 'What net force accelerates 4 kg at 3 m/s^2?', 12, 'F = ma = 4 * 3 = 12 N.', { unit: 'N' }),
      numeric(2, 'A net force of 9 N acts on a 3 kg mass. What is the acceleration in m/s^2?', 3, 'a = F/m = 9/3 = 3.', { unit: 'm/s^2' }),
      mcq(2, 'F = ma requires which force?', ['The net (resultant) force', 'The largest single force', 'The applied force only', 'The weight'], 0, 'Sum every force first, then apply the resultant. Using only the drive force ignores friction and overestimates acceleration.'),
      mcq(3, 'A walking robot pushes the ground backward. What makes it move forward?', [
        'The ground pushes the robot forward with an equal force - a reaction acting on a different body',
        'Its own push on the ground',
        'Inertia',
        'The reduction of friction',
      ], 0, 'Third law: the reaction force acts on the robot. The action force acts on the ground, so the two never cancel on the robot.'),
      mcq(3, 'Why do action-reaction pairs not cancel?', ['They act on different bodies', 'They act in the same direction', 'One is always larger', 'They only exist in equilibrium'], 0, 'Forces only cancel when they act on the same body.'),
      numeric(3, 'A 2 kg robot has 8 N of drive force and 2 N of friction. What is its acceleration?', 3, 'F_net = 6 N, a = 6/2 = 3 m/s^2.', { unit: 'm/s^2' }),
    ],
    skills: ['phys-newtons-laws'],
  }),

  lesson({
    id: 'phys-08',
    subject: 'physics',
    order: 8,
    title: 'Mass, Weight and Gravity',
    difficulty: 'beginner',
    minutes: 25,
    prereqs: ['phys-07'],
    description: 'The difference between mass and weight, gravitational field strength, and why mass distribution matters more than mass alone.',
    why: 'Weight is what your motors must hold up; mass is what they must accelerate. They are proportional on Earth but they are not the same quantity, and in robot design the distribution of mass (not just the total) decides whether a leg can lift itself.',
    objectives: [
      'Distinguish mass from weight and state their units',
      'Use W = mg to compute weight and to rearrange for mass',
      'Explain why mass distribution affects how hard a limb is to move',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Mass is intrinsic; weight is a force',
        body: [
          'Mass (kg) is the amount of matter and the measure of inertia - it never changes with location. Weight (N) is the gravitational force on that mass: W = mg. On the Moon g is about 1.62 m/s^2, so a 10 kg robot weighs 16.2 N there instead of 98.1 N, but it still has exactly the same inertia and takes the same force to accelerate horizontally.',
          'This distinction matters practically: a robot that must be lifted needs motors sized against weight; a robot that must be accelerated needs motors sized against mass. On a horizontal plane, only mass matters.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Weight',
        formula: 'W = m g      g = 9.81 m/s^2 on Earth (use 9.81, not 10, once you are past estimation)',
        defines: ['m = W / g', 'Weight acts through the centre of mass', 'Moment of inertia depends on how mass is distributed relative to the rotation axis'],
      },
      {
        kind: 'example',
        heading: 'Worked example - why motors go at the base',
        problem: 'A robot arm link has mass 0.4 kg. Compare the effort to rotate it when the mass is concentrated at the joint versus 0.3 m away from the joint.',
        solution: [
          'Moment of inertia for a point mass: I = m r^2',
          'Mass at the joint: r = 0, so I = 0 - almost no effort to rotate',
          'Mass 0.3 m away: I = 0.4 * 0.09 = 0.036 kg m^2',
          'The same mass is now vastly harder to accelerate angularly, and the motor must also hold its weight at the end of a lever arm',
        ],
        answer: 'Moving mass away from the joint increases rotational inertia as r^2 - which is why arm designs put heavy motors near the base',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'A practical design rule',
        body: [
          'Every gram at the end of an arm costs several grams of motor and structure to move. This is why humanoid legs put the knee motor at the hip with a linkage or belt drive, and why racing drones use tiny motors with stiff short arms. Mass distribution is a first-order design decision, not an optimisation.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Mass and weight', 'video', 'https://www.khanacademy.org/science/physics/forces-newtons-laws', { author: 'Khan Academy', minutes: 60 }),
      R('Mass versus weight', 'article', 'https://en.wikipedia.org/wiki/Mass_versus_weight', { minutes: 15 }),
    ],
    exercises: [
      X('calculation', 'Compute the weight on Earth (g = 9.81) of: (a) 0.5 kg  (b) 2.2 kg  (c) 45 kg. Then compute the 45 kg mass\'s weight on the Moon (g = 1.62).', 10, { solution: '(a) 4.905 N  (b) 21.58 N  (c) 441.45 N; on the Moon 72.9 N.' }),
      X('question', 'A robot arm segment weighs 3.924 N. What is its mass? If you move that mass from 0.05 m to 0.25 m from the joint, by what factor does the rotational inertia increase?', 10, { solution: 'm = W/g = 3.924/9.81 = 0.4 kg. Inertia scales with r^2: (0.25/0.05)^2 = 25 times harder to rotate.' }),
    ],
    questions: [
      mcq(1, 'The unit of weight is the:', ['newton', 'kilogram', 'joule', 'pascal'], 0, 'Weight is a force. Mass is measured in kilograms.'),
      numeric(2, 'What is the weight of a 3 kg robot on Earth (g = 9.81)?', 29.43, 'W = 3 * 9.81 = 29.43 N.', { unit: 'N' }),
      numeric(2, 'A part weighs 19.62 N on Earth. What is its mass in kg?', 2, 'm = W/g = 19.62/9.81 = 2 kg.', { unit: 'kg' }),
      mcq(3, 'On the Moon a 10 kg robot has:', ['The same mass, less weight', 'Less mass, less weight', 'The same weight, less mass', 'Less mass, the same weight'], 0, 'Mass is intrinsic. Weight depends on g, which is about one sixth of Earth\'s.'),
      mcq(3, 'Why do robot arm designs put heavy motors near the base?', [
        'Rotational inertia grows with the square of distance from the joint, so distal mass is far more expensive to move',
        'Because wires are shorter',
        'Because it looks better',
        'It makes no difference',
      ], 0, 'I = m r^2 for a point mass. Halving r quarters the inertia.'),
      mcq(1, 'A robot accelerates horizontally on a level floor. Which property resists that acceleration?', ['Mass', 'Weight', 'Volume', 'Friction'], 0, 'Inertia depends on mass alone, independent of gravity.'),
    ],
    skills: ['phys-mass-weight'],
  }),

  lesson({
    id: 'phys-09',
    subject: 'physics',
    order: 9,
    title: 'Friction and Traction',
    difficulty: 'beginner',
    minutes: 35,
    prereqs: ['phys-07'],
    description: 'Static and kinetic friction, the friction coefficient, and how much traction a robot actually has.',
    why: 'Traction is the hard ceiling on a wheeled or legged robot\'s acceleration, braking and cornering. No amount of motor torque exceeds it - the wheels just spin. And friction is simultaneously your enemy in gears and bearings and your only friend in wheels and feet.',
    objectives: [
      'Distinguish static from kinetic friction and explain which is larger',
      'Use F_friction = mu * N to compute available friction and rearrange it',
      'Compute the maximum acceleration and braking a robot can achieve given a friction coefficient',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Friction does not depend on contact area',
        body: [
          'For dry friction, the maximum friction force is the coefficient times the normal force, and - counterintuitively - it does not depend on the apparent contact area. A wide tyre and a narrow tyre of the same load have similar dry friction limits. Wide tyres help for other reasons: heat, wear, deformation, and wet-surface behaviour.',
          'Static friction is what acts when surfaces are not sliding, and it is self-adjusting up to a maximum of mu_s * N. Kinetic friction acts during sliding and is roughly constant at mu_k * N, which is smaller. This is why wheels must not spin: the instant they slide you drop from the higher static limit to the lower kinetic one and lose both traction and steering.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Friction',
        formula: 'F_max = mu * N      a_max = mu * g (level ground, driven wheels not slipping)',
        defines: [
          'mu_s (static) is typically 0.15 to 0.3 for plastic on tile, 0.6 to 1.0 for rubber on dry concrete',
          'mu_k (kinetic) is usually 10-30% lower than mu_s',
          'On a slope, N = mg cos(theta), so available friction falls as the slope steepens',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - the real acceleration limit',
        problem: 'A 2 kg robot has motors capable of 30 N of drive force, on rubber wheels with mu_s = 0.8 on dry concrete. What is the actual maximum acceleration?',
        solution: [
          'Normal force N = m g = 2 * 9.81 = 19.62 N (assuming all wheels driven and level ground)',
          'Maximum friction = 0.8 * 19.62 = 15.70 N',
          'Motor capability (30 N) exceeds traction (15.7 N), so traction is the limit',
          'a_max = 15.70 / 2 = 7.85 m/s^2, equivalently mu * g = 0.8 * 9.81 = 7.85 m/s^2',
        ],
        answer: '7.85 m/s^2 - limited by grip, not by the motors',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Slip is a control problem, not a mechanical one',
        body: [
          'When a wheel slips, odometry derived from that wheel reports motion that did not happen, and the controller sees a large error it cannot close - so it commands more torque, which increases slip. This is a positive feedback loop. Real traction control limits commanded torque to the estimated friction budget, and fuses wheel odometry with an independent sensor such as an IMU or visual odometry.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Friction', 'video', 'https://www.khanacademy.org/science/physics/forces-newtons-laws/inclined-planes-friction/v/friction-force', { author: 'Khan Academy', minutes: 90 }),
      R('Physics Classroom: Coefficients of Friction', 'article', 'https://www.physicsclassroom.com/class/newtlaws/Lesson-3/Coefficients-of-Friction', { minutes: 20 }),
      R('Friction', 'docs', 'https://en.wikipedia.org/wiki/Friction', { minutes: 30 }),
    ],
    exercises: [
      X('calculation', 'A 5 kg box sits on level ground with mu_s = 0.4 and mu_k = 0.3. What horizontal force starts it moving, and what force keeps it moving at constant speed?', 10, { solution: 'N = 49.05 N. Start: 0.4 * 49.05 = 19.62 N. Keep moving: 0.3 * 49.05 = 14.72 N.' }),
      X('calculation', 'A robot with mu = 0.6 brakes on level ground from 3 m/s. Find maximum deceleration and stopping distance.', 12, { solution: 'a = mu*g = 5.886 m/s^2. d = v^2/(2a) = 9/11.77 = 0.765 m.' }),
      X('question', 'The same robot attempts the 3 m/s stop on wet tile with mu = 0.15. What is the new stopping distance, and what does this imply for sensor-based safety margins?', 10, { solution: 'a = 1.47 m/s^2, d = 9/2.94 = 3.06 m - four times longer. Safety margins must be computed for the worst surface the robot will encounter, not the surface you tested on.' }),
    ],
    questions: [
      mcq(1, 'Which friction coefficient is normally larger?', ['Static', 'Kinetic', 'They are equal', 'Depends on the area'], 0, 'It takes more force to start sliding than to keep sliding. Anti-lock brakes exist precisely to stay in the static regime.'),
      numeric(2, 'A 10 kg crate on level ground has mu = 0.5. What is the maximum friction force in N (g = 9.81)?', 49.05, 'N = 98.1 N, F = 0.5 * 98.1 = 49.05 N.', { unit: 'N' }),
      mcq(2, 'Doubling the contact area of a dry sliding block (same mass):', ['Does not change the maximum friction force', 'Doubles it', 'Halves it', 'Quadruples it'], 0, 'Dry friction depends on the normal force and mu, not on apparent contact area.'),
      numeric(3, 'A robot on level ground with mu_s = 0.7 has what maximum acceleration in m/s^2 (g = 9.81)?', 6.87, 'a_max = mu * g = 0.7 * 9.81 = 6.867.', { unit: 'm/s^2' }),
      mcq(3, 'A wheel that is spinning and sliding across the surface provides:', ['Less traction than a rolling wheel, because kinetic friction is lower than static', 'More traction', 'The same traction', 'Infinite traction'], 0, 'Sliding drops you into the kinetic regime and also destroys steering authority.'),
      mcq(3, 'On a slope, available friction decreases because:', ['The normal force is mg cos(theta), which is less than mg', 'Gravity is weaker on slopes', 'mu decreases with slope angle', 'Friction does not change on slopes'], 0, 'Less normal force means less friction, which is why climbing robots are traction-limited.'),
    ],
    skills: ['phys-friction'],
  }),

  lesson({
    id: 'phys-10',
    subject: 'physics',
    order: 10,
    title: 'Work and Energy',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['phys-07', 'math-10'],
    description: 'Work done by a force, kinetic and potential energy, conservation of energy and efficiency.',
    why: 'Energy is the currency that decides how long a robot runs and how hard it can hit something. Battery capacity in Wh, motor output in W, impact energy in J, and efficiency losses as heat - all one accounting system. Get this and you can size a battery from first principles instead of copying someone else\'s build.',
    objectives: [
      'Compute work done by a force and relate it to energy transferred',
      'Compute kinetic and gravitational potential energy and use conservation between them',
      'Apply efficiency to convert between electrical input and mechanical output',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'The energy equations',
        formula: 'W = F d cos(theta)      KE = 0.5 m v^2      PE = m g h      E_total(before) = E_total(after) + losses',
        defines: [
          'Work is only done by the component of force along the displacement',
          'A force perpendicular to motion does zero work',
          'Efficiency = useful output energy / input energy, always less than 1 in practice',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - falling robot',
        problem: 'A 5 kg humanoid falls, dropping its centre of mass by 0.8 m. How much energy must the structure absorb?',
        solution: [
          'PE lost = m g h = 5 * 9.81 * 0.8 = 39.24 J',
          'That energy becomes kinetic energy: 39.24 = 0.5 * 5 * v^2, so v = sqrt(2 * 9.81 * 0.8) = 3.96 m/s',
          'On impact all 39.24 J must go somewhere: deformation, heat, sound. Nothing absorbs it for free',
        ],
        answer: '39.2 J at about 4 m/s impact speed',
      },
      {
        kind: 'example',
        heading: 'Worked example - battery sizing',
        problem: 'A robot draws an average of 12 W mechanical plus 6 W of electronics, with a drivetrain efficiency of 70%. What battery capacity in Wh is needed for 45 minutes of runtime, allowing 20% headroom?',
        solution: [
          'Electrical power for the drivetrain = 12 / 0.70 = 17.1 W',
          'Total electrical power = 17.1 + 6 = 23.1 W',
          'Energy for 0.75 h = 23.1 * 0.75 = 17.4 Wh',
          'With 20% headroom: 17.4 * 1.2 = 20.8 Wh - so a 3S 2200 mAh pack (about 24 Wh) is the minimum sensible choice',
        ],
        answer: 'About 21 Wh usable, so a 24 Wh pack',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Never use the whole pack',
        body: [
          'Lithium packs lose voltage as they discharge and are damaged below their cutoff (about 3.3 V per LiPo cell under load). A pack rated 24 Wh delivers perhaps 80-85% of that in practice, and less at high discharge rates. Size batteries against usable energy, not label energy - and measure the real runtime once, because your estimate will be optimistic.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Work and energy', 'course', 'https://www.khanacademy.org/science/physics/work-and-energy', { author: 'Khan Academy', minutes: 360 }),
      R('Physics Classroom: Work-Energy Theorem', 'article', 'https://www.physicsclassroom.com/class/energy/Lesson-1/The-Work-Energy-Theorem', { minutes: 25 }),
    ],
    exercises: [
      X('calculation', 'Compute the work done: (a) 20 N over 3 m in the direction of motion  (b) 20 N at 60 degrees to a 3 m displacement  (c) 20 N perpendicular to a 3 m displacement', 10, { solution: '(a) 60 J  (b) 20*3*cos60 = 30 J  (c) 0 J' }),
      X('calculation', 'A 1.5 kg robot at 4 m/s: compute its kinetic energy. Then find the speed at which its KE doubles.', 12, { solution: 'KE = 0.5*1.5*16 = 12 J. Doubling needs v = 4*sqrt(2) = 5.66 m/s - energy scales with the square of speed.' }),
      X('question', 'Your robot needs 18 W of mechanical power with 65% drivetrain efficiency plus 5 W of control electronics. Size a battery for 30 minutes with 25% headroom, and express it as a 3S LiPo mAh rating (3S nominal = 11.1 V).', 15, { solution: 'Electrical for drive = 18/0.65 = 27.7 W; total 32.7 W. Energy = 32.7 * 0.5 = 16.35 Wh; with headroom 20.4 Wh. At 11.1 V that is 20.4/11.1 = 1.84 Ah, so a 3S 2000 mAh pack is marginal and 2200-2500 mAh is right.' }),
    ],
    questions: [
      mcq(1, 'Work is done when:', ['A force moves something along its line of action', 'A force is applied, regardless of motion', 'Energy is created', 'An object is stationary under load'], 0, 'W = F d cos(theta). Holding a weight still does no mechanical work, even though it feels like effort.'),
      numeric(1, 'A 15 N force pushes a robot 4 m in the direction of the force. How many joules of work are done?', 60, 'W = 15 * 4 = 60 J.', { unit: 'J' }),
      numeric(2, 'What is the kinetic energy of a 3 kg robot moving at 4 m/s?', 24, 'KE = 0.5 * 3 * 16 = 24 J.', { unit: 'J' }),
      numeric(2, 'A 2 kg part is lifted 1.5 m. How much potential energy does it gain (g = 9.81)?', 29.43, 'PE = 2 * 9.81 * 1.5 = 29.43 J.', { unit: 'J' }),
      mcq(2, 'A robot\'s speed doubles. Its kinetic energy:', ['Quadruples', 'Doubles', 'Stays the same', 'Halves'], 0, 'KE scales with v^2. This is why impact energy grows so fast and why fall protection matters.'),
      numeric(3, 'A 5 kg mass falls 0.8 m. How much energy must be absorbed on impact (g = 9.81)?', 39.24, 'PE = 5 * 9.81 * 0.8 = 39.24 J.', { unit: 'J' }),
      mcq(3, 'A drivetrain is 70% efficient and must deliver 14 W mechanically. Electrical input required is:', ['20 W', '9.8 W', '14 W', '28 W'], 0, '14 / 0.7 = 20 W. The 6 W difference becomes heat, which is a thermal design problem too.'),
    ],
    skills: ['phys-energy'],
  }),

  lesson({
    id: 'phys-11',
    subject: 'physics',
    order: 11,
    title: 'Power and Efficiency',
    difficulty: 'intermediate',
    minutes: 35,
    prereqs: ['phys-10'],
    description: 'Power as the rate of energy transfer, mechanical and electrical power, and efficiency chains.',
    why: 'Motors are specified in watts and torque-speed curves; batteries are specified in watts and amp-hours; drivers are specified in current. Power is the quantity that ties them together, and it is the number that decides whether your robot can climb the slope it needs to climb.',
    objectives: [
      'Compute mechanical power from force and velocity, and from torque and rotational speed',
      'Compute electrical power from voltage and current, and relate it to mechanical output via efficiency',
      'Chain efficiencies through a drivetrain and interpret a motor torque-speed curve',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Power equations',
        formula: 'P = E / t = W / t      P = F v      P = torque * omega (omega in rad/s)      P = V I',
        defines: [
          '1 W = 1 J/s',
          'omega = rpm * 2*pi / 60 = rpm / 9.549',
          'A gearbox reduces speed and multiplies torque, and (ideally) leaves power unchanged',
        ],
      },
      {
        kind: 'text',
        heading: 'Reading a motor torque-speed curve',
        body: [
          'A DC motor\'s curve is roughly a straight line from stall torque at zero speed to no-load speed at zero torque. Power output is torque times speed, so it peaks near the middle of the curve - typically at about half the no-load speed and half the stall torque.',
          'Maximum efficiency is usually well below maximum power, typically at 20-30% of stall torque. Running a motor near stall produces high current, low output, and a lot of heat; running it near no-load produces almost no useful work. This is why gearboxes exist: they move the operating point to a better part of the curve.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - climbing a slope',
        problem: 'A 6 kg robot climbs a 15 degree slope at a constant 0.4 m/s. Drivetrain efficiency is 60%. What electrical power is required (ignore friction, g = 9.81)?',
        solution: [
          'Force along the slope = m g sin(15) = 6 * 9.81 * 0.2588 = 15.23 N',
          'Mechanical power = F v = 15.23 * 0.4 = 6.09 W',
          'Electrical power = 6.09 / 0.60 = 10.15 W',
          'At a 3S pack (11.1 V nominal) that is about 0.91 A - well within a small driver\'s capability',
        ],
        answer: 'About 10.2 W electrical, roughly 0.9 A at 11.1 V',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Efficiencies multiply',
        body: [
          'Motor 80% x gearbox 90% x belt 95% = 68% overall. Two such stages in series give 46%. Every stage you add to a drivetrain costs you, and the loss appears as heat inside a sealed chassis. Count the stages before you design the mechanism, not after.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Power', 'video', 'https://www.khanacademy.org/science/physics/work-and-energy/work-and-power/v/what-is-power', { author: 'Khan Academy', minutes: 60 }),
      R('Motor torque-speed curves', 'article', 'https://learn.pi-bot.com/motor-basics/torque-speed-curve', { minutes: 20, note: 'If that page has moved, search "DC motor torque speed curve" - the concept is universal.' }),
      R('All About Circuits: Power', 'docs', 'https://www.allaboutcircuits.com/textbook/direct-current/chpt-2/', { author: 'All About Circuits', minutes: 40 }),
    ],
    exercises: [
      X('calculation', 'Compute power: (a) 50 J in 2 s  (b) 20 N pushing at 3 m/s  (c) 12 V at 1.5 A', 8, { solution: '(a) 25 W  (b) 60 W  (c) 18 W' }),
      X('calculation', 'A motor produces 0.2 Nm at 3000 rpm. Compute its mechanical power output in watts.', 12, { solution: 'omega = 3000 * 2*pi/60 = 314.16 rad/s. P = 0.2 * 314.16 = 62.8 W.' }),
      X('question', 'A drivetrain is motor 82% x gearbox 88% x chain 94%. The wheels need 40 W. What electrical input is required, and how much heat is generated inside the chassis?', 12, { solution: 'Overall efficiency = 0.82*0.88*0.94 = 0.678. Input = 40/0.678 = 59 W. Heat = 59 - 40 = 19 W, which must be removed or the electronics will overheat.' }),
    ],
    questions: [
      numeric(1, 'A motor does 240 J of work in 4 s. What is its power output in W?', 60, 'P = 240/4 = 60 W.', { unit: 'W' }),
      mcq(1, 'Mechanical power for a moving body equals:', ['Force times velocity', 'Force times distance', 'Mass times acceleration', 'Torque times angle'], 0, 'P = Fv. Force times distance is work, not power.'),
      numeric(2, 'A motor spins at 1000 rpm producing 0.1 Nm. What is its power output in W (2 dp)?', 10.47, 'omega = 1000*2*pi/60 = 104.72 rad/s. P = 0.1 * 104.72 = 10.47 W.', { unit: 'W' }),
      numeric(2, 'An electronics load draws 2.5 A from a 12 V supply. What is the electrical power in W?', 30, 'P = VI = 12 * 2.5 = 30 W.', { unit: 'W' }),
      mcq(3, 'On a DC motor torque-speed curve, maximum mechanical power occurs:', ['Near the middle, around half stall torque and half no-load speed', 'At stall', 'At no-load speed', 'At maximum efficiency'], 0, 'P = torque * speed; the product peaks near the midpoint of the roughly linear curve.'),
      mcq(3, 'Efficiencies of 80%, 90% and 95% in series give an overall efficiency of:', ['About 68%', 'About 265%', 'About 85%', 'About 95%'], 0, '0.8 * 0.9 * 0.95 = 0.684. Efficiencies multiply; they never add.'),
      mcq(2, 'A gearbox reduces output speed to one third. Ignoring losses, output torque is:', ['Three times the input torque', 'One third of the input torque', 'Unchanged', 'Nine times'], 0, 'Power is conserved, so reducing speed by 3 multiplies torque by 3.'),
    ],
    skills: ['phys-power'],
  }),

  lesson({
    id: 'phys-12',
    subject: 'physics',
    order: 12,
    title: 'Momentum and Impulse',
    difficulty: 'intermediate',
    minutes: 35,
    prereqs: ['phys-07'],
    description: 'Momentum, impulse as a change in momentum, and how impact force depends on stopping time.',
    why: 'This lesson is the physics of crashes - and therefore the physics of fall protection, compliant feet, bumpers and safe collision with people. The same change in momentum over a longer time means a much smaller force, which is the entire design principle behind padding and series elasticity.',
    objectives: [
      'Compute linear momentum and explain why it is a vector',
      'Relate impulse to change in momentum and compute average impact force from a stopping time',
      'Explain how extending impact duration reduces peak force, and apply that to robot design',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Momentum and impulse',
        formula: 'p = m v      impulse = F * dt = change in p = m(v_f - v_i)      F_avg = m * dv / dt',
        defines: [
          'Momentum has units kg m/s and is a vector',
          'Momentum is conserved in a closed system - the basis of collision analysis',
          'Peak force can far exceed the average force; the average is what this formula gives',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - why padding works',
        problem: 'A 4 kg robot\'s leg hits the ground at 3 m/s and stops. Compare the average force with a 5 ms rigid impact and a 100 ms compliant impact.',
        solution: [
          'Change in momentum = 4 * 3 = 12 kg m/s in both cases - that cannot be changed',
          'Rigid: F = 12 / 0.005 = 2400 N',
          'Compliant: F = 12 / 0.100 = 120 N',
          'Same momentum change, 20 times less force - purely from extending the time',
        ],
        answer: '2400 N versus 120 N. Compliance is force reduction by time extension.',
      },
      {
        kind: 'text',
        heading: 'Design consequences',
        body: [
          'This single result explains rubber feet, foam bumpers, spring-loaded ankles, series elastic actuators, and why humanoid robots deliberately use compliant joints. It also explains crash testing: you measure force over time and look at the peak, not the average.',
          'It equally explains why a heavy fast robot is dangerous around people. Momentum scales with both mass and velocity, so doubling either doubles the momentum that must be dissipated in an impact - and if the stopping distance is fixed by a human body, the force doubles too.',
        ],
      },
      {
        kind: 'callout',
        tone: 'safety',
        heading: 'Safety is a force budget',
        body: [
          'Collaborative robot safety standards are ultimately about limiting force and pressure on contact. The practical way to stay inside those limits is to reduce mass, reduce speed, add compliance, and add sensing that stops motion before contact. All four come from the equations in this lesson. The Systems Engineering track revisits this as formal risk analysis.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Momentum and impulse', 'course', 'https://www.khanacademy.org/science/physics/linear-momentum', { author: 'Khan Academy', minutes: 240 }),
      R('Physics Classroom: Momentum and Impulse Connection', 'article', 'https://www.physicsclassroom.com/class/momentum/Lesson-1/The-Impulse-Momentum-Change-Theorem', { minutes: 25 }),
    ],
    exercises: [
      X('calculation', 'Compute momentum: (a) 2 kg at 5 m/s  (b) 0.3 kg at 12 m/s  (c) 50 kg at 0.5 m/s. Which is hardest to stop?', 8, { solution: '(a) 10  (b) 3.6  (c) 25 kg m/s. The 50 kg mass at walking speed has the most momentum - slow and heavy beats fast and light.' }),
      X('calculation', 'A 3 kg robot travelling at 2 m/s stops in 0.02 s. Compute the average force. Then compute it if the stop takes 0.5 s.', 10, { solution: 'dp = 6 kg m/s. Rigid: 6/0.02 = 300 N. Compliant: 6/0.5 = 12 N.' }),
      X('question', 'You are designing feet for a 8 kg bipedal robot that will step down from 10 cm. Estimate the impact velocity, the momentum change, and the peak force for a 10 ms rigid landing. Then propose two design changes and quantify their effect.', 15, {
        solution: 'v = sqrt(2*9.81*0.1) = 1.4 m/s. dp = 8*1.4 = 11.2 kg m/s (one leg takes roughly half if it lands on one foot, so consider 11.2 for a single-foot landing). Rigid 10 ms: F = 1120 N. Adding a compliant pad extending the time to 60 ms gives 187 N - a 6x reduction. Reducing landing height to 2.5 cm gives v = 0.7 m/s, halving momentum and therefore force. Both changes together give about 93 N.',
      }),
    ],
    questions: [
      mcq(1, 'Momentum is:', ['Mass times velocity, a vector', 'Mass times speed, a scalar', 'Force times time', 'Mass times acceleration'], 0, 'p = mv with direction. Force times time is impulse, which equals the CHANGE in momentum.'),
      numeric(1, 'What is the momentum of a 6 kg robot moving at 2.5 m/s?', 15, 'p = 6 * 2.5 = 15 kg m/s.', { unit: 'kg m/s' }),
      mcq(2, 'Impulse is equal to:', ['The change in momentum', 'The momentum itself', 'Force times distance', 'Mass times velocity squared'], 0, 'F dt = m dv = change in momentum. This is the impulse-momentum theorem.'),
      numeric(2, 'A 2 kg object moving at 4 m/s stops in 0.1 s. What is the average force in N?', 80, 'dp = 8 kg m/s, F = 8/0.1 = 80 N.', { unit: 'N' }),
      numeric(3, 'The same stop takes 0.4 s instead. What is the average force now?', 20, 'F = 8/0.4 = 20 N - four times longer, four times smaller force.', { unit: 'N' }),
      mcq(3, 'Why do humanoid robots use compliant feet and ankles?', [
        'To extend impact duration and thereby reduce peak force for a fixed momentum change',
        'To look more human',
        'To increase impact force for better grip',
        'To reduce the robot\'s mass',
      ], 0, 'Compliance is a force-reduction strategy. It also stores and returns energy, improving efficiency.'),
      mcq(3, 'In a collision between two robots with no external forces, which quantity is conserved?', ['Total momentum', 'Total kinetic energy', 'Total speed', 'Total mass times area'], 0, 'Momentum is always conserved. Kinetic energy is only conserved in perfectly elastic collisions, which real robot impacts are not.'),
    ],
    skills: ['phys-momentum'],
  }),

  lesson({
    id: 'phys-13',
    subject: 'physics',
    order: 13,
    title: 'Torque, Rotation and Moments',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['phys-07', 'math-16'],
    description: 'Turning effects, moment arms, rotational equilibrium, angular motion and rotational inertia.',
    why: 'Robots are rotating machines. Every joint is a torque problem, every gearbox is a torque multiplier, and every structural failure in an arm starts as an underestimated moment. This is the lesson that connects motor datasheets to whether the arm can actually hold itself up.',
    objectives: [
      'Compute torque from a force and its perpendicular moment arm',
      'Apply the principle of moments to solve rotational equilibrium problems',
      'Relate angular acceleration to torque through rotational inertia, and convert rpm to rad/s',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Torque and rotation',
        formula: 'torque = F * r_perp      sum(clockwise moments) = sum(anticlockwise moments) in equilibrium      torque = I * alpha      omega = rpm * 2*pi/60',
        defines: [
          'r_perp is the perpendicular distance from the pivot to the line of action of the force',
          'I is the moment of inertia (kg m^2); alpha is angular acceleration (rad/s^2)',
          'For a point mass I = m r^2; for a uniform rod about its end I = (1/3) m L^2',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - can the servo hold the arm?',
        problem: 'A robot arm segment has mass 0.6 kg with its centre of mass 0.18 m from the shoulder joint, and it carries a 0.25 kg gripper at 0.32 m. Held horizontally, what torque must the shoulder servo provide (g = 9.81)?',
        solution: [
          'Arm moment = 0.6 * 9.81 * 0.18 = 1.059 Nm',
          'Gripper moment = 0.25 * 9.81 * 0.32 = 0.785 Nm',
          'Total static hold torque = 1.844 Nm',
          'A hobby servo rated "30 kg.cm" provides 30 * 9.81 * 0.01 = 2.94 Nm at stall - enough statically, but only with about 37% margin, and stall torque is not continuous torque',
        ],
        answer: '1.84 Nm static hold; a 2.94 Nm servo is marginal once you add acceleration and friction',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Stall torque is not working torque',
        body: [
          'Datasheet stall torque is measured at zero speed with a fresh battery at a specified voltage, for a short duration before overheating. Continuous torque is often one third to one half of that. Always size a joint for dynamic torque (static hold plus I*alpha plus friction) and check it against CONTINUOUS torque, then verify with a real measurement on your battery.',
        ],
      },
      {
        kind: 'text',
        heading: 'Mechanical advantage is a lever',
        body: [
          'A longer moment arm multiplies force into torque but requires more travel. Gears, pulleys, linkages and screws all do the same trade: force up, distance up, speed down. Nothing gets free torque - and the square-cube scaling problem in the Large Robotics track is this same trade applied to a machine bigger than a building.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Torque and rotational equilibrium', 'course', 'https://www.khanacademy.org/science/physics/torque-angular-momentum', { author: 'Khan Academy', minutes: 300 }),
      R('Physics Classroom: Rotational equilibrium', 'article', 'https://www.physicsclassroom.com/class/energy', { minutes: 20 }),
    ],
    exercises: [
      X('calculation', 'Compute torque: (a) 10 N at 0.2 m perpendicular  (b) 10 N at 0.2 m but 30 degrees from perpendicular  (c) 5 N at 0.5 m', 10, { solution: '(a) 2 Nm  (b) 10*0.2*sin(30)=1 Nm  (c) 2.5 Nm' }),
      X('calculation', 'A 1 m uniform beam of mass 4 kg is pivoted at one end. Where must a 2 kg mass hang to balance a 5 N upward force applied at the far end? Set up and solve the moment equation (g = 9.81).', 15, {
        solution: 'Beam weight 39.24 N acts at 0.5 m: clockwise 19.62 Nm. End force 5 N up at 1 m: anticlockwise 5 Nm. Remaining clockwise to balance = 14.62 Nm. A 2 kg mass weighs 19.62 N, so r = 14.62/19.62 = 0.745 m from the pivot - and that is inside the beam, so it is achievable.',
      }),
      X('calculation', 'A motor rated 0.05 Nm drives a joint with I = 0.002 kg m^2. What angular acceleration results, and how long to reach 10 rad/s ignoring friction?', 10, { solution: 'alpha = torque/I = 0.05/0.002 = 25 rad/s^2. t = 10/25 = 0.4 s.' }),
    ],
    questions: [
      numeric(1, 'A 25 N force acts perpendicular to a 0.12 m wrench. What is the torque in Nm?', 3, 'torque = 25 * 0.12 = 3 Nm.', { unit: 'Nm' }),
      mcq(1, 'Torque is maximised when the force is applied:', ['Perpendicular to the moment arm', 'Parallel to the moment arm', 'At 45 degrees', 'Through the pivot'], 0, 'torque = F r sin(theta), which peaks at theta = 90 degrees. A force through the pivot gives zero torque.'),
      mcq(2, 'In rotational equilibrium:', ['Clockwise moments equal anticlockwise moments', 'All forces are zero', 'The body must be stationary', 'Torque equals zero only at the pivot'], 0, 'The principle of moments. The body may still be rotating at constant speed.'),
      numeric(3, 'A joint has I = 0.004 kg m^2 and must reach alpha = 15 rad/s^2. What torque is needed in Nm?', 0.06, 'torque = I * alpha = 0.004 * 15 = 0.06 Nm.', { unit: 'Nm' }),
      numeric(3, 'Convert 1500 rpm to rad/s (1 dp).', 157.1, '1500 * 2*pi/60 = 157.08 rad/s.', { unit: 'rad/s' }),
      mcq(3, 'Why is a motor\'s datasheet stall torque a poor basis for sizing a joint?', [
        'It is a short-duration, zero-speed, specified-voltage figure; continuous working torque is much lower',
        'Stall torque is always overestimated by manufacturers',
        'Stall torque has different units',
        'It is the correct figure to use',
      ], 0, 'Continuous torque is limited by heating. Sizing on stall torque produces joints that overheat and brown out.'),
      mcq(2, 'Moving a motor from a joint to the base of an arm and driving it with a belt:', ['Reduces the rotational inertia the joint must accelerate', 'Increases torque at the joint', 'Reduces the arm\'s mass to zero', 'Has no effect on dynamics'], 0, 'The arm\'s mass is unchanged but distal mass - and therefore I about the joint - drops sharply.'),
    ],
    skills: ['phys-torque'],
  }),

  lesson({
    id: 'phys-14',
    subject: 'physics',
    order: 14,
    title: 'Centre of Mass and Stability',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['phys-13'],
    description: 'Locating the centre of mass, support polygons, static stability margin and tipping conditions.',
    why: 'This is the foundation of balance. A quadruped is statically stable when its centre of mass projects inside its support polygon; a biped is statically unstable almost always, which is why humanoids must balance dynamically. Everything in the Humanoid track rests on the concepts here.',
    objectives: [
      'Locate the centre of mass of a system of point masses and explain why it matters',
      'Define a support polygon and determine whether a configuration is statically stable',
      'Compute a static stability margin and the tipping condition for a robot on a slope',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'The centre of mass is where gravity effectively acts',
        body: [
          'For a set of point masses, the centre of mass coordinates are the mass-weighted averages of the positions. For symmetric uniform parts it is at the geometric centre. When you add a battery or a camera, you move it - and moving it changes stability, handling and required joint torque.',
          'Gravity acts on every particle, but the total effect is identical to the whole weight acting at the centre of mass. That is why every balance calculation reduces to tracking one point.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Centre of mass and stability margin',
        formula: 'x_cm = sum(m_i * x_i) / sum(m_i)      static stability margin = shortest distance from the CoM projection to the support polygon edge',
        defines: [
          'Statically stable: the vertical projection of the CoM lies inside the support polygon',
          'Support polygon: the convex hull of all ground contact points',
          'Tipping begins when the CoM projection reaches the polygon edge',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - CoM of a two-part robot',
        problem: 'A chassis of 3 kg has its CoM at x = 0, and a 1 kg arm mounted at x = 0.25 m. Where is the combined CoM, and what happens if the arm extends a 0.5 kg gripper to x = 0.6 m?',
        solution: [
          'Two parts: x_cm = (3*0 + 1*0.25) / 4 = 0.0625 m',
          'Three parts: x_cm = (3*0 + 1*0.25 + 0.5*0.6) / 4.5 = (0.25 + 0.30)/4.5 = 0.1222 m',
          'The CoM moved forward by 6 cm as the arm extended - enough to matter if the front wheels are only 15 cm ahead of the chassis CoM',
        ],
        answer: 'CoM moves from 6.25 cm to 12.2 cm forward of the chassis origin',
      },
      {
        kind: 'example',
        heading: 'Worked example - maximum slope before tipping',
        problem: 'A robot has a wheelbase of 0.3 m with its CoM 0.15 m behind the front axle and 0.2 m above ground. What slope angle tips it forward when braking?',
        solution: [
          'It tips when the CoM projection reaches the front contact patch',
          'The CoM is 0.15 m behind that point horizontally and 0.2 m above it',
          'Tipping angle = atan(0.15 / 0.2) = 36.87 degrees',
          'Hard braking shifts load forward well before that angle, so the practical limit is much lower',
        ],
        answer: 'About 37 degrees static; much less under braking',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Static versus dynamic stability',
        body: [
          'A quadruped can be statically stable at all times if it keeps three feet down - no computation required to stay upright. A biped cannot: with two feet its support polygon is tiny and a walking biped is statically unstable throughout most of its gait, so it must be balanced continuously by control. This single fact is why humanoids are dramatically harder than quadrupeds, and why the Humanoid track is marked as a research frontier.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Torque and centre of mass', 'course', 'https://www.khanacademy.org/science/physics/torque-angular-momentum', { author: 'Khan Academy', minutes: 180 }),
      R('Centre of mass', 'docs', 'https://en.wikipedia.org/wiki/Center_of_mass', { minutes: 25 }),
      R('Zero moment point', 'article', 'https://en.wikipedia.org/wiki/Zero_moment_point', { minutes: 20, note: 'Read this now as a preview; it is the core concept of bipedal balance and returns in the Humanoid track.' }),
    ],
    exercises: [
      X('calculation', 'Find the x-coordinate of the centre of mass: 2 kg at x = 0, 3 kg at x = 0.4 m, 1 kg at x = -0.2 m.', 8, { solution: 'x_cm = (0 + 1.2 - 0.2)/6 = 1.0/6 = 0.1667 m.' }),
      X('question', 'A quadruped has feet at (0.2, 0.15), (0.2, -0.15), (-0.2, 0.15), (-0.2, -0.15) metres. Its CoM projects to (0.12, 0.10). Is it statically stable? Compute the approximate stability margin.', 15, {
        solution: 'The support polygon is a rectangle from x = -0.2 to 0.2 and y = -0.15 to 0.15. The projection (0.12, 0.10) is inside, so it is statically stable. Margins: 0.2-0.12 = 0.08 m in x, 0.15-0.10 = 0.05 m in y. The limiting margin is 0.05 m, so it can tolerate about 5 cm of CoM shift before it becomes unstable.',
      }),
      X('calculation', 'A robot\'s CoM is 0.35 m above ground and 0.2 m inside from the outer track edge. What lateral acceleration (in m/s^2 and in g) causes it to tip in a turn?', 12, {
        solution: 'Tipping when the CoM projection reaches the edge: a/g = 0.2/0.35 = 0.571, so a = 0.571 * 9.81 = 5.6 m/s^2. A low, wide robot; raising the CoM to 0.7 m would halve that to 2.8 m/s^2.',
      }),
    ],
    questions: [
      mcq(1, 'The centre of mass of a system is:', ['The mass-weighted average position of all its parts', 'Its geometric centre, always', 'The position of the heaviest part', 'Where the robot is strongest'], 0, 'x_cm = sum(m_i x_i)/sum(m_i). It equals the geometric centre only for uniform symmetric bodies.'),
      numeric(1, 'Masses of 2 kg at x=1 and 3 kg at x=6: what is the centre of mass x?', 4, '(2*1 + 3*6)/5 = 20/5 = 4.'),
      mcq(2, 'A robot is statically stable when:', ['The vertical projection of its CoM lies inside its support polygon', 'It has four feet', 'Its CoM is as low as possible', 'It is not moving'], 0, 'That is the definition. Low CoM and wide stance increase the margin but are not the criterion.'),
      mcq(2, 'The support polygon of a biped standing on both flat feet is:', ['Small, so a walking biped is statically unstable most of the time', 'Large, so bipeds are very stable', 'Undefined', 'The same as a quadruped\'s'], 0, 'Two rectangular footprints give a narrow polygon, and during a step one foot is in the air, shrinking it further. This is the core difficulty of humanoid locomotion.'),
      mcq(3, 'A robot tips when:', ['Its CoM projection reaches the edge of the support polygon', 'Its speed exceeds 1 m/s', 'Its battery is low', 'Its CoM reaches ground level'], 0, 'Beyond that point gravity produces a moment that increases the tip rather than resisting it.'),
      numeric(3, 'CoM height 0.5 m, horizontal distance to the tipping edge 0.25 m. What is the tipping angle in degrees (1 dp)?', 26.6, 'atan(0.25/0.5) = 26.57 degrees.', { unit: 'deg' }),
      mcq(3, 'Raising a robot\'s centre of mass by moving the battery to the top of the chassis will:', ['Reduce the lateral acceleration it can take before tipping', 'Increase its stability', 'Have no effect on tipping', 'Reduce its mass'], 0, 'Tipping acceleration scales as (horizontal margin)/(CoM height). Higher CoM means less margin.'),
    ],
    skills: ['phys-centre-of-mass', 'phys-stability'],
  }),
];
