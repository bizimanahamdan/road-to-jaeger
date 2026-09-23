import { R, X, lesson, mcq, numeric } from './helpers';
import type { Lesson } from '@/lib/types';

/**
 * FOUNDATION / Advanced Mathematics.
 *
 * Deliberately placed AFTER the core maths and BEFORE control theory and
 * perception. Calculus is the language of rates of change (velocity, current,
 * error decay) and linear algebra is the language of rotations and transforms.
 * You cannot do PID properly without the first, or robot kinematics without
 * the second.
 */
export const MATH_ADVANCED_LESSONS: Lesson[] = [
  lesson({
    id: 'madv-01',
    subject: 'math-advanced',
    order: 1,
    title: 'Functions, Rates of Change and Limits',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['math-15', 'math-11'],
    description: 'Functions as machines, average versus instantaneous rate of change, and the limit idea that makes calculus possible.',
    why: 'Control theory is entirely about rates of change: how fast the error is shrinking, how fast the motor current is rising, how fast the robot is tilting. Without an intuitive grip on instantaneous rate of change, PID tuning is guesswork.',
    objectives: [
      'Evaluate and describe functions, including domain, range and composition',
      'Compute an average rate of change over an interval and explain what it represents',
      'Explain the limit concept and how shrinking an interval approaches an instantaneous rate',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A function maps an input to exactly one output',
        body: [
          'The domain is the set of valid inputs, the range the set of possible outputs. Domain restrictions are real engineering constraints, not formalities: asin only accepts [-1, 1], a square root only accepts non-negative values, and division excludes zero. A robot that feeds an out-of-domain value to a math function gets NaN, and NaN propagates silently through every subsequent calculation.',
          'Composition is applying one function to the output of another: (f o g)(x) = f(g(x)). Sensor pipelines are compositions - raw ADC counts, scaled to volts, mapped to distance, filtered, then converted to a position estimate.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Average rate of change',
        formula: 'average rate = (f(b) - f(a)) / (b - a)      instantaneous rate = limit as h -> 0 of (f(x+h) - f(x)) / h',
        defines: [
          'The average rate over an interval is the slope of the chord between the two points',
          'The instantaneous rate is the slope of the tangent at one point',
          'Shrinking h makes the chord approach the tangent - that is the whole idea of a derivative',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - approaching a derivative numerically',
        problem: 'For f(t) = t^2, estimate the instantaneous rate of change at t = 3 using h = 1, 0.1, 0.01, 0.001.',
        solution: [
          'h = 1: (16 - 9)/1 = 7',
          'h = 0.1: (9.61 - 9)/0.1 = 6.1',
          'h = 0.01: (9.0601 - 9)/0.01 = 6.01',
          'h = 0.001: (9.006001 - 9)/0.001 = 6.001',
          'The values converge on 6, which is exactly 2t at t = 3',
        ],
        answer: 'The instantaneous rate of change is 6',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Why you cannot just use a tiny h in code',
        body: [
          'Floating point has finite precision. Once h is very small, f(x+h) and f(x) are nearly identical and their difference loses significant digits - the numerical derivative becomes noise. This is why real controllers use a filtered difference over a sensible interval (typically one control tick) rather than an infinitesimal h, and why derivative filtering is a standard part of PID tuning.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Limits and continuity', 'course', 'https://www.khanacademy.org/math/ap-calculus-ab/ab-limits-new', { author: 'Khan Academy', minutes: 300 }),
      R('3Blue1Brown: The Essence of Calculus, chapter 1', 'video', 'https://www.3blue1brown.com/topics/calculus', { author: 'Grant Sanderson', minutes: 20, note: 'Watch chapter 1 before anything else. The intuition it builds is worth more than an hour of algebra.' }),
      R('Paul\u2019s Online Math Notes: Limits', 'docs', 'https://tutorial.math.lamar.edu/classes/calci/thelimitidea.aspx', { author: 'Paul Dawkins', minutes: 60 }),
    ],
    exercises: [
      X('calculation', 'For f(x) = x^2 - 4x + 1, compute the average rate of change over [0,2], [2,4] and [4,6]. Describe the pattern.', 12, { solution: '(1-1)/2 = 0; (1-(-3))/2 = 2; (9-1)/2 = 4. The rate increases by 4 each interval - consistent with a linear derivative 2x-4.' }),
      X('calculation', 'Estimate the instantaneous rate of change of f(t) = 1/t at t = 2 using h = 0.1 and h = 0.01.', 12, { solution: 'h=0.1: (1/2.1 - 1/2)/0.1 = (0.47619-0.5)/0.1 = -0.2381. h=0.01: (0.49751-0.5)/0.01 = -0.2488. Converging on -0.25 = -1/t^2.' }),
      X('code', 'Write a function `numeric_derivative(f, x, h)` and test it on f(x)=x^2 at x=5 for h = 1e-1, 1e-3, 1e-5, 1e-8, 1e-12. Report where the results stop improving and explain why.', 20, { solution: 'Should converge toward 10 down to about h = 1e-5, then degrade as floating-point cancellation dominates. This demonstrates the precision floor of numerical differentiation.' }),
    ],
    questions: [
      mcq(1, 'The domain of f(x) = sqrt(x - 3) is:', ['x >= 3', 'All real numbers', 'x > 0', 'x <= 3'], 0, 'The radicand must be non-negative, so x - 3 >= 0.'),
      mcq(1, 'A sensor pipeline applies scaling then filtering then mapping. This is:', ['Function composition', 'A domain error', 'An inverse function', 'A limit'], 0, '(f o g o h)(x) - each stage consumes the previous output.'),
      numeric(2, 'Average rate of change of f(x) = x^2 over [1, 4].', 5, '(16 - 1)/(4 - 1) = 15/3 = 5.'),
      mcq(2, 'Shrinking the interval in an average rate of change calculation produces:', ['An approach to the instantaneous rate at the point', 'A larger average', 'Always exactly zero', 'A less accurate result'], 0, 'The chord slope approaches the tangent slope as the interval shrinks to zero.'),
      numeric(3, 'Using h = 0.01, estimate the instantaneous rate of change of f(x) = x^2 at x = 4.', 8.01, '((4.01)^2 - 16)/0.01 = (16.0801-16)/0.01 = 8.01. The exact value is 8.'),
      mcq(3, 'Why does using an extremely small h in floating-point code eventually make a numerical derivative worse?', [
        'Subtracting nearly equal numbers loses significant digits, so the result becomes noise',
        'Because the function stops being differentiable',
        'Because h cannot be smaller than 1e-6',
        'It never gets worse',
      ], 0, 'Catastrophic cancellation. Real controllers use a sensible finite interval plus filtering.'),
    ],
    skills: ['math-calculus-limits'],
  }),

  lesson({
    id: 'madv-02',
    subject: 'math-advanced',
    order: 2,
    title: 'Derivatives: Rules and Physical Meaning',
    difficulty: 'intermediate',
    minutes: 50,
    prereqs: ['madv-01'],
    description: 'Differentiation rules, the derivative as a rate, and the specific derivatives used in control and dynamics.',
    why: 'Velocity is the derivative of position; acceleration is the derivative of velocity; the D term in PID is a derivative of error. Capacitor current is a derivative of voltage. Inductor voltage is a derivative of current. Derivatives are not an abstraction here - they are the quantities your code computes.',
    objectives: [
      'Differentiate polynomials, exponentials and trigonometric functions using standard rules',
      'Interpret a derivative physically as a rate of change with correct units',
      'Apply derivatives to the motion and control relationships used in robotics',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Derivatives you need',
        columns: ['f(x)', 'f\u2032(x)', 'Where it appears in robotics'],
        rows: [
          ['x^n', 'n x^(n-1)', 'Polynomial motion profiles'],
          ['sin(x)', 'cos(x)', 'Rotating joints, sinusoidal gaits'],
          ['cos(x)', '-sin(x)', 'Rotating joints'],
          ['e^(kx)', 'k e^(kx)', 'First-order system response, motor electrical time constant'],
          ['ln(x)', '1/x', 'Decibel scales, entropy'],
          ['1/x', '-1/x^2', 'Inverse-square effects'],
        ],
      },
      {
        kind: 'formula',
        heading: 'Rules',
        formula: '(af + bg)\' = af\' + bg\'      (fg)\' = f\'g + fg\'      (f/g)\' = (f\'g - fg\')/g^2      chain: (f(g(x)))\' = f\'(g(x)) * g\'(x)',
        defines: [
          'Linearity: the derivative of a sum is the sum of the derivatives',
          'Product rule: needed for torque = I * alpha when both vary',
          'Chain rule: needed for any composed relationship, e.g. position as a function of angle as a function of time',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - derivatives of a motion profile',
        problem: 'A joint follows s(t) = 0.5t^3 - 2t^2 + 4t (metres, seconds). Find velocity and acceleration, and the acceleration at t = 3 s.',
        solution: [
          'v(t) = ds/dt = 1.5t^2 - 4t + 4',
          'a(t) = dv/dt = 3t - 4',
          'At t = 3: a = 9 - 4 = 5 m/s^2, and v = 13.5 - 12 + 4 = 5.5 m/s',
        ],
        answer: 'v = 1.5t^2 - 4t + 4, a = 3t - 4; at t = 3, a = 5 m/s^2',
      },
      {
        kind: 'example',
        heading: 'Worked example - first-order response',
        problem: 'A motor\'s speed response to a step command is often modelled as omega(t) = omega_max (1 - e^(-t/tau)). Find d(omega)/dt at t = 0 and explain its significance.',
        solution: [
          'd(omega)/dt = omega_max * (1/tau) * e^(-t/tau)',
          'At t = 0: omega_max / tau - the fastest rate of change the motor achieves',
          'This initial slope determines peak current demand, since torque (and therefore current) is proportional to angular acceleration',
        ],
        answer: 'omega_max / tau at t = 0, which sets the peak current spike',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Units of a derivative',
        body: [
          'The units of df/dx are the units of f divided by the units of x. Position (m) differentiated with respect to time (s) gives m/s. That is not notation - it is a check. If your derivative has the wrong units, the differentiation was applied to the wrong variable.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Derivatives', 'course', 'https://www.khanacademy.org/math/differential-calculus', { author: 'Khan Academy', minutes: 600 }),
      R('3Blue1Brown: Essence of Calculus', 'video', 'https://www.3blue1brown.com/topics/calculus', { author: 'Grant Sanderson', minutes: 90, note: 'Chapters 2-4 cover the derivative rules visually.' }),
      R('Paul\u2019s Online Math Notes: Derivatives', 'docs', 'https://tutorial.math.lamar.edu/classes/calcI/derivativeintro.aspx', { author: 'Paul Dawkins', minutes: 120 }),
    ],
    exercises: [
      X('calculation', 'Differentiate: (a) 3x^4 - 2x  (b) sin(3t)  (c) e^(-2t)  (d) 5/t^2', 15, { solution: '(a) 12x^3 - 2  (b) 3cos(3t)  (c) -2e^(-2t)  (d) -10/t^3' }),
      X('calculation', 'A position profile is s(t) = 2t^2 + 3t. Find v(t), a(t), and the position, velocity and acceleration at t = 4 s.', 12, { solution: 'v = 4t + 3, a = 4. At t=4: s = 44 m, v = 19 m/s, a = 4 m/s^2.' }),
      X('code', 'Implement a PID derivative term as a filtered backward difference and demonstrate with a synthetic noisy position signal why the unfiltered difference is unusable.', 25, { solution: 'd = (e[k] - e[k-1])/dt, then d_filt = alpha*d_filt + (1-alpha)*d with alpha around 0.7-0.9. Without filtering, sensor noise at the sample rate is amplified by 1/dt and dominates the term.' }),
    ],
    questions: [
      mcq(1, 'The derivative of x^5 is:', ['5x^4', 'x^4', '5x^6', 'x^5/5'], 0, 'Power rule: bring the exponent down, subtract one from it.'),
      mcq(1, 'The derivative of sin(x) is:', ['cos(x)', '-cos(x)', '-sin(x)', 'tan(x)'], 0, 'And the derivative of cos(x) is -sin(x). With x in radians - which is why radians matter.'),
      mcq(2, 'The derivative of position with respect to time has units of:', ['m/s', 'm/s^2', 'm', 's/m'], 0, 'Units of f divided by units of x. Differentiating again gives m/s^2, acceleration.'),
      numeric(2, 'If s(t) = 3t^2 + t, what is v(4)?', 25, 'v = 6t + 1, so v(4) = 25.'),
      numeric(2, 'If v(t) = 6t + 1 from the previous question, what is the acceleration at any t?', 6, 'a = dv/dt = 6, constant.'),
      mcq(3, 'The derivative of e^(-t/tau) with respect to t is:', ['-(1/tau) e^(-t/tau)', '(1/tau) e^(-t/tau)', '-tau e^(-t/tau)', 'e^(-t/tau)/t'], 0, 'Chain rule with the inner function -t/tau, whose derivative is -1/tau.'),
      mcq(3, 'In a PID controller the D term is:', ['Proportional to the derivative of the error', 'Proportional to the integral of the error', 'Proportional to the error itself', 'The inverse of the error'], 0, 'D anticipates future error from its current rate of change - and amplifies noise, which is why it needs filtering.'),
    ],
    skills: ['math-derivatives'],
  }),

  lesson({
    id: 'madv-03',
    subject: 'math-advanced',
    order: 3,
    title: 'Integrals: Accumulation and Area',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['madv-02'],
    description: 'Integration as accumulation, area under a curve, and the definite integrals used in energy, motion and control.',
    why: 'Distance is the integral of velocity. Charge is the integral of current. Energy is the integral of power. The I term in PID is an integral of error. Every "total over time" quantity in robotics is an integral, and in code it is a running sum multiplied by dt.',
    objectives: [
      'Interpret a definite integral as accumulated quantity and as area under a curve',
      'Integrate polynomials and recognise integration as the inverse of differentiation',
      'Implement a discrete integral in code and explain its numerical error sources',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Integration',
        formula: 'integral of x^n dx = x^(n+1)/(n+1) + C      integral from a to b of f(x) dx = F(b) - F(a)      integral of v dt = displacement',
        defines: [
          'C is the constant of integration - the initial condition',
          'The definite integral is the signed area between the curve and the x axis',
          'Area below the axis counts as negative',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - distance from a velocity profile',
        problem: 'A robot\'s velocity is v(t) = 2t m/s for 0 <= t <= 3. Find the distance travelled using integration, and verify geometrically.',
        solution: [
          'Integral of 2t dt from 0 to 3 = [t^2] from 0 to 3 = 9 - 0 = 9 m',
          'Geometrically the velocity graph is a triangle with base 3 and height 6, area = 0.5*3*6 = 9 m',
          'Both methods agree, which is the fundamental theorem of calculus in action',
        ],
        answer: '9 m',
      },
      {
        kind: 'text',
        heading: 'The discrete integral your code actually runs',
        body: [
          'A controller cannot integrate continuously, so it accumulates: sum += value * dt each tick. That is a rectangle (Euler) approximation. Its error depends on how much the value changes within a tick - a slowly varying signal integrates accurately, a fast one does not.',
          'In a PID controller this accumulation is exactly the I term, and it brings the classic failure mode: integral windup. If the actuator saturates while the error persists, the integral keeps growing and then takes a long time to unwind, causing large overshoot on recovery. Every production controller implements anti-windup by clamping the integral or stopping accumulation while saturated.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Drift is the price of integrating a sensor',
        body: [
          'Integrating an accelerometer to get velocity, then again to get position, compounds its bias. A bias of just 0.01 m/s^2 becomes a position error of 0.5*t^2 - after 10 seconds that is 0.5 m, after 60 seconds it is 18 m. This is why inertial-only odometry fails and why real systems fuse it with wheel encoders, vision or GPS. Sensor fusion exists because integration drifts.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Integrals', 'course', 'https://www.khanacademy.org/math/integral-calculus', { author: 'Khan Academy', minutes: 480 }),
      R('3Blue1Brown: Integration and the fundamental theorem', 'video', 'https://www.3blue1brown.com/topics/calculus', { author: 'Grant Sanderson', minutes: 25 }),
      R('Integral windup', 'article', 'https://en.wikipedia.org/wiki/Integral_windup', { minutes: 15, note: 'Short and directly relevant to the Control track.' }),
    ],
    exercises: [
      X('calculation', 'Integrate: (a) 4x^3  (b) 2t + 5  (c) 6/t^2. Then evaluate (b) from t=0 to t=3.', 12, { solution: '(a) x^4 + C  (b) t^2 + 5t + C; from 0 to 3 gives 9+15 = 24  (c) -6/t + C' }),
      X('calculation', 'A current i(t) = 0.5t A flows for 4 s. How much charge is transferred? (Q = integral of i dt.)', 10, { solution: 'Q = 0.25t^2 from 0 to 4 = 0.25*16 = 4 coulombs.' }),
      X('code', 'Implement trapezoidal integration of a sampled velocity array with a fixed dt, and compare its result against the analytic integral for v(t) = 2t over 0 to 3 s at dt = 0.5, 0.1 and 0.01.', 20, { solution: 'Trapezoidal integration of a linear function is exact, so all three should return 9 m. Try v(t) = t^2 next and the error becomes visible and shrinks with dt - which demonstrates the order of the approximation.' }),
    ],
    questions: [
      mcq(1, 'The integral of x^3 dx is:', ['x^4/4 + C', '3x^2 + C', '4x^4 + C', 'x^4 + C'], 0, 'Add one to the exponent, divide by the new exponent, add the constant.'),
      mcq(1, 'The constant of integration C represents:', ['The initial condition', 'A rounding error', 'The slope', 'Zero, always'], 0, 'Differentiation destroys the constant; integration must restore it from a known starting value.'),
      numeric(2, 'Integral from 0 to 4 of 3t dt.', 24, '[1.5t^2] from 0 to 4 = 1.5*16 = 24.'),
      mcq(2, 'The area under a velocity-time graph between two times represents:', ['Displacement', 'Acceleration', 'Jerk', 'Force'], 0, 'Integration of velocity over time. This is the mirror image of slope giving acceleration.'),
      numeric(3, 'A constant power of 15 W is drawn for 60 s. How many joules are used?', 900, 'Energy = P * t = 15 * 60 = 900 J.', { unit: 'J' }),
      mcq(3, 'Integral windup in a PID controller occurs when:', [
        'The integral keeps accumulating while the actuator is saturated, causing large overshoot on recovery',
        'The proportional gain is too high',
        'The derivative term is unfiltered',
        'The setpoint changes too fast',
      ], 0, 'Fix by clamping the integral, back-calculating, or pausing accumulation while the output is saturated.'),
      mcq(3, 'Why does double-integrating an accelerometer produce useless position over time?', [
        'Any small bias integrates into velocity drift and then into quadratically growing position error',
        'Because accelerometers cannot measure gravity',
        'Because integration requires a GPU',
        'It does not; double integration is accurate',
      ], 0, 'Bias b gives position error 0.5*b*t^2. This is the fundamental reason for sensor fusion.'),
    ],
    skills: ['math-integration'],
  }),

  lesson({
    id: 'madv-04',
    subject: 'math-advanced',
    order: 4,
    title: 'Matrices and Linear Systems',
    difficulty: 'advanced',
    minutes: 50,
    prereqs: ['math-16'],
    description: 'Matrix arithmetic, solving simultaneous equations, determinants and inverses.',
    why: 'Robot state is a vector; transforms between frames are matrices. Forward kinematics is a chain of matrix multiplications, and inverse kinematics frequently requires inverting a Jacobian. State-space control is matrices all the way down. This is the entry ticket to the Robotics and Control tracks.',
    objectives: [
      'Add, scale and multiply matrices, and explain why matrix multiplication is not commutative',
      'Solve a 2x2 and 3x3 linear system by elimination and by matrix inversion',
      'Compute a determinant and explain what a zero or near-zero determinant means physically',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A matrix is a linear transformation',
        body: [
          'Multiplying a vector by a matrix produces a new vector - the original, transformed. Rotation, scaling, shearing and projection are all matrices. Composing two transformations is multiplying their matrices, and the order matters: rotate then translate is not the same as translate then rotate. That non-commutativity is exactly what makes robot arm kinematics interesting.',
          'Matrix multiplication takes rows of the first against columns of the second: element (i,j) of the product is the dot product of row i of A with column j of B. Shapes must be compatible: an (m x n) matrix times an (n x p) matrix gives (m x p).',
        ],
      },
      {
        kind: 'formula',
        heading: '2x2 determinant and inverse',
        formula: 'det([[a,b],[c,d]]) = ad - bc      inverse = 1/(ad-bc) * [[d,-b],[-c,a]]',
        defines: [
          'det = 0 means the matrix is singular: it collapses space and has no inverse',
          'A near-zero determinant means the system is ill-conditioned: small input changes cause huge output changes',
          'In robotics, that is a kinematic singularity - a configuration where the arm loses a degree of freedom',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - solving a linear system',
        problem: 'Solve: 2x + 3y = 13 and 4x - y = 5.',
        solution: [
          'Matrix form: [[2,3],[4,-1]] * [x,y] = [13,5]',
          'Determinant = 2*(-1) - 3*4 = -2 - 12 = -14 (non-zero, so a unique solution exists)',
          'Inverse = (1/-14) * [[-1,-3],[-4,2]]',
          '[x,y] = (1/-14) * [(-1)(13) + (-3)(5), (-4)(13) + (2)(5)] = (1/-14) * [-28, -42] = [2, 3]',
          'Check: 2(2) + 3(3) = 13 (correct); 4(2) - 3 = 5 (correct)',
        ],
        answer: 'x = 2, y = 3',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Singularities are physical, not numerical',
        body: [
          'A fully extended two-link arm cannot move its end effector radially outward - there is no joint motion that produces it. Mathematically the Jacobian determinant is zero; physically the arm has lost a degree of freedom; in code you get a division by a number near zero and a violent joint command. Real controllers detect near-singular configurations and either limit motion or add a damping term (damped least squares).',
        ],
      },
    ],
    resources: [
      R('3Blue1Brown: Essence of Linear Algebra', 'video', 'https://www.3blue1brown.com/topics/linear-algebra', { author: 'Grant Sanderson', minutes: 180, note: 'The definitive free visual introduction. Chapters 1-6 are the minimum.' }),
      R('Khan Academy: Matrices', 'course', 'https://www.khanacademy.org/math/precalculus/x9e81a4f98389efdf:matrices', { author: 'Khan Academy', minutes: 420 }),
      R('MIT OpenCourseWare 18.06: Linear Algebra', 'course', 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/', { author: 'Gilbert Strang', minutes: 2000, free: true, note: 'Free lecture videos and notes. The standard reference when you need depth.' }),
      R('Singular configuration', 'article', 'https://en.wikipedia.org/wiki/Jacobian_matrix_and_determinant', { minutes: 20 }),
    ],
    exercises: [
      X('calculation', 'Given A = [[1,2],[3,4]] and B = [[0,1],[1,0]], compute AB and BA. Are they equal? What does B do geometrically?', 15, { solution: 'AB = [[2,1],[4,3]], BA = [[3,4],[1,2]]. Not equal. B swaps the two components - a reflection across the line y=x.' }),
      X('calculation', 'Compute the determinant and inverse of [[3,1],[2,4]]. Verify that A * A^-1 = I.', 15, { solution: 'det = 12-2 = 10. Inverse = (1/10)[[4,-1],[-2,3]] = [[0.4,-0.1],[-0.2,0.3]]. Product gives [[1,0],[0,1]].' }),
      X('code', 'Write a function to solve a 2x2 linear system using matrix inversion, including a check that |det| exceeds a small threshold, and test it on a nearly singular system such as [[1,1],[1,1.0001]].', 20, { solution: 'The determinant is 1e-4, so the inverse has entries of order 1e4 - a tiny change in the right-hand side produces a huge change in the solution. The threshold check must reject or warn, not silently return garbage.' }),
    ],
    questions: [
      mcq(1, 'Multiplying a 2x3 matrix by a 3x2 matrix gives a matrix of shape:', ['2x2', '3x3', '2x3', 'Not defined'], 0, 'Inner dimensions match (3), outer dimensions give the result shape.'),
      mcq(1, 'Matrix multiplication is:', ['Not commutative in general', 'Commutative', 'Only defined for square matrices', 'The same as element-wise multiplication'], 0, 'AB != BA in general. This is why transform order matters in kinematics.'),
      numeric(2, 'Determinant of [[5,2],[3,4]].', 14, '5*4 - 2*3 = 20 - 6 = 14.'),
      mcq(2, 'A determinant of zero means:', ['The matrix has no inverse and collapses space to a lower dimension', 'The matrix is the identity', 'The solution is unique', 'The matrix must be symmetric'], 0, 'Singular. In robotics this corresponds to a configuration where a degree of freedom is lost.'),
      numeric(2, 'Solve 2x + y = 7 and x - y = 2. What is x?', 3, 'Add the equations: 3x = 9, x = 3 (and y = 1).'),
      mcq(3, 'A robot arm\'s Jacobian has a near-zero determinant. What is the practical risk?', [
        'Inverting it produces enormous joint velocities for a small end-effector move',
        'The arm becomes more accurate',
        'Nothing; it is a numerical detail',
        'The arm locks permanently',
      ], 0, 'Ill-conditioning near a singularity. Mitigated by damping (damped least squares) and by planning away from singular poses.'),
      mcq(3, 'Forward kinematics of a serial arm is computed by:', ['Multiplying the joint transform matrices in order from base to tool', 'Adding joint angles', 'Inverting the Jacobian', 'Solving a linear system for each joint'], 0, 'Each joint contributes a transform; the chain product gives the tool pose. Order matters because matrix multiplication is not commutative.'),
    ],
    skills: ['math-linear-algebra'],
  }),

  lesson({
    id: 'madv-05',
    subject: 'math-advanced',
    order: 5,
    title: 'Rotation Transforms and Homogeneous Coordinates',
    difficulty: 'advanced',
    minutes: 50,
    prereqs: ['madv-04', 'math-15'],
    description: '2D and 3D rotation matrices, translation, homogeneous transforms and Euler angle pitfalls.',
    why: 'This is the specific mathematics of robot kinematics. Every joint adds a rotation and a translation; combining them gives the tool pose. Understanding transforms here makes forward kinematics in the Robotics track a mechanical exercise rather than a mystery.',
    objectives: [
      'Construct and apply 2D rotation matrices, and explain why rotation order matters',
      'Build a homogeneous transform combining rotation and translation',
      'Chain transforms between frames and identify gimbal lock as a representation problem',
    ],
    learn: [
      {
        kind: 'formula',
        heading: '2D rotation',
        formula: 'R(a) = [[cos a, -sin a], [sin a, cos a]]      R(a) * R(b) = R(a + b)      R(a)^-1 = R(-a)',
        defines: [
          'Rotation matrices are orthonormal: their inverse equals their transpose',
          'A point p rotated by a about the origin becomes R(a) * p',
          'In 3D there are separate rotation matrices about x, y and z',
        ],
      },
      {
        kind: 'formula',
        heading: 'Homogeneous transform',
        formula: 'T = [[R, t], [0 0 0, 1]]   - a 4x4 matrix combining a 3x3 rotation R and a 3x1 translation t',
        defines: [
          'Points are written as [x, y, z, 1] so translation becomes matrix multiplication',
          'Vectors (directions) are written as [x, y, z, 0] so they are rotated but not translated',
          'T_ab * T_bc = T_ac: transforms compose, which is exactly how a kinematic chain works',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - one joint',
        problem: 'A planar arm has a shoulder at the origin with link length 0.3 m. Find the elbow position when the shoulder is at 30 degrees.',
        solution: [
          'T = R(30) applied to the local point (0.3, 0)',
          'x = 0.3 * cos(30) = 0.3 * 0.8660 = 0.2598 m',
          'y = 0.3 * sin(30) = 0.3 * 0.5 = 0.15 m',
          'Elbow at (0.260, 0.150) m - identical to the trigonometric approach, but this form extends directly to 3D and to multiple joints',
        ],
        answer: '(0.260, 0.150) m',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Euler angles and gimbal lock',
        body: [
          'Representing 3D orientation as three sequential angles (roll, pitch, yaw) is intuitive but breaks down: at certain configurations two axes align and one degree of freedom is lost, causing sudden large jumps in the reported angles. This is gimbal lock. Real systems represent orientation internally with quaternions or rotation matrices and only convert to Euler angles for human display. Never interpolate Euler angles - interpolate quaternions or use slerp.',
        ],
      },
      {
        kind: 'text',
        heading: 'Where this is used next',
        body: [
          'Forward kinematics: multiply the joint transforms to get the tool pose. Inverse kinematics: solve for joint angles given a desired pose. tf2 in ROS 2: a distributed tree of homogeneous transforms between every frame in the robot. Odometry: composing measured incremental transforms over time, with the drift you saw in the integration lesson.',
        ],
      },
    ],
    resources: [
      R('3Blue1Brown: Essence of Linear Algebra (chapters 3 and 13)', 'video', 'https://www.3blue1brown.com/topics/linear-algebra', { author: 'Grant Sanderson', minutes: 60 }),
      R('Rotation matrix', 'docs', 'https://en.wikipedia.org/wiki/Rotation_matrix', { minutes: 30 }),
      R('Gimbal lock', 'article', 'https://en.wikipedia.org/wiki/Gimbal_lock', { minutes: 20 }),
      R('Modern Robotics (Lynch and Park) - free PDF and videos', 'book', 'https://modernrobotics.northwestern.edu/', { author: 'Northwestern University', minutes: 3000, free: true, note: 'Chapter 3 is the definitive free treatment of rigid-body motions. Advanced, but this is where the track leads.' }),
    ],
    exercises: [
      X('calculation', 'Write the 2D rotation matrix for 45 degrees and apply it to the point (1, 0). Then apply a further 45 degree rotation and confirm the result matches a single 90 degree rotation.', 15, { solution: 'R(45)*(1,0) = (0.707, 0.707). Applying R(45) again gives (0, 1), matching R(90)*(1,0) = (0,1). Rotation composition adds angles.' }),
      X('calculation', 'Build the 3x3 homogeneous transform for a 90 degree rotation plus a translation of (2, 1), and apply it to the point (1, 0).', 15, { solution: 'T = [[0,-1,2],[1,0,1],[0,0,1]]. Applied to (1,0,1): x = 0*1 + (-1)*0 + 2 = 2, y = 1*1 + 0*0 + 1 = 2. Result (2, 2).' }),
      X('code', 'Implement a 2-link planar forward kinematics function using 3x3 homogeneous transforms. Verify at q1=0,q2=0 (fully extended), q1=90,q2=0, and q1=0,q2=90.', 25, { solution: 'With L1 and L2, T01 = R(q1)*Trans(L1,0), T12 = R(q2)*Trans(L2,0), T02 = T01*T12. At q=(0,0): (L1+L2, 0). At q=(90,0): (0, L1+L2). At q=(0,90): (L1, L2).' }),
    ],
    questions: [
      mcq(1, 'The 2D rotation matrix for angle a is:', ['[[cos a, -sin a],[sin a, cos a]]', '[[cos a, sin a],[sin a, cos a]]', '[[sin a, cos a],[cos a, sin a]]', '[[cos a, 0],[0, sin a]]'], 0, 'Counter-clockwise rotation. Its inverse is its transpose, which is R(-a).'),
      mcq(1, 'Rotating by 30 degrees then 40 degrees is equivalent to:', ['A single rotation of 70 degrees', 'A rotation of 1200 degrees', 'No single rotation', 'A rotation of 10 degrees'], 0, '2D rotations commute and compose by adding angles. In 3D they do not commute.'),
      mcq(2, 'Homogeneous coordinates write a POINT as:', ['[x, y, z, 1]', '[x, y, z, 0]', '[x, y, z]', '[1, 1, 1, 1]'], 0, 'The 1 makes translation act on it. A direction vector uses 0 so it is rotated but not translated.'),
      mcq(2, 'Composing transforms T_ab and T_bc gives:', ['T_ac', 'T_ca', 'T_ab', 'Undefined'], 0, 'Transform composition - the mechanism behind kinematic chains and ROS 2 tf2.'),
      numeric(2, 'Rotating the point (0, 1) by 90 degrees counter-clockwise gives x equal to what?', -1, 'R(90)*(0,1) = (-1, 0). So x = -1.'),
      mcq(3, 'Gimbal lock is:', ['A loss of one rotational degree of freedom when two Euler angle axes align', 'A mechanical locking mechanism', 'A matrix with zero determinant in 2D', 'A numerical rounding error'], 0, 'It is a property of the Euler angle REPRESENTATION, not of the physical orientation - which is why quaternions are used internally.'),
      mcq(3, 'Why should you interpolate orientations with quaternions rather than Euler angles?', [
        'Euler angle interpolation does not produce constant angular velocity and can suffer gimbal lock',
        'Quaternions use less memory',
        'Euler angles cannot represent all orientations',
        'Quaternion interpolation is exact while Euler is approximate',
      ], 0, 'Linear interpolation of Euler angles gives non-uniform rotation and can pass through singular configurations.'),
    ],
    skills: ['math-transforms', 'math-rotation'],
  }),
];
