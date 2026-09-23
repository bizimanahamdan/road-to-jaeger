import { R, X, lesson, mcq, numeric, short } from './helpers';
import type { Lesson } from '@/lib/types';

/**
 * FOUNDATION / Mathematics.
 *
 * Ordered as a dependency graph, not a list. Arithmetic and negatives feed
 * algebra; algebra feeds equation rearranging; ratios and powers feed graphs;
 * geometry feeds triangles; triangles feed trigonometry; trigonometry plus
 * graphing feed vectors - which is exactly where kinematics and robot control
 * pick up the thread.
 */
export const MATH_LESSONS: Lesson[] = [
  lesson({
    id: 'math-01',
    subject: 'math',
    order: 1,
    title: 'Arithmetic and Order of Operations',
    difficulty: 'intro',
    minutes: 30,
    description:
      'The four operations, and the single rule set that makes an expression mean exactly one thing.',
    why: 'A robot program that computes `2 + 3 * 4` and expects 20 will move a joint to the wrong angle. Every calculation in this roadmap is built from arithmetic evaluated in a fixed order.',
    objectives: [
      'Evaluate expressions containing +, -, *, / and parentheses using the correct order of operations',
      'Explain why order of operations exists and what changes when parentheses are added',
      'Estimate a result before computing it, and use that estimate to catch mistakes',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'The four operations are not interchangeable',
        body: [
          'Addition and multiplication are commutative: 3 + 5 is 5 + 3, and 3 * 5 is 5 * 3. Subtraction and division are not: 5 - 3 is not 3 - 5, and 6 / 3 is not 3 / 6. Getting this wrong in a formula rearrangement silently produces a different physical quantity.',
          'Division is repeated subtraction, multiplication is repeated addition. That framing makes mental estimation fast, and estimation is how engineers catch errors before they reach hardware.',
        ],
        bullets: [
          'a + b = b + a (commutative)',
          'a * b = b * a (commutative)',
          'a - b != b - a',
          'a / b != b / a',
          '(a + b) + c = a + (b + c) (associative)',
          'a * (b + c) = a*b + a*c (distributive - the one you will use constantly)',
        ],
      },
      {
        kind: 'formula',
        heading: 'Order of operations',
        formula: 'Parentheses -> Exponents -> Multiplication and Division (left to right) -> Addition and Subtraction (left to right)',
        defines: [
          'Parentheses/brackets group first, innermost outward',
          'Multiplication and division have EQUAL precedence - go left to right',
          'Addition and subtraction have EQUAL precedence - go left to right',
        ],
        body: [
          'The most common mistake is treating multiplication as always before division. In 12 / 3 * 2 you go left to right: 4 * 2 = 8, not 12 / 6 = 2.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example',
        problem: 'Evaluate: 3 + 6 * (5 + 4) / 3 - 7',
        solution: [
          'Parentheses first: (5 + 4) = 9  ->  3 + 6 * 9 / 3 - 7',
          'Now multiplication and division, left to right: 6 * 9 = 54, then 54 / 3 = 18  ->  3 + 18 - 7',
          'Now addition and subtraction, left to right: 3 + 18 = 21, then 21 - 7 = 14',
        ],
        answer: '14',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'In code it is the same rule',
        body: [
          'Python, C and C++ all follow this precedence. When you are unsure, add parentheses - they cost nothing at runtime and they make the intent obvious to whoever reads the code next (often you, six months later).',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Arithmetic', 'course', 'https://www.khanacademy.org/math/arithmetic', {
        author: 'Khan Academy',
        minutes: 600,
        note: 'Free, self-paced, with practice problems. Work the order-of-operations unit first.',
      }),
      R('Order of Operations - PEMDAS', 'article', 'https://www.mathsisfun.com/operation-order-pemdas.html', {
        author: 'Math Is Fun',
        minutes: 10,
      }),
      R('Corbettmaths: Order of Operations', 'practice', 'https://corbettmaths.com/', {
        author: 'Corbettmaths',
        minutes: 20,
        note: 'Free worksheets and short videos with answers.',
      }),
    ],
    exercises: [
      X(
        'calculation',
        'Evaluate without a calculator, showing each step: (a) 8 + 12 / 4 - 2  (b) 5 * (3 + 2) - 10 / 2  (c) 20 - 3 * 2 ^ 2  (d) (7 + 5) / (2 * 3)',
        12,
        {
          hint: 'Do parentheses first, then exponents, then * and / left to right, then + and - left to right.',
          solution: '(a) 8 + 3 - 2 = 9   (b) 25 - 5 = 20   (c) 20 - 3*4 = 20 - 12 = 8   (d) 12 / 6 = 2',
        },
      ),
      X(
        'calculation',
        'Estimate first (round to 1 significant figure), then compute exactly: 47 * 19 + 103 / 11. Did your estimate catch the right order of magnitude?',
        8,
        { solution: 'Estimate: 50 * 20 + 100 / 10 = 1000 + 10 = 1010. Exact: 893 + 9.36 = 902.4. Same order of magnitude (~10^3).' },
      ),
      X(
        'question',
        'Write the expression 6 / 2 * 3 twice, once with parentheses that give 1 and once with parentheses that give 9. Explain what changed.',
        5,
        { solution: '(6 / 2) * 3 = 9  and  6 / (2 * 3) = 1. The parentheses changed which operation happens first, so the same symbols now mean different things.' },
      ),
    ],
    questions: [
      mcq(1, 'What is 4 + 6 * 2?', ['16', '20', '10', '24'], 0, 'Multiplication binds tighter than addition: 6*2 = 12, then 4 + 12 = 16.'),
      mcq(1, 'What is 12 / 3 * 2?', ['8', '2', '12', '4'], 0, 'Division and multiplication share precedence, so evaluate left to right: 12/3 = 4, 4*2 = 8.'),
      numeric(1, 'Evaluate: (9 - 3) * 4 / 2 + 5', 17, 'Parentheses: 6. Then left to right: 6*4 = 24, 24/2 = 12. Then 12 + 5 = 17.', { unit: '' }),
      mcq(2, 'Why does order of operations exist?', [
        'So that every written expression has exactly one agreed meaning',
        'So that calculations are faster to do by hand',
        'Because parentheses are optional notation',
        'Because multiplication is more important than addition',
      ], 0, 'It is a notation convention that removes ambiguity. Without it, "2 + 3 * 4" would have two valid readings.'),
      mcq(2, 'Adding parentheses to an expression can:', [
        'Change which operation is performed first, and therefore change the result',
        'Never change the result',
        'Only ever make the result larger',
        'Only be used with addition',
      ], 0, 'Parentheses override the default precedence - that is their whole purpose.'),
      mcq(3, 'You estimate 498 * 21 as about 10,000. The exact value is 10,458. What is the estimate good for?', [
        'Catching order-of-magnitude errors before trusting a computed result',
        'Replacing the exact calculation',
        'Proving the exact result is wrong',
        'Nothing; estimation is not engineering',
      ], 0, 'Estimation is a sanity check. If your formula gives 104 instead of ~10,000, you made a structural error even if each arithmetic step looks fine.'),
    ],
    passScore: 85,
    skills: ['math-arithmetic'],
  }),

  lesson({
    id: 'math-05',
    subject: 'math',
    order: 5,
    title: 'Negative Numbers and the Number Line',
    difficulty: 'intro',
    minutes: 25,
    prereqs: ['math-01'],
    description:
      'Signed numbers, subtraction as addition of a negative, and the sign rules for multiplication and division.',
    why: 'Robotics is full of signed quantities: a joint angle of -45 degrees, a motor running in reverse at -120 rpm, a position error of -0.3 m that tells a controller which way to correct. Mishandling a sign is the classic cause of a mechanism driving the wrong way at full speed.',
    objectives: [
      'Add, subtract, multiply and divide signed numbers correctly',
      'Interpret a negative value as direction or deficit on a number line',
      'Apply the sign rules when two negatives are combined',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A negative number is a direction, not a mistake',
        body: [
          'The number line gives negatives a physical meaning: position to the left of zero. Subtraction is just movement left, and adding a negative is the same movement: 7 - 4 = 7 + (-4) = 3.',
          'In robotics the same idea appears everywhere. A velocity of -0.5 m/s means 0.5 m/s in the negative direction. A torque of -2 Nm means 2 Nm trying to rotate the other way. The magnitude tells you how much; the sign tells you which way.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Sign rules',
        formula: '(+) * (+) = (+)   (-) * (-) = (+)   (+) * (-) = (-)   (-) * (+) = (-)',
        defines: [
          'Same signs multiply to positive',
          'Different signs multiply to negative',
          'Division follows exactly the same rules',
        ],
        body: [
          'A useful way to remember it: multiplication by a negative flips the direction. Flipping twice returns you to the original direction, which is why minus times minus is plus.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - motor direction',
        problem: 'A motor controller outputs -3 for 4 seconds, then +5 for 2 seconds. What is the total signed output?',
        solution: [
          'Segment 1: (-3) * 4 = -12',
          'Segment 2: (+5) * 2 = +10',
          'Total: -12 + 10 = -2',
        ],
        answer: '-2 (net motion in the negative direction)',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'The sign bug that breaks hardware',
        body: [
          'In a feedback controller, the correction must have the opposite sign to the error. If you get this backwards the controller does not slow down - it accelerates away from the target until something hits a limit or burns out. This is called positive feedback, and it is why sign conventions are written down before code is written.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Negative numbers', 'course', 'https://www.khanacademy.org/math/arithmetic/arith-review-negative-numbers', { author: 'Khan Academy', minutes: 180 }),
      R('Math Is Fun: Number Line', 'article', 'https://www.mathsisfun.com/number-line.html', { minutes: 10 }),
    ],
    exercises: [
      X('calculation', 'Compute: (a) -7 + 3  (b) -7 - 3  (c) -4 * -6  (d) 24 / -8  (e) -5 + (-5) - (-10)', 10, {
        solution: '(a) -4  (b) -10  (c) 24  (d) -3  (e) -5 - 5 + 10 = 0',
      }),
      X('question', 'A robot arm joint is at +30 degrees and must reach -15 degrees. What signed change in angle is required, and in which direction does the motor turn?', 8, {
        solution: 'Change = target - current = -15 - 30 = -45 degrees. The motor turns 45 degrees in the negative direction.',
      }),
    ],
    questions: [
      numeric(2, 'What is -9 + 4?', -5, 'Start at -9 and move 4 to the right: -5.'),
      numeric(2, 'What is 6 - (-3)?', 9, 'Subtracting a negative is adding a positive: 6 + 3 = 9.'),
      mcq(3, 'What is (-8) * (-5)?', ['-40', '40', '-13', '13'], 1, 'Same signs give a positive product: 8*5 = 40.'),
      mcq(3, 'What is 45 / (-9)?', ['5', '-5', '-36', '36'], 1, 'Different signs give a negative quotient: 45/9 = 5, so the answer is -5.'),
      mcq(2, 'A joint must move from +20 degrees to -25 degrees. The signed change is:', ['+45', '-45', '-5', '+5'], 1, 'Change = target - current = -25 - 20 = -45 degrees.'),
      mcq(1, 'Which expression equals -12?', ['-3 * 4', '-3 * -4', '3 * 4', '-48 / -4'], 0, '-3 * 4 = -12. The others give +12, +12 and +12 respectively.'),
    ],
    skills: ['math-signed-numbers'],
  }),

  lesson({
    id: 'math-02',
    subject: 'math',
    order: 2,
    title: 'Fractions: Meaning, Equivalence and Operations',
    difficulty: 'intro',
    minutes: 40,
    prereqs: ['math-01'],
    description:
      'What a fraction represents, how to find equivalent fractions, and how to add, subtract, multiply and divide them.',
    why: 'Gear ratios are fractions. A 12-tooth pinion driving a 60-tooth gear gives a ratio of 12/60 = 1/5, which means the output turns at one fifth the speed with five times the torque. Every mechanical advantage, every voltage divider and every scaling factor in this roadmap is a fraction.',
    objectives: [
      'Interpret a fraction as a part-to-whole relationship and as a division',
      'Simplify fractions and generate equivalent fractions using the greatest common divisor',
      'Add, subtract, multiply and divide fractions, including mixed numbers',
      'Convert between fractions, decimals and percentages',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A fraction is a division that has not been performed yet',
        body: [
          '3/4 means "3 divided by 4". Keeping it as a fraction preserves exactness; converting to 0.75 loses nothing here, but converting 1/3 to 0.333 does. Engineers keep fractions until the last possible moment for exactly this reason.',
          'The top number (numerator) counts the parts you have; the bottom number (denominator) says how many parts make a whole. The denominator can never be zero, because you cannot divide a whole into zero parts.',
        ],
      },
      {
        kind: 'formula',
        heading: 'The four operations',
        formula: 'a/b * c/d = ac/bd      (a/b) / (c/d) = ad/bc      a/b + c/d = (ad + bc)/bd',
        defines: [
          'Multiplying: multiply across',
          'Dividing: multiply by the reciprocal ("keep, change, flip")',
          'Adding: find a common denominator first',
        ],
        body: [
          'Always simplify before multiplying, not after. In (12/60) * (5/10), cancelling the 12 and 60 by 12 first gives (1/5) * (5/10) = 5/50 = 1/10, which is far easier than 60/600.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - gear ratio',
        problem: 'A motor turns a 12-tooth pinion that drives a 60-tooth gear. The motor spins at 3000 rpm. What is the output speed and the torque multiplication?',
        solution: [
          'Ratio = driver / driven = 12/60 = 1/5',
          'Output speed = 3000 * (1/5) = 600 rpm',
          'Ideal torque multiplication = 5 (the reciprocal), ignoring friction losses',
        ],
        answer: '600 rpm at 5x torque (ideal)',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Mixed numbers',
        body: [
          '2 1/2 means 2 + 1/2, not 2 * 1/2. Convert to an improper fraction (5/2) before doing arithmetic, then convert back for reporting to humans. Code has no mixed-number type - it only has 2.5 or the pair (5, 2).',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Fractions', 'course', 'https://www.khanacademy.org/math/arithmetic/fraction-arithmetic', { author: 'Khan Academy', minutes: 420 }),
      R('Math Is Fun: Fractions', 'article', 'https://www.mathsisfun.com/fractions.html', { minutes: 20 }),
      R('PhET: Fraction Matcher', 'simulator', 'https://phet.colorado.edu/en/simulations/fraction-matcher', { author: 'University of Colorado Boulder', minutes: 20, note: 'Free interactive visualisation of equivalence.' }),
    ],
    exercises: [
      X('calculation', 'Simplify to lowest terms: (a) 12/60  (b) 45/75  (c) 36/48', 8, {
        solution: '(a) 1/5  (b) 3/5  (c) 3/4',
      }),
      X('calculation', 'Compute exactly as fractions: (a) 1/3 + 1/4  (b) 5/6 - 1/2  (c) 2/3 * 9/10  (d) (3/4) / (2/5)', 12, {
        solution: '(a) 4/12 + 3/12 = 7/12  (b) 5/6 - 3/6 = 2/6 = 1/3  (c) 18/30 = 3/5  (d) (3/4)*(5/2) = 15/8 = 1 7/8',
      }),
      X('calculation', 'A voltage divider uses R1 = 10k and R2 = 2.2k across a 5 V supply. The output is 5 * R2/(R1+R2). Compute it as a fraction first, then as a decimal.', 10, {
        hint: 'R1 + R2 = 12.2k. Keep it as 22/122 to stay exact.',
        solution: '5 * 2200/12200 = 5 * 22/122 = 110/122 = 55/61 V = 0.9016 V (about 0.90 V).',
      }),
    ],
    questions: [
      mcq(1, '3/4 is exactly the same as:', ['3 divided by 4', '4 divided by 3', '3 times 4', '4 minus 3'], 0, 'A fraction is an unperformed division with the numerator on top.'),
      numeric(1, 'Express 5/8 as a decimal.', 0.625, '5 divided by 8 is 0.625 exactly.'),
      mcq(2, 'Which fraction is equivalent to 12/60?', ['1/5', '2/5', '1/6', '6/10'], 0, 'Divide numerator and denominator by their GCD, 12: 12/60 = 1/5.'),
      numeric(2, 'Simplify 45/75 and give the numerator of the result.', 3, 'GCD is 15, so 45/75 = 3/5. The numerator is 3.'),
      numeric(3, 'What is 1/3 + 1/4, expressed as a fraction? Give the numerator of the simplified result.', 7, 'Common denominator 12: 4/12 + 3/12 = 7/12. Numerator is 7.'),
      mcq(3, '(3/4) divided by (2/5) equals:', ['15/8', '6/20', '8/15', '3/10'], 0, 'Keep, change, flip: (3/4) * (5/2) = 15/8.'),
      mcq(4, 'Converting 1/3 to a decimal gives 0.333..., which:', ['Loses precision, so engineers keep the fraction until the last step', 'Is more accurate than the fraction', 'Is exactly equal to 1/3', 'Cannot be used in calculations'], 0, 'The decimal is a repeating approximation. Keeping 1/3 exact avoids accumulating rounding error.'),
      numeric(2, 'A 12-tooth gear drives a 60-tooth gear. How many turns of the output gear per one turn of the input? (decimal)', 0.2, '12/60 = 1/5 = 0.2 output turns per input turn.'),
    ],
    skills: ['math-fractions'],
  }),

  lesson({
    id: 'math-03',
    subject: 'math',
    order: 3,
    title: 'Decimals, Rounding and Significant Figures',
    difficulty: 'intro',
    minutes: 30,
    prereqs: ['math-02'],
    description:
      'Place value, rounding rules, and how many digits of a number are actually meaningful.',
    why: 'A sensor that reports 1.23456789 V is lying about seven of those digits. Knowing how many figures you can honestly claim stops you building a robot whose software pretends to be more precise than its hardware.',
    objectives: [
      'Read and write decimals using place value, and convert between decimals and fractions',
      'Round to a specified number of decimal places and significant figures',
      'State how many significant figures a measurement has and why that limits the result',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Place value continues past the decimal point',
        body: [
          'In 3.472, the 3 is units, the 4 is tenths, the 7 is hundredths and the 2 is thousandths. Each position is one tenth of the one to its left, exactly as each position to the left of the point is ten times the one before it.',
          'Decimals and fractions are two notations for the same numbers: 0.25 = 25/100 = 1/4. Some fractions have no finite decimal form (1/3 = 0.333...), which is why exact arithmetic in code often uses integers - for example storing millimetres instead of metres.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Significant figure rules',
        formula: 'Non-zero digits always count. Zeros between non-zeros count. Leading zeros never count. Trailing zeros after a decimal point count.',
        defines: [
          '0.0042 -> 2 significant figures',
          '1005 -> 4 significant figures',
          '2.50 -> 3 significant figures (the trailing zero is meaningful)',
          '2500 -> ambiguous; write 2.5 x 10^3 for 2 sf or 2.500 x 10^3 for 4 sf',
        ],
        body: [
          'When multiplying or dividing, the result keeps as many significant figures as the least precise input. When adding or subtracting, the result keeps as many decimal places as the least precise input.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - honest precision',
        problem: 'You measure a link as 12.3 cm (3 sf) and another as 4.567 cm (4 sf). What is their product, reported honestly?',
        solution: [
          'Raw product: 12.3 * 4.567 = 56.1741',
          'The least precise input has 3 significant figures',
          'Rounded: 56.2 cm^2',
        ],
        answer: '56.2 cm^2 (3 significant figures)',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Rounding half-way cases in code',
        body: [
          'Most languages round-to-nearest but floating point cannot represent 0.5 exactly in all cases, and C\'s `(int)` cast truncates toward zero rather than rounding. In Python use `round()`; in C use `roundf()` from math.h; never use a cast when you mean round. Truncating a motor position by 0.9 of a step is a real positioning error.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Decimals', 'course', 'https://www.khanacademy.org/math/arithmetic/arith-decimals', { author: 'Khan Academy', minutes: 300 }),
      R('Significant Figures', 'article', 'https://www.mathsisfun.com/numbers/significant-figures.html', { minutes: 12 }),
      R('Chemistry LibreTexts: Significant Figures', 'docs', 'https://chem.libretexts.org/Bookshelves/Analytical_Chemistry/Supplemental_Modules_(Analytical_Chemistry)/Data_Analysis/Significant_Figures', { minutes: 20, note: 'The clearest free treatment of the add/multiply rules.' }),
    ],
    exercises: [
      X('calculation', 'Round 3.14159 to (a) 1 dp (b) 3 dp (c) 2 sf (d) 4 sf', 6, { solution: '(a) 3.1  (b) 3.142  (c) 3.1  (d) 3.142' }),
      X('calculation', 'State the number of significant figures: 0.00045, 10.0, 2040, 7.000e3', 6, { solution: '2, 3, 3 (trailing zero without a decimal point is ambiguous - assume 3), 4' }),
      X('question', 'A multimeter reads 4.98 V and a resistor is labelled 220 ohm (2 sf, standard tolerance). What current should you report, and to how many significant figures?', 10, {
        solution: 'I = V/R = 4.98/220 = 0.022636 A. The limiting input has 2 sf, so report 0.023 A (23 mA).',
      }),
    ],
    questions: [
      mcq(1, '0.75 written as a fraction in lowest terms is:', ['3/4', '7/10', '75/10', '1/4'], 0, '0.75 = 75/100 = 3/4 after dividing by 25.'),
      numeric(1, 'Round 2.71828 to 2 decimal places.', 2.72, 'The third decimal is 8, which is >= 5, so round the second decimal up from 1 to 2.'),
      mcq(2, 'How many significant figures does 0.00420 have?', ['2', '3', '4', '5'], 1, 'Leading zeros do not count. 4, 2 and the trailing zero after the decimal point all count: 3 sf.'),
      mcq(3, 'You multiply 12.3 (3 sf) by 4.567 (4 sf). How many significant figures should the answer have?', ['3', '4', '7', 'It does not matter'], 0, 'For multiplication the result is limited by the least precise input: 3 sf.'),
      mcq(3, 'Why should you avoid claiming 1.23456789 V from a sensor that is accurate to 1%?', [
        'The extra digits are not supported by the measurement, so they imply false precision',
        'Because decimals cannot be that long',
        'Because the sensor would need to be recalibrated',
        'It is fine as long as the computer stores it',
      ], 0, '1% of 1.23 V is about 0.012 V, so only the first two decimal places carry information. The rest is noise presented as data.'),
      mcq(2, 'In C, `(int)(2.9)` evaluates to:', ['3', '2', '2.9', 'A compile error'], 1, 'A cast to int truncates toward zero; it does not round. Use roundf() when rounding is what you mean.'),
    ],
    skills: ['math-decimals'],
  }),

  lesson({
    id: 'math-04',
    subject: 'math',
    order: 4,
    title: 'Percentages and Percent Change',
    difficulty: 'beginner',
    minutes: 30,
    prereqs: ['math-02', 'math-03'],
    description: 'Percent as a ratio per hundred, percentage increase and decrease, and reverse percentages.',
    why: 'Tolerances are percentages. Component values are percentages. Efficiency, duty cycle, battery state of charge, error bounds and PID gains expressed as a fraction of full scale - all percentages. Being fluent here turns a wall of datasheet numbers into something you can reason about.',
    objectives: [
      'Convert between percentages, fractions and decimals without a calculator',
      'Calculate percentage increase, decrease and reverse percentages',
      'Apply a percentage tolerance to a nominal component value',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Percent means "per hundred"',
        body: [
          '15% is 15/100 is 0.15. Converting is a two-digit decimal shift, nothing more. The reason percentages are used so heavily in engineering is that they are scale-free: "the motor is 8% slower than spec" is meaningful whether the motor runs at 100 rpm or 10,000 rpm.',
          'A percentage always needs a base. 20% of what? Most percentage errors in engineering come from applying a percentage to the wrong base, especially when a value has already changed once.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Change and reversal',
        formula: 'percent change = (new - old) / old * 100      reverse: old = new / (1 + p/100)',
        defines: [
          'An increase of 20% multiplies by 1.20',
          'A decrease of 20% multiplies by 0.80',
          'Increasing by 20% then decreasing by 20% gives 1.2 * 0.8 = 0.96 - a net 4% loss, not zero',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - resistor tolerance',
        problem: 'A 220 ohm resistor has a 5% tolerance. What range of actual resistance values could you measure?',
        solution: [
          '5% of 220 = 0.05 * 220 = 11 ohm',
          'Lower bound: 220 - 11 = 209 ohm',
          'Upper bound: 220 + 11 = 231 ohm',
        ],
        answer: '209 to 231 ohm',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Percentage points are not percentages',
        body: [
          'If a controller\'s success rate goes from 80% to 88%, that is an 8 percentage-point increase but a 10% relative increase (8/80). Datasheets, papers and marketing material blur this constantly. Always ask which one is meant.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Percent', 'course', 'https://www.khanacademy.org/math/arithmetic/arith-review-percent', { author: 'Khan Academy', minutes: 240 }),
      R('Math Is Fun: Percentages', 'article', 'https://www.mathsisfun.com/percentage.html', { minutes: 15 }),
    ],
    exercises: [
      X('calculation', 'Convert to decimals and fractions: 7%, 45%, 120%, 0.5%', 6, { solution: '0.07 = 7/100; 0.45 = 9/20; 1.20 = 6/5; 0.005 = 1/200' }),
      X('calculation', 'A motor runs at 1200 rpm under no load and 1104 rpm under load. What is the percentage speed drop? (This is called speed regulation.)', 10, { solution: '(1104 - 1200)/1200 * 100 = -96/1200 * 100 = -8%. An 8% speed drop.' }),
      X('calculation', 'A battery reads 11.9 V after losing 15% of its charge from full. What was the full-charge voltage?', 8, { solution: 'full = 11.9 / (1 - 0.15) = 11.9 / 0.85 = 14.0 V' }),
    ],
    questions: [
      mcq(1, '35% written as a decimal is:', ['0.35', '3.5', '0.035', '35.0'], 0, 'Divide by 100 - shift the decimal point two places left.'),
      numeric(1, 'What is 12% of 250?', 30, '0.12 * 250 = 30.'),
      numeric(2, 'A value rises from 40 to 52. What is the percentage increase?', 30, '(52-40)/40 * 100 = 12/40 * 100 = 30%.'),
      mcq(2, 'You increase a value by 20% then decrease the result by 20%. The net effect is:', ['No change', 'A 4% decrease', 'A 4% increase', 'A 40% decrease'], 1, '1.2 * 0.8 = 0.96, which is 4% below the original. Percentages compound on the current base, not the original one.'),
      numeric(3, 'A 4.7k ohm resistor has a 10% tolerance. What is the tolerance band width in ohms?', 470, '10% of 4700 = 470 ohm (so the range is 4230 to 5170 ohm).'),
      mcq(3, 'A controller reports a measured voltage of 12.6 V with a stated +/-2% accuracy. What is the uncertainty in volts?', ['+/-0.252 V', '+/-2 V', '+/-0.02 V', '+/-1.26 V'], 0, '2% of 12.6 = 0.252 V, so the true value lies between 12.348 V and 12.852 V.'),
    ],
    skills: ['math-percentages'],
  }),

  lesson({
    id: 'math-06',
    subject: 'math',
    order: 6,
    title: 'Variables, Expressions and Substitution',
    difficulty: 'beginner',
    minutes: 35,
    prereqs: ['math-01', 'math-05'],
    description:
      'Using letters as numbers, evaluating expressions by substitution, and simplifying by collecting like terms.',
    why: 'Every physics and electronics formula is an expression with letters in it. V = I * R is useless to you until you can substitute real values and, later, rearrange it. This lesson is the hinge between arithmetic and algebra - and therefore between arithmetic and engineering.',
    objectives: [
      'Substitute values into an expression and evaluate it correctly, including negative values',
      'Simplify expressions by collecting like terms and expanding brackets',
      'Translate a word description into an algebraic expression',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A letter is a placeholder for a number',
        body: [
          'When we write V = I * R, the letters stand for any numbers that make the statement true. That generality is the entire point: one formula covers every resistor in every circuit you will ever build.',
          'Conventions matter. In electronics V is voltage, I is current, R is resistance, P is power, t is time. In mechanics F is force, m is mass, a is acceleration, d or s is distance. Using conventional symbols means other engineers can read your work without a legend.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Notation you must read correctly',
        formula: '3x means 3 * x      xy means x * y      x/2y means (x/2) * y unless bracketed      -x^2 means -(x^2)',
        defines: [
          'Juxtaposition implies multiplication',
          'A coefficient of 1 is not written: x means 1x',
          'Substitution of a negative value MUST be bracketed: if x = -3, then 2x^2 = 2 * (-3)^2 = 18',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - substitution with negatives',
        problem: 'Evaluate 3x^2 - 2xy + y when x = -2 and y = 5.',
        solution: [
          '3x^2 = 3 * (-2)^2 = 3 * 4 = 12',
          '-2xy = -2 * (-2) * 5 = +20',
          '+ y = 5',
          'Total: 12 + 20 + 5 = 37',
        ],
        answer: '37',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Like terms only',
        body: [
          '3x + 4y cannot be simplified to 7xy or 7x+y. You can only combine terms with identical variable parts. 3x + 4x = 7x is valid; 3x + 4x^2 is not further simplifiable. Units behave the same way: you cannot add metres to seconds, and this is exactly why dimensional analysis (in the Physics track) works as an error check.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Algebra basics', 'course', 'https://www.khanacademy.org/math/algebra-basics', { author: 'Khan Academy', minutes: 480 }),
      R('Paul\u2019s Online Math Notes: Algebra review', 'docs', 'https://tutorial.math.lamar.edu/classes/de/introalgebra.aspx', { author: 'Paul Dawkins', minutes: 90, note: 'Free, dense, and excellent as a reference.' }),
    ],
    exercises: [
      X('calculation', 'Simplify: (a) 5a + 3b - 2a + 7b  (b) 3(x + 4) - 2(x - 1)  (c) 4m * 3m^2', 10, {
        solution: '(a) 3a + 10b  (b) 3x + 12 - 2x + 2 = x + 14  (c) 12m^3',
      }),
      X('calculation', 'Evaluate 2x^2 + 5x - 3 for (a) x = 3  (b) x = -3  (c) x = 0', 10, {
        solution: '(a) 18 + 15 - 3 = 30  (b) 18 - 15 - 3 = 0  (c) -3',
      }),
      X('question', 'Write an expression for the total cost C of n motors at $12 each plus a flat $8 shipping fee. Then evaluate it for n = 5.', 6, {
        solution: 'C = 12n + 8. For n = 5: C = 60 + 8 = $68.',
      }),
    ],
    questions: [
      mcq(1, 'If x = -4, what is x^2?', ['16', '-16', '8', '-8'], 0, '(-4)^2 = (-4)*(-4) = 16. Bracket the negative before squaring.'),
      numeric(1, 'Evaluate 3a + 2b when a = 5 and b = -3.', 9, '3*5 = 15, 2*(-3) = -6, so 15 - 6 = 9.'),
      mcq(2, 'Simplify 7x + 3y - 2x + y:', ['5x + 4y', '9x + 4y', '5x + 2y', '8xy'], 0, 'Combine like terms: (7-2)x = 5x and (3+1)y = 4y. x and y cannot be merged.'),
      mcq(2, 'Expand 4(2x - 3):', ['8x - 12', '8x - 3', '6x - 12', '8x + 12'], 0, 'Multiply each term inside by 4: 4*2x = 8x and 4*(-3) = -12.'),
      mcq(3, 'A robot needs n wheels at $15 each and 2 controllers at $40 each. Which expression gives the total cost?', ['15n + 80', '15(n + 80)', '55n', '15n + 40'], 0, 'Wheels cost 15n; controllers cost 2 * 40 = 80. Total 15n + 80.'),
      numeric(2, 'Translate "five more than twice a number k" into an expression and evaluate it for k = 7.', 19, '2k + 5 = 14 + 5 = 19.'),
    ],
    skills: ['math-algebra-basics'],
  }),

  lesson({
    id: 'math-07',
    subject: 'math',
    order: 7,
    title: 'Solving Linear Equations',
    difficulty: 'beginner',
    minutes: 40,
    prereqs: ['math-06', 'math-02'],
    description:
      'Isolating an unknown using inverse operations, and checking the answer by substitution.',
    why: 'Solving for an unknown is what engineering calculation actually is. You know the torque you need and the arm length - you solve for force. You know the target speed and the gear ratio - you solve for motor speed. Same operation, every time.',
    objectives: [
      'Solve one-step and two-step linear equations by applying inverse operations to both sides',
      'Solve equations with the unknown on both sides and with brackets',
      'Verify a solution by substituting it back into the original equation',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'An equation is a balance',
        body: [
          'Whatever you do to one side you must do to the other. That single rule generates every technique: add to cancel a subtraction, divide to cancel a multiplication, and so on.',
          'The goal is always the same shape: get the unknown alone on one side, with a number on the other. Work outward from the unknown - undo addition and subtraction first, then multiplication and division.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Inverse operations',
        formula: 'x + a = b  ->  x = b - a        ax = b  ->  x = b/a        x/a = b  ->  x = ab        ax + b = c  ->  x = (c - b)/a',
        defines: ['Every operation has an inverse that undoes it', 'Apply the inverse to BOTH sides'],
      },
      {
        kind: 'example',
        heading: 'Worked example - unknown on both sides',
        problem: 'Solve 5x + 3 = 2x + 18',
        solution: [
          'Subtract 2x from both sides: 3x + 3 = 18',
          'Subtract 3 from both sides: 3x = 15',
          'Divide both sides by 3: x = 5',
          'Check: 5(5) + 3 = 28 and 2(5) + 18 = 28. Both sides equal 28, so x = 5 is correct.',
        ],
        answer: 'x = 5',
      },
      {
        kind: 'example',
        heading: 'Engineering example - force from torque',
        problem: 'Torque is force times perpendicular distance: T = F * d. You need 2.5 Nm from a 0.05 m arm. What force is required?',
        solution: [
          'F * d = T, so F = T / d',
          'F = 2.5 / 0.05 = 50 N',
        ],
        answer: '50 N',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Always check',
        body: [
          'Substituting the answer back takes ten seconds and catches sign errors, which are the most common failure mode in equation solving. Build the habit now; it is the cheapest quality control you will ever get.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: One- and two-step equations', 'course', 'https://www.khanacademy.org/math/algebra-basics/algebra-basics-linear-equations', { author: 'Khan Academy', minutes: 300 }),
      R('Math Is Fun: Solving Equations', 'article', 'https://www.mathsisfun.com/algebra/equations-solving.html', { minutes: 15 }),
    ],
    exercises: [
      X('calculation', 'Solve and check: (a) x + 7 = 19  (b) 4x = 36  (c) x/5 = 8  (d) 3x - 4 = 11  (e) 2(x + 3) = 14', 15, {
        solution: '(a) 12  (b) 9  (c) 40  (d) 5  (e) x + 3 = 7, so x = 4',
      }),
      X('calculation', 'Solve: (a) 6x + 1 = 3x + 16  (b) 5(x - 2) = 3x + 4  (c) x/2 + x/3 = 10', 15, {
        solution: '(a) 3x = 15, x = 5  (b) 5x - 10 = 3x + 4 -> 2x = 14 -> x = 7  (c) multiply by 6: 3x + 2x = 60, x = 12',
      }),
      X('question', 'A motor\'s speed under load follows S = 1200 - 20L, where L is the load in kg. What load gives 900 rpm?', 8, {
        solution: '900 = 1200 - 20L -> 20L = 300 -> L = 15 kg.',
      }),
    ],
    questions: [
      numeric(1, 'Solve: x + 12 = 30', 18, 'Subtract 12 from both sides.'),
      numeric(1, 'Solve: 7x = 63', 9, 'Divide both sides by 7.'),
      numeric(2, 'Solve: 4x - 9 = 15', 6, 'Add 9: 4x = 24. Divide by 4: x = 6.'),
      numeric(2, 'Solve: 5x + 2 = 2x + 20', 6, 'Subtract 2x: 3x + 2 = 20. Subtract 2: 3x = 18. x = 6.'),
      numeric(2, 'Solve: 3(x - 4) = 2x + 5', 17, 'Expand: 3x - 12 = 2x + 5. Subtract 2x: x - 12 = 5. Add 12: x = 17.'),
      mcq(3, 'You solve an equation and get x = 4. What is the correct next step?', [
        'Substitute 4 back into the original equation and confirm both sides match',
        'Assume it is correct if each step looked right',
        'Solve it a second time and compare',
        'Round it to the nearest whole number',
      ], 0, 'Verification by substitution is the only reliable check, and it takes seconds.'),
      numeric(3, 'Using T = F * d, find F when T = 2.5 Nm and d = 0.05 m.', 50, 'F = T/d = 2.5/0.05 = 50 N.', { unit: 'N' }),
    ],
    skills: ['math-linear-equations'],
  }),

  lesson({
    id: 'math-08',
    subject: 'math',
    order: 8,
    title: 'Rearranging Formulas (Literal Equations)',
    difficulty: 'beginner',
    minutes: 40,
    prereqs: ['math-07'],
    description:
      'Making any symbol the subject of a formula, so a single equation can answer many different questions.',
    why: 'This is the single most useful algebra skill for an engineer. Ohm\u2019s law is one equation, but you need it in three forms: V = IR, I = V/R, R = V/I. Power is P = VI, but you also need I = P/V to size a fuse. Rearranging is what turns a formula you know into a formula you need.',
    objectives: [
      'Make any variable the subject of a formula, including formulas with squares and denominators',
      'Rearrange Ohm\u2019s law and the power formula for each of their variables',
      'Check a rearranged formula for dimensional and numerical consistency',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Same rules, more letters',
        body: [
          'Rearranging uses exactly the balance rules from solving equations - the only difference is that the answer contains letters instead of numbers. Treat the variable you want as the unknown and every other letter as if it were a number.',
          'A reliable procedure: (1) clear any denominator by multiplying both sides, (2) expand brackets, (3) collect all terms containing the subject on one side, (4) factor the subject out, (5) divide by whatever multiplies it.',
        ],
      },
      {
        kind: 'formula',
        heading: 'The formulas you will rearrange constantly',
        formula: 'V = IR   ->   I = V/R   ->   R = V/I        P = VI   ->   I = P/V   ->   V = P/I        P = I^2 R   ->   I = sqrt(P/R)   ->   R = P/I^2',
        defines: [
          'F = ma  ->  m = F/a  ->  a = F/m',
          'T = F d  ->  F = T/d  ->  d = T/F',
          'v = d/t  ->  d = vt  ->  t = d/v',
          'KE = 1/2 m v^2  ->  v = sqrt(2 KE / m)',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - subject inside a square',
        problem: 'Make v the subject of KE = (1/2) m v^2.',
        solution: [
          'Multiply both sides by 2: 2 KE = m v^2',
          'Divide both sides by m: 2 KE / m = v^2',
          'Take the square root of both sides: v = sqrt(2 KE / m)',
          'Physically we take the positive root, because speed is a magnitude.',
        ],
        answer: 'v = sqrt(2 KE / m)',
      },
      {
        kind: 'example',
        heading: 'Worked example - subject in a denominator',
        problem: 'Make R the subject of I = V / (R + r), where r is internal resistance.',
        solution: [
          'Multiply both sides by (R + r): I(R + r) = V',
          'Divide by I: R + r = V / I',
          'Subtract r: R = V/I - r',
        ],
        answer: 'R = V/I - r',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Check with numbers',
        body: [
          'After rearranging, plug in easy numbers and confirm both forms agree. With V = 12, I = 2, R = 6: V = IR gives 12 = 2*6 (true), and R = V/I gives 6 = 12/2 (true). If your rearrangement is wrong, a numeric check almost always exposes it.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Literal equations', 'practice', 'https://www.khanacademy.org/math/algebra-basics', { author: 'Khan Academy', minutes: 120 }),
      R('Math Is Fun: Rearranging Formulas', 'article', 'https://www.mathsisfun.com/algebra/rearranging-formulas.html', { minutes: 15 }),
      R('All About Circuits: Ohm\u2019s law', 'docs', 'https://www.allaboutcircuits.com/textbook/direct-current/chpt-2/ohms-law-again/', { author: 'All About Circuits', minutes: 30, note: 'Free online textbook; the electronics section shows exactly why rearranging matters.' }),
    ],
    exercises: [
      X('calculation', 'Rearrange to make the stated variable the subject: (a) V = IR, for R  (b) P = VI, for I  (c) F = ma, for a  (d) v = u + at, for t  (e) T = Fd, for d', 15, {
        solution: '(a) R = V/I  (b) I = P/V  (c) a = F/m  (d) t = (v - u)/a  (e) d = T/F',
      }),
      X('calculation', 'Make the subject: (a) y = mx + c, for x  (b) A = 2*pi*r*h, for h  (c) E = m*g*h, for m  (d) P = I^2 * R, for I', 15, {
        solution: '(a) x = (y - c)/m  (b) h = A/(2*pi*r)  (c) m = E/(g*h)  (d) I = sqrt(P/R)',
      }),
      X('question', 'A 12 V supply must deliver 3 A to a motor. Rearrange P = VI to find the power, then rearrange again to find the current if the power were held at 36 W but the voltage dropped to 9 V.', 10, {
        solution: 'P = VI = 12 * 3 = 36 W. Then I = P/V = 36/9 = 4 A. Lower voltage at constant power means higher current - which is why wire and fuse sizing depends on voltage, not just power.',
      }),
    ],
    questions: [
      mcq(1, 'Make R the subject of V = I * R:', ['R = V/I', 'R = I/V', 'R = V*I', 'R = V - I'], 0, 'Divide both sides by I.'),
      mcq(1, 'Make a the subject of F = m * a:', ['a = F/m', 'a = m/F', 'a = F*m', 'a = F + m'], 0, 'Divide both sides by m.'),
      mcq(2, 'Make t the subject of v = u + a*t:', ['t = (v - u)/a', 't = v - u/a', 't = (v + u)/a', 't = a(v - u)'], 0, 'Subtract u first, then divide by a. Order matters.'),
      mcq(2, 'Make v the subject of KE = 1/2 * m * v^2:', ['v = sqrt(2*KE/m)', 'v = 2*KE/m', 'v = KE/(2m)', 'v = sqrt(KE/2m)'], 0, 'Multiply by 2, divide by m, then take the square root.'),
      mcq(2, 'Make h the subject of A = 2*pi*r*h:', ['h = A/(2*pi*r)', 'h = 2*pi*r/A', 'h = A*2*pi*r', 'h = A - 2*pi*r'], 0, 'Divide both sides by the whole coefficient 2*pi*r.'),
      mcq(3, 'You rearrange P = I^2*R to I = sqrt(P/R). Which check confirms it?', [
        'Substitute P = 36, R = 4: I = sqrt(9) = 3, and the original gives 36 = 3^2 * 4 = 36',
        'Confirm the letters appear in the same order',
        'Confirm the result has no fractions',
        'Confirm both sides contain I',
      ], 0, 'A numeric substitution into both the original and the rearranged form is the real test.'),
      numeric(1, 'Using V = IR, find I when V = 12 and R = 4.7.', 2.55, 'I = 12/4.7 = 2.553... A. About 2.55 A.', { unit: 'A' }),
    ],
    skills: ['math-formula-rearrangement'],
  }),

  lesson({
    id: 'math-09',
    subject: 'math',
    order: 9,
    title: 'Ratios, Proportions and Scaling',
    difficulty: 'beginner',
    minutes: 35,
    prereqs: ['math-04'],
    description: 'Direct and inverse proportion, ratio division, and what actually happens when you scale a design up.',
    why: 'Gear ratios, pulley systems, lever arms, voltage dividers and current sensing are all proportions. And scaling is where naive robot designs die: double every dimension and the mass goes up eightfold while muscle-equivalent strength only goes up fourfold. This lesson is the entry point to that whole problem.',
    objectives: [
      'Divide a quantity in a given ratio and set up a proportion to solve for an unknown',
      'Distinguish direct from inverse proportion and write each as an equation',
      'Apply linear, area and volume scaling factors correctly',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A proportion is an equation between two ratios',
        body: [
          'If a/b = c/d then ad = bc (cross-multiplication). This is the workhorse for unit conversion and for scaling a recipe of parts up or down.',
          'Direct proportion: y = kx. Double x and y doubles. Speed and distance at constant time are directly proportional. Inverse proportion: y = k/x. Double x and y halves. Speed and time for a fixed distance are inversely proportional.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Scaling factors',
        formula: 'length scale L  ->  area scales by L^2  ->  volume and mass scale by L^3',
        defines: [
          'Cross-sectional area (which sets strength) scales by L^2',
          'Mass (which sets the load) scales by L^3',
          'So strength-to-weight ratio scales by L^2 / L^3 = 1/L - it gets WORSE as things get bigger',
        ],
        body: [
          'This is the square-cube law, and it is the fundamental reason a 6 m tall walking robot is not just a scaled-up human. It is revisited rigorously in the Large Robotics track.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - gear ratio',
        problem: 'Two gears are in a 3:1 ratio (driven:driver). The driver turns at 900 rpm with 0.5 Nm of torque. Find the driven speed and torque, ignoring losses.',
        solution: [
          'Speed is inversely proportional to the ratio: 900 / 3 = 300 rpm',
          'Torque is directly proportional to the ratio: 0.5 * 3 = 1.5 Nm',
          'Power check: 900 rpm * 0.5 Nm and 300 rpm * 1.5 Nm are the same power, as they must be',
        ],
        answer: '300 rpm at 1.5 Nm',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Gears trade speed for torque, never create power',
        body: [
          'Power in equals power out minus losses. A gearbox cannot give you more torque AND more speed. Any claim otherwise is a perpetual motion machine. Always sanity-check a drivetrain by computing power on both sides.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Ratios and proportions', 'course', 'https://www.khanacademy.org/math/algebra-basics/alg-basics-ratios-and-proportions', { author: 'Khan Academy', minutes: 240 }),
      R('Square-cube law', 'article', 'https://en.wikipedia.org/wiki/Square%E2%80%93cube_law', { minutes: 20, note: 'Read the "Engineering" section - it is the whole argument for why large robots are hard.' }),
    ],
    exercises: [
      X('calculation', 'Divide 240 mm in the ratio 3:5.', 6, { solution: 'Total parts = 8, one part = 30 mm, so 90 mm and 150 mm.' }),
      X('calculation', 'If 4 motors cost $86, how much do 7 cost? Set it up as a proportion.', 6, { solution: '4/86 = 7/x -> x = 7*86/4 = $150.50' }),
      X('question', 'A 1.5 kg robot prototype is scaled up by a factor of 4 in every dimension, keeping the same material. What are the new mass and the new cross-sectional strength of a leg, and what happens to the strength-to-weight ratio?', 12, {
        solution: 'Mass scales by 4^3 = 64, so 96 kg. Cross-section scales by 4^2 = 16, so strength is 16x. Strength-to-weight is 16/64 = 1/4 of the original. The scaled robot is four times weaker relative to its own weight and would likely collapse under its own mass.',
      }),
    ],
    questions: [
      numeric(1, 'Divide 180 in the ratio 2:3. What is the LARGER share?', 108, 'Total 5 parts, one part = 36, larger share = 3 * 36 = 108.'),
      numeric(1, 'If 6 servos cost $72, what do 10 cost at the same rate?', 120, 'Unit price 12 each, so 10 * 12 = 120.'),
      mcq(2, 'y is directly proportional to x, and y = 15 when x = 3. What is y when x = 7?', ['35', '21', '105', '45'], 0, 'k = 15/3 = 5, so y = 5x and y = 35 when x = 7.'),
      mcq(2, 'Speed and travel time for a fixed distance are:', ['Inversely proportional', 'Directly proportional', 'Unrelated', 'Equal'], 0, 't = d/v, so doubling speed halves the time - the signature of inverse proportion.'),
      mcq(3, 'An object is scaled so every length doubles. Its volume and mass change by a factor of:', ['2', '4', '8', '16'], 2, 'Volume scales with the cube of the length factor: 2^3 = 8.'),
      mcq(3, 'Why does a large robot need proportionally thicker legs than a small one?', [
        'Mass grows as L^3 but load-bearing cross-section only grows as L^2, so stress increases with size',
        'Because larger robots use heavier motors',
        'Because larger robots move faster',
        'They do not; the proportions stay the same',
      ], 0, 'The square-cube law. This is the core constraint of the Large Robotics track.'),
    ],
    skills: ['math-ratios', 'math-scaling-intuition'],
  }),

  lesson({
    id: 'math-10',
    subject: 'math',
    order: 10,
    title: 'Powers, Roots and Scientific Notation',
    difficulty: 'beginner',
    minutes: 35,
    prereqs: ['math-03'],
    description: 'Exponent rules, square and cube roots, and how engineers write very large and very small numbers.',
    why: 'Electronics lives in scientific notation: 4.7 kOhm is 4.7e3, a 100 nF capacitor is 1e-7 F, and an MCU clock is 1.6e7 Hz. Exponents also appear in the physics that matters most here - kinetic energy is proportional to v squared, which is why a falling robot at twice the speed hits with four times the energy.',
    objectives: [
      'Apply the laws of exponents to multiply, divide and raise powers',
      'Evaluate square and cube roots, and recognise that a root is a fractional power',
      'Convert between standard form and scientific notation, including metric prefixes',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Metric prefixes you must know cold',
        columns: ['Prefix', 'Symbol', 'Factor', 'Typical robotics use'],
        rows: [
          ['mega', 'M', '1e6', 'MCU clock (16 MHz), motor power'],
          ['kilo', 'k', '1e3', 'Resistance (4.7k), mass (2 kg)'],
          ['milli', 'm', '1e-3', 'Current (20 mA), length (25 mm)'],
          ['micro', 'u', '1e-6', 'Current (uA sleep), capacitance (uF)'],
          ['nano', 'n', '1e-9', 'Capacitance (100 nF), pulse timing'],
          ['pico', 'p', '1e-12', 'Small capacitance (22 pF)'],
        ],
      },
      {
        kind: 'formula',
        heading: 'Laws of exponents',
        formula: 'a^m * a^n = a^(m+n)      a^m / a^n = a^(m-n)      (a^m)^n = a^(mn)      a^0 = 1      a^-n = 1/a^n      a^(1/2) = sqrt(a)',
        defines: ['A negative exponent is a reciprocal, not a negative number', 'A fractional exponent is a root'],
      },
      {
        kind: 'example',
        heading: 'Worked example - energy scales with the square of speed',
        problem: 'A 2 kg robot falls. Compare the kinetic energy at 1 m/s and at 3 m/s using KE = 1/2 m v^2.',
        solution: [
          'At 1 m/s: KE = 0.5 * 2 * 1^2 = 1 J',
          'At 3 m/s: KE = 0.5 * 2 * 3^2 = 0.5 * 2 * 9 = 9 J',
          'Speed tripled, energy increased ninefold (3^2)',
        ],
        answer: '9 J - nine times the energy for three times the speed',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Why this matters for fall protection',
        body: [
          'That square is the reason a humanoid falling from standing height can destroy itself while the same robot tipped over slowly is fine. Impact energy grows with the square of impact velocity, so structural design is dominated by the worst case, not the average case. Keep this in mind for the Humanoid track.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Exponents and radicals', 'course', 'https://www.khanacademy.org/math/algebra-basics/alg-basics-exponents-and-radicals', { author: 'Khan Academy', minutes: 300 }),
      R('Math Is Fun: Scientific Notation', 'article', 'https://www.mathsisfun.com/numbers/scientific-notation.html', { minutes: 12 }),
    ],
    exercises: [
      X('calculation', 'Simplify: (a) 2^3 * 2^4  (b) 10^6 / 10^2  (c) (3^2)^3  (d) 5^-2  (e) 16^(1/2)', 8, {
        solution: '(a) 2^7 = 128  (b) 10^4 = 10000  (c) 3^6 = 729  (d) 1/25 = 0.04  (e) 4',
      }),
      X('calculation', 'Write in scientific notation and convert to base units: (a) 4.7 kohm  (b) 100 nF  (c) 20 mA  (d) 16 MHz', 8, {
        solution: '(a) 4.7e3 = 4700 ohm  (b) 100e-9 = 1.0e-7 F  (c) 20e-3 = 0.02 A  (d) 16e6 = 1.6e7 Hz',
      }),
      X('calculation', 'A 0.5 kg payload is lifted to 1.2 m. Using PE = mgh with g = 9.81, compute the stored energy. Then compute the impact speed if it falls, using v = sqrt(2gh).', 10, {
        solution: 'PE = 0.5 * 9.81 * 1.2 = 5.886 J. v = sqrt(2 * 9.81 * 1.2) = sqrt(23.544) = 4.85 m/s.',
      }),
    ],
    questions: [
      mcq(1, '2^3 * 2^4 equals:', ['2^7', '2^12', '4^7', '2^1'], 0, 'Same base, multiplying: add the exponents, 3 + 4 = 7.'),
      mcq(1, '5^-2 equals:', ['-25', '1/25', '-10', '25'], 1, 'A negative exponent is a reciprocal: 1/5^2 = 1/25 = 0.04.'),
      numeric(2, 'What is sqrt(144)?', 12, '12 * 12 = 144.'),
      mcq(2, '16^(1/2) is the same as:', ['sqrt(16)', '16/2', '1/16^2', '2^16'], 0, 'A one-half exponent is a square root.'),
      mcq(3, '100 nF expressed in farads is:', ['1e-7 F', '1e-9 F', '1e-4 F', '1e7 F'], 0, 'nano is 1e-9, so 100 * 1e-9 = 1e-7 F.'),
      mcq(3, '4.7 kohm expressed in ohms is:', ['4700', '47', '0.0047', '470000'], 0, 'kilo is 1e3, so 4.7 * 1000 = 4700 ohm.'),
      numeric(3, 'Kinetic energy is 1/2 m v^2. A 2 kg object at 4 m/s has how many joules?', 16, '0.5 * 2 * 16 = 16 J.', { unit: 'J' }),
    ],
    skills: ['math-exponents'],
  }),

  lesson({
    id: 'math-11',
    subject: 'math',
    order: 11,
    title: 'The Coordinate Plane and Graphing Lines',
    difficulty: 'beginner',
    minutes: 40,
    prereqs: ['math-07', 'math-05'],
    description: 'Plotting points, gradient and intercept, the equation of a line, and reading meaning from a graph.',
    why: 'A robot\'s position is a coordinate. A sensor\'s calibration is a line fit. A velocity-time graph\'s slope is acceleration and its area is distance. If you cannot read a graph, you cannot read your own robot\'s telemetry - and telemetry is how you debug anything that moves.',
    objectives: [
      'Plot points and interpret coordinates as positions in a 2D frame',
      'Calculate the gradient of a line from two points and write its equation in y = mx + c form',
      'Interpret slope and intercept in a physical context, and read values from a graph',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A coordinate frame is a convention you choose',
        body: [
          'The plane has an origin (0,0), an x axis and a y axis. In robotics you will constantly define frames: one at the robot\'s base, one at each joint, one at the tool. The maths is identical; only the meaning of the origin changes. Getting comfortable with one frame is the prerequisite for handling many.',
          'Gradient (slope) is rise over run: how much y changes per unit change in x. Intercept is where the line crosses the y axis, which is the value of y when x is zero.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Gradient and the line equation',
        formula: 'm = (y2 - y1) / (x2 - x1)      y = mx + c      point-slope: y - y1 = m(x - x1)',
        defines: [
          'm > 0: rising to the right',
          'm < 0: falling to the right',
          'm = 0: horizontal line, y is constant',
          'Undefined gradient: vertical line, x is constant - not a function of x',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - sensor calibration',
        problem: 'A distance sensor reads 0.8 V at 20 cm and 2.3 V at 80 cm. Find the line relating voltage V to distance d, and predict the reading at 50 cm.',
        solution: [
          'm = (2.3 - 0.8) / (80 - 20) = 1.5 / 60 = 0.025 V/cm',
          'Using point (20, 0.8): c = 0.8 - 0.025 * 20 = 0.8 - 0.5 = 0.3 V',
          'So V = 0.025 d + 0.3',
          'At d = 50: V = 0.025 * 50 + 0.3 = 1.25 + 0.3 = 1.55 V',
        ],
        answer: 'V = 0.025d + 0.3; about 1.55 V at 50 cm',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Slope has units',
        body: [
          'The gradient of a velocity-time graph has units (m/s)/s = m/s^2, which is acceleration. The gradient of a voltage-distance graph is V/cm. Always carry units through a slope calculation - it tells you what the graph means physically, and it catches axis mix-ups instantly.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Graphing lines', 'course', 'https://www.khanacademy.org/math/algebra-basics/alg-basics-linear-equations-and-functions', { author: 'Khan Academy', minutes: 300 }),
      R('PhET: Graphing Lines', 'simulator', 'https://phet.colorado.edu/en/simulations/graphing-lines', { author: 'University of Colorado Boulder', minutes: 25, note: 'Free interactive - drag the line and watch gradient and intercept change.' }),
    ],
    exercises: [
      X('calculation', 'Find the gradient of the line through: (a) (1,2) and (4,11)  (b) (0,5) and (3,-1)  (c) (-2,-3) and (2,5)', 10, {
        solution: '(a) 9/3 = 3  (b) -6/3 = -2  (c) 8/4 = 2',
      }),
      X('calculation', 'Write the equation of the line with gradient -2 passing through (3, 4). Then find where it crosses the y axis.', 10, {
        solution: 'y - 4 = -2(x - 3) -> y = -2x + 6 + 4 -> y = -2x + 10. It crosses the y axis at 10.',
      }),
      X('question', 'You log a robot\'s battery voltage over time and get a straight line from 12.6 V at 0 min to 11.4 V at 40 min. Write the equation, state what the gradient means physically, and predict the voltage at 90 min. Is that prediction trustworthy?', 12, {
        solution: 'm = (11.4-12.6)/40 = -0.03 V/min, c = 12.6, so V = -0.03t + 12.6. The gradient is the discharge rate. At 90 min: 12.6 - 2.7 = 9.9 V. Not trustworthy - battery discharge is not linear, and 9.9 V is below a typical LiPo cutoff, so extrapolating that far is exactly the mistake that crashes a robot.',
      }),
    ],
    questions: [
      mcq(1, 'The point (3, -2) is located:', ['3 right and 2 down from the origin', '2 right and 3 down from the origin', '3 left and 2 up from the origin', 'At the origin'], 0, 'x is the horizontal coordinate, y the vertical. Negative y means below the axis.'),
      numeric(2, 'What is the gradient of the line through (2, 5) and (6, 17)?', 3, '(17-5)/(6-2) = 12/4 = 3.'),
      mcq(2, 'A horizontal line has a gradient of:', ['0', '1', '-1', 'Undefined'], 0, 'y does not change as x changes, so rise is 0. A vertical line, by contrast, has undefined gradient.'),
      mcq(2, 'In y = mx + c, what does c represent?', ['The value of y when x = 0', 'The gradient', 'The value of x when y = 0', 'The slope times the intercept'], 0, 'c is the y-intercept: the output when the input is zero.'),
      mcq(3, 'A sensor calibration gives V = 0.025d + 0.3 (V in volts, d in cm). What does 0.025 mean?', ['The voltage increases 0.025 V for every extra cm of distance', 'The voltage is 0.025 V at zero distance', 'The distance increases 0.025 cm per volt', 'The sensor accuracy'], 0, 'It is the slope with units V/cm - the sensitivity of the sensor.'),
      numeric(3, 'Using V = 0.025d + 0.3, what voltage is read at d = 40 cm?', 1.3, '0.025*40 = 1.0, plus 0.3 = 1.3 V.', { unit: 'V' }),
    ],
    skills: ['math-graphing'],
  }),

  lesson({
    id: 'math-12',
    subject: 'math',
    order: 12,
    title: 'Geometry: Length, Area, Volume and Units',
    difficulty: 'beginner',
    minutes: 35,
    prereqs: ['math-01', 'math-10'],
    description: 'Perimeter, area and volume of the shapes that actually appear in mechanical design, with unit handling.',
    why: 'You need area for stress (force per unit area), for heat dissipation and for battery plate sizing. You need volume for mass, buoyancy and enclosure sizing. And every one of these carries units that must be squared or cubed consistently - the most common source of 1000x errors in engineering.',
    objectives: [
      'Compute perimeter, area and volume for rectangles, circles, triangles and cylinders',
      'Convert between length, area and volume units correctly, including mm to m',
      'Explain why area scales with the square of a length unit and volume with the cube',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Formulas used constantly in mechanical design',
        columns: ['Shape', 'Area', 'Volume'],
        rows: [
          ['Rectangle (w x h)', 'w * h', 'w * h * d'],
          ['Circle (radius r)', 'pi * r^2', '-'],
          ['Cylinder (r, height h)', '2*pi*r*h (side)', 'pi * r^2 * h'],
          ['Triangle (base b, height h)', '0.5 * b * h', '-'],
          ['Sphere (radius r)', '4 * pi * r^2', '(4/3) * pi * r^3'],
        ],
      },
      {
        kind: 'formula',
        heading: 'Unit conversion is exponentiation',
        formula: '1 m = 1000 mm      1 m^2 = 1,000,000 mm^2      1 m^3 = 1,000,000,000 mm^3',
        defines: [
          'Because (1000 mm)^2 = 1e6 mm^2 and (1000 mm)^3 = 1e9 mm^3',
          '1 litre = 1000 cm^3 = 0.001 m^3',
          '1 MPa = 1 N/mm^2 - a genuinely useful identity for stress calculations',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - stress on a printed bracket',
        problem: 'A 3D-printed bracket has a cross-section of 8 mm by 3 mm and carries a 120 N load. What is the stress?',
        solution: [
          'Area = 8 * 3 = 24 mm^2',
          'Stress = force / area = 120 N / 24 mm^2 = 5 N/mm^2 = 5 MPa',
          'Typical PLA tensile strength is around 35-50 MPa, so the static safety factor is roughly 7-10',
        ],
        answer: '5 MPa',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'The 1000x bug',
        body: [
          'Converting 25 mm to metres gives 0.025 m, not 2.5 m. Converting an area of 25 mm^2 to m^2 gives 2.5e-5 m^2, not 0.025 m^2. Mixed length and area units in the same calculation produce errors of 1000x and 1,000,000x. Pick one unit system at the start of a calculation and stay in it.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Geometry', 'course', 'https://www.khanacademy.org/math/geometry', { author: 'Khan Academy', minutes: 600 }),
      R('Math Is Fun: Area', 'article', 'https://www.mathsisfun.com/area.html', { minutes: 20 }),
    ],
    exercises: [
      X('calculation', 'Compute: (a) area of a circle of radius 25 mm  (b) volume of a cylinder 40 mm diameter, 60 mm tall  (c) area of a triangle with base 12 cm and height 5 cm', 12, {
        solution: '(a) pi * 625 = 1963.5 mm^2  (b) pi * 20^2 * 60 = 75398 mm^3 = 75.4 cm^3  (c) 30 cm^2',
      }),
      X('calculation', 'Convert: (a) 1500 mm^2 to m^2  (b) 2.5 litres to cm^3  (c) 3 MPa to N/m^2', 8, {
        solution: '(a) 1.5e-3 m^2  (b) 2500 cm^3  (c) 3e6 N/m^2 (Pa)',
      }),
      X('question', 'A robot chassis plate is 200 mm x 150 mm x 4 mm of aluminium (density 2700 kg/m^3). Compute its volume in m^3 and its mass.', 12, {
        solution: 'Volume = 0.2 * 0.15 * 0.004 = 1.2e-4 m^3. Mass = 2700 * 1.2e-4 = 0.324 kg.',
      }),
    ],
    questions: [
      mcq(1, 'The area of a circle with radius r is:', ['pi * r^2', '2 * pi * r', 'pi * d', '4/3 * pi * r^3'], 0, '2*pi*r is the circumference; pi*r^2 is the area.'),
      numeric(1, 'What is the area of a rectangle 25 mm by 8 mm, in mm^2?', 200, '25 * 8 = 200 mm^2.', { unit: 'mm^2' }),
      mcq(2, 'How many mm^2 are in 1 m^2?', ['1,000', '1,000,000', '1,000,000,000', '100'], 1, 'The conversion factor is squared: (1000)^2 = 1e6.'),
      mcq(2, 'The volume of a cylinder is:', ['pi * r^2 * h', '2 * pi * r * h', 'pi * r * h', '(4/3) * pi * r^3'], 0, 'Base area times height. 2*pi*r*h is only the curved side surface.'),
      mcq(3, 'Stress is force divided by area. Which unit is equivalent to 1 MPa?', ['1 N/mm^2', '1 N/m^2', '1 kg/mm^2', '1 N*mm'], 0, '1e6 N/m^2 = 1e6 N / 1e6 mm^2 = 1 N/mm^2. Handy for hand calculations on small parts.'),
      numeric(3, 'A 24 mm^2 cross-section carries 120 N. What is the stress in MPa?', 5, '120/24 = 5 N/mm^2 = 5 MPa.', { unit: 'MPa' }),
    ],
    skills: ['math-geometry'],
  }),

  lesson({
    id: 'math-13',
    subject: 'math',
    order: 13,
    title: 'Angles, Degrees and Radians',
    difficulty: 'beginner',
    minutes: 30,
    prereqs: ['math-12'],
    description: 'Measuring rotation in degrees and radians, angle relationships, and converting between the two.',
    why: 'Joint angles are the native coordinate of a robot arm. Servo commands are in degrees; every trigonometric function in every programming language takes radians. Getting the conversion wrong by a factor of 57.3 is a classic and destructive bug.',
    objectives: [
      'Convert between degrees and radians',
      'Use angle relationships on a straight line, at a point, and in parallel lines',
      'Explain why radians are the natural unit for rotation in mathematics and code',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A radian is an arc length divided by a radius',
        body: [
          'One radian is the angle subtended when the arc length equals the radius. A full turn is therefore 2*pi radians, because the circumference is 2*pi*r. That gives 360 degrees = 2*pi radians, so 180 degrees = pi radians.',
          'Radians are not an arbitrary choice. With angles in radians, the derivative of sin(x) is cos(x) exactly, with no scaling constant. Every control law, every dynamics equation and every standard library function assumes radians.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Conversion',
        formula: 'radians = degrees * pi / 180      degrees = radians * 180 / pi',
        defines: [
          '1 radian = 57.2958 degrees',
          '90 degrees = pi/2 = 1.5708 rad',
          '45 degrees = pi/4 = 0.7854 rad',
          '30 degrees = pi/6 = 0.5236 rad',
        ],
      },
      {
        kind: 'table',
        heading: 'Angle relationships',
        columns: ['Situation', 'Rule'],
        rows: [
          ['Angles on a straight line', 'Sum to 180 degrees (pi rad)'],
          ['Angles around a point', 'Sum to 360 degrees (2*pi rad)'],
          ['Interior angles of a triangle', 'Sum to 180 degrees'],
          ['Interior angles of an n-sided polygon', '(n - 2) * 180 degrees'],
          ['Two parallel lines cut by a transversal', 'Corresponding angles equal; alternate angles equal; co-interior sum to 180'],
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'The servo bug',
        body: [
          'In C and Python, sin(), cos() and atan2() take RADIANS. Hobby servo libraries take DEGREES. Code that passes degrees straight into cos() will produce values that look plausible but are wrong, and a robot arm that moves to a plausible-looking but wrong angle will still hit the table. Convert explicitly and name your variables with the unit: angle_deg, angle_rad.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Angles', 'course', 'https://www.khanacademy.org/math/geometry/hs-geo-angles', { author: 'Khan Academy', minutes: 240 }),
      R('Radians', 'article', 'https://www.mathsisfun.com/geometry/radians.html', { minutes: 15 }),
    ],
    exercises: [
      X('calculation', 'Convert to radians (3 dp): 30, 45, 60, 90, 180, 270 degrees', 8, { solution: '0.524, 0.785, 1.047, 1.571, 3.142, 4.712' }),
      X('calculation', 'Convert to degrees: pi/3, 3*pi/4, 2, 0.5 radians', 8, { solution: '60, 135, 114.6, 28.6 degrees' }),
      X('question', 'Two angles of a triangle are 47 and 68 degrees. Find the third. Then convert all three to radians.', 8, { solution: 'Third = 180 - 115 = 65 degrees. In radians: 0.820, 1.187, 1.134.' }),
    ],
    questions: [
      numeric(1, 'Convert 90 degrees to radians (use pi = 3.14159, give 3 dp).', 1.571, '90 * pi/180 = pi/2 = 1.5708.', { unit: 'rad' }),
      numeric(1, 'Convert 2 radians to degrees (1 dp).', 114.6, '2 * 180/pi = 114.59 degrees.'),
      mcq(2, 'The interior angles of a triangle sum to:', ['180 degrees', '360 degrees', '90 degrees', 'It depends on the triangle'], 0, 'True for every triangle in flat (Euclidean) geometry.'),
      numeric(2, 'Two angles of a triangle are 40 and 75 degrees. What is the third?', 65, '180 - 40 - 75 = 65 degrees.'),
      mcq(2, 'The interior angles of a hexagon (6 sides) sum to:', ['720 degrees', '1080 degrees', '540 degrees', '360 degrees'], 0, '(n-2)*180 = 4*180 = 720 degrees.'),
      mcq(3, 'Why do programming language trig functions use radians?', [
        'Because with radians the calculus identities are exact, with no scaling constant',
        'Because radians are easier for humans to read',
        'Because degrees cannot represent angles above 360',
        'Because radians use less memory',
      ], 0, 'd/dx sin(x) = cos(x) only when x is in radians. In degrees an extra pi/180 factor appears everywhere.'),
      mcq(3, 'You pass 45 (meaning degrees) directly into cos() in Python. What happens?', [
        'You get cos(45 radians) = 0.5253, not the 0.7071 you expected',
        'Python converts it automatically',
        'It raises an error',
        'You get 0.7071 as intended',
      ], 0, 'cos(45 rad) is about 0.525. The bug is silent, which is what makes it dangerous.'),
    ],
    skills: ['math-angles'],
  }),

  lesson({
    id: 'math-14',
    subject: 'math',
    order: 14,
    title: 'Triangles and the Pythagorean Theorem',
    difficulty: 'intermediate',
    minutes: 40,
    prereqs: ['math-13', 'math-10'],
    description: 'Triangle classification, congruence and similarity, and Pythagoras in two and three dimensions.',
    why: 'Pythagoras is the distance function. Every "how far is the obstacle", "how long must this link be" and "what is the straight-line reach of this arm" question in robotics is a right-angled triangle. It is also the basis of vector magnitude, which is the next lesson.',
    objectives: [
      'Apply Pythagoras to find a missing side of a right-angled triangle',
      'Use the converse of Pythagoras to test whether a triangle is right-angled',
      'Extend Pythagoras to three dimensions and to distance between two points',
      'Use similarity to scale measurements between a model and a real part',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Pythagoras',
        formula: 'a^2 + b^2 = c^2   (c is the hypotenuse, the side opposite the right angle)',
        defines: [
          'c = sqrt(a^2 + b^2)',
          'a = sqrt(c^2 - b^2)',
          'In 3D: d = sqrt(x^2 + y^2 + z^2)',
          'Between two points: d = sqrt((x2-x1)^2 + (y2-y1)^2)',
        ],
      },
      {
        kind: 'text',
        heading: 'Triangle facts worth memorising',
        body: [
          'Any side of a triangle is shorter than the sum of the other two - the triangle inequality. This is why a two-link arm has a maximum reach: the links can only fully extend into a straight line.',
          'Congruent triangles are identical in size and shape (SSS, SAS, ASA, RHS tests). Similar triangles have the same shape but different size, with all lengths in the same ratio - which is the mathematical basis of scaling a prototype.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - arm reach',
        problem: 'A robot arm has an upper link of 200 mm and a forearm of 150 mm. What is the maximum horizontal reach, and what is the reach when the elbow is bent so the links are perpendicular?',
        solution: [
          'Fully extended: 200 + 150 = 350 mm (links collinear - the triangle inequality limit)',
          'Perpendicular: the end effector is sqrt(200^2 + 150^2) = sqrt(40000 + 22500) = sqrt(62500) = 250 mm from the shoulder',
        ],
        answer: '350 mm extended, 250 mm with a right-angled elbow',
      },
      {
        kind: 'example',
        heading: 'Worked example - 3D distance',
        problem: 'A drone moves from (0,0,0) to (3, 4, 12) metres. How far did it travel in a straight line?',
        solution: ['d = sqrt(3^2 + 4^2 + 12^2) = sqrt(9 + 16 + 144) = sqrt(169) = 13 m'],
        answer: '13 m',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Pythagorean triples',
        body: [
          '3-4-5, 5-12-13, 8-15-17 and any multiple of these give exact integer answers. They are useful for quickly sanity-checking a computation and for laying out a right angle on a workshop bench with a tape measure.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Pythagorean theorem', 'course', 'https://www.khanacademy.org/math/geometry/hs-geo-pythagorean-theorem', { author: 'Khan Academy', minutes: 240 }),
      R('Math Is Fun: Pythagorean Theorem', 'article', 'https://www.mathsisfun.com/pythagoras.html', { minutes: 15 }),
    ],
    exercises: [
      X('calculation', 'Find the hypotenuse: (a) legs 6 and 8  (b) legs 5 and 12  (c) legs 9 and 12', 8, { solution: '(a) 10  (b) 13  (c) 15' }),
      X('calculation', 'Find the missing leg: (a) hypotenuse 25, leg 7  (b) hypotenuse 10, leg 6', 8, { solution: '(a) sqrt(625-49) = 24  (b) sqrt(100-36) = 8' }),
      X('question', 'An obstacle-avoiding robot is 0.8 m from a wall along x and 0.6 m along y. Compute the direct distance. Then determine whether a 1.2 m long link can reach the wall point directly.', 10, { solution: 'd = sqrt(0.64+0.36) = 1.0 m. A 1.2 m link can reach it, with 0.2 m of slack - so the link must be bent or angled.' }),
    ],
    questions: [
      numeric(1, 'A right triangle has legs 9 cm and 12 cm. What is the hypotenuse?', 15, 'sqrt(81+144) = sqrt(225) = 15. This is a 3-4-5 triple scaled by 3.', { unit: 'cm' }),
      numeric(1, 'The hypotenuse is 13 and one leg is 5. What is the other leg?', 12, 'sqrt(169-25) = sqrt(144) = 12.'),
      mcq(2, 'A triangle has sides 7, 24 and 25. Is it right-angled?', ['Yes, because 49 + 576 = 625', 'No, because 25 is odd', 'Cannot be determined', 'Yes, because all triangles are right-angled'], 0, 'The converse of Pythagoras: if a^2 + b^2 = c^2 for the longest side, the triangle is right-angled. 7^2+24^2 = 49+576 = 625 = 25^2.'),
      numeric(3, 'What is the straight-line distance from (1, 2) to (4, 6)?', 5, 'sqrt(3^2 + 4^2) = sqrt(25) = 5.'),
      numeric(3, 'A point moves 2 m in x, 3 m in y and 6 m in z. What is the straight-line displacement in metres?', 7, 'sqrt(4+9+36) = sqrt(49) = 7 m.', { unit: 'm' }),
      mcq(3, 'A two-link arm has links of 200 mm and 150 mm. Its maximum reach is:', ['350 mm', '250 mm', '50 mm', 'Unlimited'], 0, 'Fully extended the links are collinear: 200 + 150. This is the triangle inequality becoming a hard physical limit.'),
      mcq(4, 'Two similar triangles have corresponding sides in the ratio 1:4. Their areas are in the ratio:', ['1:4', '1:16', '1:8', '1:2'], 1, 'Area scales with the square of the length ratio: 4^2 = 16.'),
    ],
    skills: ['math-pythagoras'],
  }),

  lesson({
    id: 'math-15',
    subject: 'math',
    order: 15,
    title: 'Trigonometry: Sine, Cosine and Tangent',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['math-14'],
    description: 'SOH CAH TOA, inverse trig functions, the unit circle, and resolving quantities into components.',
    why: 'Trigonometry is how you turn "the arm is at 30 degrees" into "the end effector is at x = 0.43, y = 0.25". Forward and inverse kinematics - the heart of robot arm control - are trigonometry with extra bookkeeping. There is no way around this lesson.',
    objectives: [
      'Use sine, cosine and tangent to find missing sides and angles in right-angled triangles',
      'Use inverse trig functions (asin, acos, atan, atan2) to recover an angle from a ratio',
      'Read coordinates and signs from the unit circle, and understand periodicity',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'SOH CAH TOA',
        formula: 'sin(A) = opposite/hypotenuse      cos(A) = adjacent/hypotenuse      tan(A) = opposite/adjacent',
        defines: [
          'Inverse: A = asin(opp/hyp) = acos(adj/hyp) = atan(opp/adj)',
          'Identity: sin^2(A) + cos^2(A) = 1',
          'tan(A) = sin(A)/cos(A), undefined at 90 and 270 degrees',
        ],
      },
      {
        kind: 'table',
        heading: 'Unit circle - signs by quadrant',
        columns: ['Quadrant', 'Angle range', 'sin', 'cos', 'tan'],
        rows: [
          ['I', '0 to 90 deg', '+', '+', '+'],
          ['II', '90 to 180 deg', '+', '-', '-'],
          ['III', '180 to 270 deg', '-', '-', '+'],
          ['IV', '270 to 360 deg', '-', '+', '-'],
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - end effector position',
        problem: 'A single-link arm of length 0.4 m is raised 30 degrees above horizontal. Where is the end effector?',
        solution: [
          'x = L * cos(30 deg) = 0.4 * 0.8660 = 0.3464 m',
          'y = L * sin(30 deg) = 0.4 * 0.5 = 0.2 m',
          'Check: sqrt(0.3464^2 + 0.2^2) = sqrt(0.12 + 0.04) = 0.4 m, which matches the link length',
        ],
        answer: 'x = 0.346 m, y = 0.200 m',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Use atan2, not atan',
        body: [
          'atan(y/x) loses the sign information of x and y, so it can only return angles in a 180-degree range - it cannot tell (1,1) from (-1,-1). atan2(y, x) uses both arguments and returns the correct angle over the full 360-degree range. In robot code, atan2 is almost always what you want. Note the argument order: atan2(y, x), not atan2(x, y).',
        ],
      },
      {
        kind: 'text',
        heading: 'Periodicity and range limits',
        body: [
          'sin and cos repeat every 360 degrees (2*pi rad) and are bounded between -1 and +1. That bound is a free sanity check: if your code computes sin of something and gets 1.4, the bug is upstream.',
          'asin and acos only accept inputs in [-1, 1] and return a value in [-90, 90] and [0, 180] respectively. In inverse kinematics, an out-of-range asin means the target is physically unreachable - which is a real answer, not an error to hide.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Trigonometry', 'course', 'https://www.khanacademy.org/math/trigonometry', { author: 'Khan Academy', minutes: 600 }),
      R('BetterExplained: Intuitive Trigonometry', 'article', 'https://betterexplained.com/articles/intuitive-trigonometry/', { minutes: 25, note: 'Builds the intuition before the formulas. Worth the time.' }),
      R('Math Is Fun: Unit Circle', 'article', 'https://www.mathsisfun.com/geometry/unit-circle.html', { minutes: 15 }),
    ],
    exercises: [
      X('calculation', 'A right triangle has hypotenuse 10 and an angle of 36.87 degrees. Find the opposite and adjacent sides.', 10, { solution: 'opp = 10*sin(36.87) = 6, adj = 10*cos(36.87) = 8. (A 6-8-10 triangle.)' }),
      X('calculation', 'Find the angle A when: (a) opp = 3, hyp = 5  (b) adj = 8, hyp = 10  (c) opp = 1, adj = 1', 10, { solution: '(a) asin(0.6) = 36.87 deg  (b) acos(0.8) = 36.87 deg  (c) atan(1) = 45 deg' }),
      X('code', 'Write a function `arm_position(length_m, angle_deg)` returning (x, y). Test it at 0, 30, 90 and 180 degrees, and verify that sqrt(x^2+y^2) always equals the link length.', 15, {
        solution: 'Convert degrees to radians, then x = L*cos(rad), y = L*sin(rad). At 0: (L, 0). At 30: (0.866L, 0.5L). At 90: (0, L). At 180: (-L, 0). The magnitude check should return L every time - if it does not, you mixed up degrees and radians.',
      }),
    ],
    questions: [
      numeric(1, 'In a right triangle with hypotenuse 20 and angle 30 degrees, what is the length of the side opposite that angle?', 10, 'opp = 20 * sin(30) = 20 * 0.5 = 10.'),
      mcq(1, 'tan(A) is equal to:', ['sin(A)/cos(A)', 'cos(A)/sin(A)', 'sin(A)*cos(A)', '1/sin(A)'], 0, 'Opposite/adjacent = (opp/hyp) / (adj/hyp) = sin/cos.'),
      numeric(2, 'What angle (in degrees) satisfies asin(0.5)?', 30, 'sin(30 deg) = 0.5, and asin returns the principal value 30 degrees.'),
      mcq(2, 'In which quadrant are sin positive and cos negative?', ['I', 'II', 'III', 'IV'], 1, 'Quadrant II spans 90 to 180 degrees, where y is positive and x is negative.'),
      mcq(2, 'Why should robot code use atan2(y, x) instead of atan(y/x)?', [
        'atan2 resolves the correct quadrant over the full 360 degrees and handles x = 0',
        'atan2 is faster',
        'atan cannot take negative arguments',
        'They are identical',
      ], 0, 'atan(y/x) collapses opposite quadrants and divides by zero when x = 0. atan2 uses both signs.'),
      numeric(3, 'A 0.5 m link is at 60 degrees above horizontal. What is the y coordinate of its end? (3 dp)', 0.433, 'y = 0.5 * sin(60) = 0.5 * 0.866 = 0.433 m.', { unit: 'm' }),
      mcq(3, 'sin and cos are bounded between -1 and 1. What engineering use does that have?', [
        'It gives a free sanity check: a computed value outside that range means an upstream error',
        'It means angles cannot exceed 90 degrees',
        'It means trigonometry is only valid for small angles',
        'It has no practical use',
      ], 0, 'Bounds are assertions you get for free. Use them.'),
    ],
    skills: ['math-trigonometry'],
  }),

  lesson({
    id: 'math-16',
    subject: 'math',
    order: 16,
    title: 'Vectors and Components',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['math-15', 'math-11'],
    description: 'Vectors as magnitude plus direction, component form, addition, scalar product and vector magnitude.',
    why: 'Force, velocity, acceleration, position and torque are all vectors. A robot\'s state is a vector. Sensor fusion is vector arithmetic. This lesson is the last piece of the Foundation maths chain before kinematics, dynamics and control pick it up.',
    objectives: [
      'Represent a vector in component form and convert between magnitude/direction and components',
      'Add and subtract vectors graphically and algebraically, and scale them',
      'Compute a vector magnitude and the dot product, and explain what each means physically',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'A scalar has size; a vector has size and direction',
        body: [
          'Speed is a scalar; velocity is a vector. Distance is a scalar; displacement is a vector. Mass is a scalar; force is a vector. The distinction is not pedantry - it changes how you are allowed to combine quantities.',
          'Vectors add tip-to-tail. Two forces of 10 N each do not necessarily produce 20 N; if they oppose each other they produce zero. This is why you cannot simply add magnitudes.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Components and operations',
        formula: 'v = (vx, vy) with vx = |v| cos(A), vy = |v| sin(A)      |v| = sqrt(vx^2 + vy^2)      A = atan2(vy, vx)',
        defines: [
          'Addition: (a1,a2) + (b1,b2) = (a1+b1, a2+b2)',
          'Scalar multiple: k * (a1,a2) = (k*a1, k*a2)',
          'Dot product: a . b = a1*b1 + a2*b2 = |a||b| cos(theta)',
          'Unit vector: v / |v|',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - resolving a force',
        problem: 'A 50 N force pulls a robot along a rope at 30 degrees above horizontal. What are the horizontal and vertical components?',
        solution: [
          'Fx = 50 * cos(30) = 50 * 0.866 = 43.3 N (moves it forward)',
          'Fy = 50 * sin(30) = 50 * 0.5 = 25.0 N (lifts it, reducing normal force and therefore friction)',
          'Check: sqrt(43.3^2 + 25^2) = sqrt(1875 + 625) = 50 N',
        ],
        answer: 'Fx = 43.3 N, Fy = 25.0 N',
      },
      {
        kind: 'example',
        heading: 'Worked example - dot product meaning',
        problem: 'A robot moves with velocity v = (2, 1) m/s while a force F = (3, -1) N acts on it. What is the instantaneous power delivered?',
        solution: [
          'P = F . v = 3*2 + (-1)*1 = 6 - 1 = 5 W',
          'Because the dot product picks out only the part of the force acting along the motion',
        ],
        answer: '5 W',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Where this goes next',
        body: [
          'Adding a third component gives 3D vectors, which describe every position and force in a real robot. Rotating a vector is a matrix multiply, which is the Linear Algebra lesson. Chaining rotations through joints is forward kinematics. Solving for the joint angles that produce a desired vector is inverse kinematics. You are now on that path.',
        ],
      },
    ],
    resources: [
      R('Khan Academy: Vectors', 'course', 'https://www.khanacademy.org/math/precalculus/x9e81a4f98389efdf:vectors', { author: 'Khan Academy', minutes: 300 }),
      R('3Blue1Brown: Essence of Linear Algebra', 'video', 'https://www.3blue1brown.com/topics/linear-algebra', { author: 'Grant Sanderson', minutes: 180, note: 'Watch chapters 1-3 now; the rest pays off in the Advanced Mathematics subject.' }),
      R('PhET: Vector Addition', 'simulator', 'https://phet.colorado.edu/en/simulations/vector-addition', { author: 'University of Colorado Boulder', minutes: 20 }),
    ],
    exercises: [
      X('calculation', 'Convert to component form (2 dp): (a) 10 units at 25 degrees  (b) 5 units at 120 degrees  (c) 8 units at -60 degrees', 12, { solution: '(a) (9.06, 4.23)  (b) (-2.5, 4.33)  (c) (4, -6.93)' }),
      X('calculation', 'Given a = (3, -4) and b = (1, 2), find: (a) a + b  (b) 2a - b  (c) |a|  (d) a . b', 12, { solution: '(a) (4, -2)  (b) (5, -10)  (c) sqrt(9+16) = 5  (d) 3*1 + (-4)*2 = -5' }),
      X('code', 'Write a function that takes a list of (magnitude, angle_deg) force vectors and returns the resultant magnitude and direction. Verify with two equal 10 N forces 120 degrees apart - the resultant should be 10 N.', 20, {
        solution: 'Resolve each to components, sum the components, then take magnitude = sqrt(sx^2+sy^2) and direction = atan2(sy, sx). Two 10 N forces 120 degrees apart give a 10 N resultant, which is a good test because the naive answer (20 N) is wrong.',
      }),
    ],
    questions: [
      mcq(1, 'A vector of magnitude 12 at 60 degrees has components:', ['(6, 10.39)', '(10.39, 6)', '(12, 60)', '(6, 6)'], 0, 'x = 12*cos(60) = 6, y = 12*sin(60) = 10.39.'),
      numeric(1, 'What is the magnitude of the vector (3, 4)?', 5, 'sqrt(9 + 16) = sqrt(25) = 5.', { unit: '' }),
      mcq(2, 'Adding vectors a = (2, 5) and b = (-1, 3) gives:', ['(1, 8)', '(3, 2)', '(-2, 15)', '(1, 2)'], 0, 'Add component-wise: (2-1, 5+3) = (1, 8).'),
      mcq(2, 'Two forces of 10 N each act in exactly opposite directions. The resultant is:', ['0 N', '20 N', '10 N', '14.1 N'], 0, 'Equal magnitudes in opposite directions cancel. Adding magnitudes would wrongly give 20 N.'),
      numeric(3, 'What is the dot product of (2, 3) and (4, -1)?', 5, '2*4 + 3*(-1) = 8 - 3 = 5.'),
      mcq(3, 'A dot product of zero between two non-zero vectors means:', ['They are perpendicular', 'They are parallel', 'They are equal', 'One is a unit vector'], 0, 'a . b = |a||b| cos(theta) = 0 implies cos(theta) = 0, so theta = 90 degrees.'),
      mcq(3, 'The unit vector in the direction of (3, 4) is:', ['(0.6, 0.8)', '(3, 4)', '(1, 1)', '(0.5, 0.5)'], 0, 'Divide by the magnitude 5: (3/5, 4/5) = (0.6, 0.8). A unit vector has magnitude exactly 1.'),
    ],
    skills: ['math-vectors'],
  }),
];
