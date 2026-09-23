import { R, X, lesson, mcq, numeric } from './helpers';
import type { Lesson } from '@/lib/types';

/**
 * FOUNDATION / Materials & Structures.
 *
 * The bridge between physics and mechanical design: what things are made of,
 * how they deform, how load travels through them, and how they fail.
 */
export const MATERIALS_LESSONS: Lesson[] = [
  lesson({
    id: 'mat-01',
    subject: 'materials',
    order: 1,
    title: 'Materials and Their Properties',
    difficulty: 'beginner',
    minutes: 40,
    prereqs: ['phys-01'],
    description: 'Metals, polymers and composites; density, strength, stiffness, toughness and how to choose between them.',
    why: 'Choosing a material is a trade between strength, stiffness, mass, cost and manufacturability. Choosing badly is why hobby robots are heavy and fragile. Knowing the numbers lets you make that trade deliberately instead of by habit.',
    objectives: [
      'Compare the main material families used in small robotics by density, strength and stiffness',
      'Distinguish strength from stiffness from toughness, and give an example where they diverge',
      'Select a material for a stated application using specific strength and specific stiffness',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Typical properties (order-of-magnitude values - always check a datasheet)',
        columns: ['Material', 'Density kg/m^3', 'Yield/tensile MPa', "Young's modulus GPa", 'Notes'],
        rows: [
          ['PLA (3D printed)', '1240', '35-50', '3.5', 'Cheap, stiff-ish, brittle, softens near 55 C'],
          ['PETG (3D printed)', '1270', '50', '2.1', 'Tougher than PLA, better impact'],
          ['ABS (3D printed)', '1040', '40', '2.3', 'Tough, needs an enclosure to print without warping'],
          ['Aluminium 6061-T6', '2700', '276', '69', 'The default robot metal: light, strong, machinable'],
          ['Steel (mild)', '7850', '250', '200', 'Stiff and cheap, but 2.9x the density of aluminium'],
          ['Stainless 304', '8000', '215', '193', 'Corrosion resistant, work hardens, hard to machine'],
          ['Carbon fibre (epoxy, UD)', '1600', '600+', '70-200', 'Exceptional specific strength, anisotropic, expensive'],
          ['Titanium Ti-6Al-4V', '4430', '880', '114', 'Excellent specific strength, very expensive, hard to machine'],
        ],
      },
      {
        kind: 'text',
        heading: 'Four properties that are constantly confused',
        body: [
          'Strength is how much stress a material takes before it yields (permanent deformation) or breaks. Stiffness is how much it resists elastic deformation - Young\'s modulus. Toughness is how much energy it absorbs before fracturing. Hardness is resistance to surface indentation.',
          'Glass is stiff and strong in compression but has almost no toughness - it stores energy and releases it as a crack. Rubber is tough but not stiff or strong. Steel is all three. Chalk is stiff-ish and strong-ish but not tough. When a part fails you must ask which property was insufficient, because the fix is different for each.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Specific properties',
        formula: 'specific strength = yield strength / density      specific stiffness = E / density',
        defines: [
          'These are the numbers that matter when mass is a constraint - which it always is in a mobile robot',
          'Aluminium 6061: 276/2700 = 0.102 MPa per kg/m^3',
          'Mild steel: 250/7850 = 0.032 - about one third of aluminium, which is why steel frames are heavy',
          'Carbon fibre is an order of magnitude better again, and costs an order of magnitude more',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Printed plastic is not isotropic',
        body: [
          'FDM printed parts are strong along the filament direction and weak between layers - layer adhesion is often 50-60% of the bulk strength. A bracket printed in the wrong orientation can fail at half its datasheet stress. Orient prints so the primary load runs along the filament paths, not across the layer boundaries.',
        ],
      },
    ],
    resources: [
      R('MIT OpenCourseWare 3.032: Mechanical Behavior of Materials', 'course', 'https://ocw.mit.edu/courses/3-032-mechanical-behavior-of-materials-fall-2007/', { author: 'MIT', minutes: 1200, note: 'Free lecture notes and assignments.' }),
      R('MatWeb material property database', 'tool', 'https://www.matweb.com/', { minutes: 30, note: 'Free searchable datasheets. Always check the actual grade you are buying.' }),
      R('Engineering Materials - an introduction', 'article', 'https://en.wikipedia.org/wiki/Materials_science', { minutes: 30 }),
    ],
    exercises: [
      X('calculation', 'Compute the specific strength (yield/density, in MPa per kg/m^3) for PLA (40 MPa), aluminium 6061-T6 (276 MPa) and mild steel (250 MPa). Rank them for a weight-critical part.', 12, { solution: 'PLA 40/1240 = 0.0323; aluminium 276/2700 = 0.102; steel 250/7850 = 0.0318. Aluminium wins by roughly 3x; PLA and mild steel are similar on specific strength, though PLA is far weaker in absolute terms.' }),
      X('question', 'A chassis plate must be as stiff as possible at minimum mass, and cost is secondary. Choose between 3 mm aluminium, 3 mm steel and 8 mm PLA, justifying with specific stiffness. Then state one non-mechanical reason to still pick PLA.', 15, { solution: 'Specific stiffness E/rho: aluminium 69/2700 = 0.0256; steel 200/7850 = 0.0255; PLA 3.5/1240 = 0.0028. Aluminium and steel are nearly identical per unit mass (bending stiffness also depends on thickness cubed, so the 8 mm PLA is thicker but still far behind). Aluminium is the choice. PLA still wins on iteration speed and tooling cost - you can print a revision in an hour with no machine shop.' }),
      X('measurement', 'Weigh two candidate materials for a part of known volume and compute their densities. Compare against the table values and identify any that differ significantly.', 20, { solution: 'Density = mass/volume. Printed parts are usually 5-15% below solid density because of infill and porosity - which also reduces their strength below datasheet values.' }),
    ],
    questions: [
      mcq(1, 'Which material family has the best specific strength of those listed?', ['Carbon fibre composite', 'Mild steel', 'PLA', 'Stainless steel'], 0, 'Around 600 MPa at 1600 kg/m^3 gives roughly 0.375 - several times aluminium.'),
      mcq(1, 'Stiffness is measured by:', ["Young's modulus", 'Yield strength', 'Toughness', 'Hardness'], 0, 'Resistance to elastic deformation. Strength is resistance to permanent deformation or fracture.'),
      mcq(2, 'A material that is stiff and strong but shatters with little deformation is:', ['Low toughness', 'Low stiffness', 'Low strength', 'Ductile'], 0, 'Glass and ceramics behave this way. Toughness is the energy absorbed before fracture.'),
      numeric(2, 'Compute the specific strength of aluminium 6061-T6 (yield 276 MPa, density 2700 kg/m^3), to 3 decimal places.', 0.102, '276/2700 = 0.1022.'),
      mcq(2, 'Why is mild steel a poor choice for a weight-critical mobile robot frame?', [
        'Its specific strength is about one third of aluminium 6061 because it is nearly three times denser at similar yield strength',
        'Steel is weaker than aluminium',
        'Steel cannot be welded',
        'Steel is too expensive',
      ], 0, '250/7850 = 0.032 versus 276/2700 = 0.102. Steel is fine for stationary structures and for high-wear parts.'),
      mcq(3, 'An FDM printed bracket fails at half its datasheet strength. The most likely cause is:', [
        'The load was applied across the layer boundaries rather than along the filament',
        'The material was PLA',
        'The infill was too high',
        'Printed parts never reach datasheet strength',
      ], 0, 'Printed parts are anisotropic. Orientation is a design decision, not a printing detail.'),
      mcq(3, 'PLA softens around 55 C. What engineering consequence does that have?', [
        'A PLA part left in a car or near a hot motor driver can deform under load it normally handles',
        'PLA cannot be used at all',
        'PLA becomes stronger when warm',
        'It only affects the print process',
      ], 0, 'Glass transition temperature is a hard design limit. Use PETG, ABS or metal near heat sources.'),
    ],
    skills: ['mat-selection'],
  }),

  lesson({
    id: 'mat-02',
    subject: 'materials',
    order: 2,
    title: 'Stress, Strain and Young\u2019s Modulus',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['phys-06', 'math-12', 'mat-01'],
    description: 'Normal stress, engineering strain, the stress-strain curve, elastic versus plastic behaviour and deflection of simple beams.',
    why: 'This is how you answer "will this bracket bend or break?" quantitatively. It is also how you size a flexure, predict how much an arm droops under its own motor, and understand why a thicker section is dramatically stiffer than a wider one.',
    objectives: [
      'Compute normal stress and strain from load, area, extension and original length',
      'Interpret a stress-strain curve: elastic region, yield, plastic region and fracture',
      'Compute the deflection of a simple cantilever and explain the effect of section geometry',
    ],
    learn: [
      {
        kind: 'formula',
        heading: 'Stress, strain and Hooke\u2019s law',
        formula: 'stress = F / A      strain = extension / original length      stress = E * strain (elastic region only)      extension = F L / (A E)',
        defines: [
          'Stress in Pa (N/m^2) or conveniently N/mm^2 = MPa',
          'Strain is dimensionless, often quoted in microstrain or percent',
          'Hooke\u2019s law holds only below the yield point - beyond it the material deforms permanently',
        ],
      },
      {
        kind: 'text',
        heading: 'Reading the stress-strain curve',
        body: [
          'From zero load the curve is a straight line: elastic behaviour, and the slope is Young\'s modulus. Fully unload here and the part returns exactly to its original shape. At the yield point the curve bends over - permanent deformation begins. For ductile metals it continues rising to the ultimate tensile strength as the material work-hardens, then falls as it necks and finally fractures.',
          'Brittle materials (chalk, glass, unfilled PLA along layer lines, cast iron) show almost no plastic region: they behave elastically and then fracture suddenly with no warning. Ductile materials deform visibly first, which is why structural designs prefer ductile failure - it gives you a chance to notice.',
        ],
      },
      {
        kind: 'formula',
        heading: 'Second moment of area - why thickness wins',
        formula: 'rectangular section: I = b h^3 / 12      cantilever tip deflection: delta = F L^3 / (3 E I)',
        defines: [
          'Stiffness scales with the CUBE of the thickness (h) but only linearly with width (b)',
          'Doubling thickness makes a beam 8 times stiffer; doubling width makes it 2 times stiffer',
          'Deflection also scales with the CUBE of the length - halving a cantilever length makes it 8 times stiffer',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - arm droop',
        problem: 'A printed PLA arm link is a cantilever 200 mm long with a rectangular section 20 mm wide and 4 mm thick (E = 3.5 GPa). A 2 N motor hangs at the tip. How far does the tip deflect?',
        solution: [
          'I = b h^3 / 12 = 20 * 4^3 / 12 = 20 * 64 / 12 = 106.7 mm^4',
          'delta = F L^3 / (3 E I) = 2 * 200^3 / (3 * 3500 * 106.7)',
          '= 2 * 8,000,000 / 1,120,350 = 14.28 mm',
          'That is 7% of the arm length - far too much for any positioning task',
          'Doubling the thickness to 8 mm: I increases 8-fold to 853 mm^4 and deflection falls to 1.79 mm',
        ],
        answer: '14.3 mm at 4 mm thick; 1.8 mm at 8 mm thick - the cube law in action',
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Creep: printed plastic keeps bending',
        body: [
          'Polymers deform slowly under sustained load even well below their yield strength - this is creep. A PLA bracket holding a motor may be fine for an hour and visibly sagged after a week, particularly when warm. For permanently loaded printed parts, design for creep: over-size the section, add ribs, or use metal. This is a real failure mode in hobby robots and almost never mentioned in tutorials.',
        ],
      },
    ],
    resources: [
      R('Engineering Mechanics: stress and strain', 'article', 'https://en.wikipedia.org/wiki/Stress%E2%80%93strain_curve', { minutes: 30 }),
      R('MIT OpenCourseWare 2.001: Mechanics and Materials I', 'course', 'https://ocw.mit.edu/courses/2-001-mechanics-and-materials-i-fall-2006/', { author: 'MIT', minutes: 1500, note: 'Free notes and problem sets - the proper treatment of beam deflection.' }),
      R('Deflection of beams (formula table)', 'docs', 'https://en.wikipedia.org/wiki/Deflection_of_beams', { minutes: 30 }),
    ],
    exercises: [
      X('calculation', 'A 500 N load acts on a rod of cross-section 25 mm^2 and length 300 mm (E = 200 GPa). Compute stress, strain and extension.', 12, { solution: 'stress = 500/25 = 20 MPa. strain = 20e6/200e9 = 1e-4. extension = 1e-4 * 300 = 0.03 mm.' }),
      X('calculation', 'A cantilever has L = 150 mm, b = 15 mm, h = 5 mm, E = 69 GPa (aluminium), tip load 3 N. Compute I and the tip deflection. Then recompute with h = 10 mm.', 15, { solution: 'I = 15*125/12 = 156.25 mm^4. delta = 3*150^3/(3*69000*156.25) = 10,125,000/32,296,875 = 0.313 mm. With h = 10: I = 1250 mm^4, delta = 0.039 mm - 8 times stiffer.' }),
      X('question', 'Explain, using the stress-strain curve, why a ductile aluminium part is safer in a robot that may be dropped than a brittle unfilled printed part of the same strength.', 10, { solution: 'The ductile part yields and deforms visibly, absorbing impact energy over a large strain range and warning the user before fracture. The brittle part stores elastic energy and fractures suddenly with no warning and no energy absorption - and shards. Toughness (area under the curve) is the relevant property for impact, not strength.' }),
    ],
    questions: [
      numeric(1, 'A 200 N force acts on a 40 mm^2 cross-section. What is the stress in MPa?', 5, '200/40 = 5 N/mm^2 = 5 MPa.', { unit: 'MPa' }),
      mcq(1, 'Strain is:', ['Extension divided by original length, dimensionless', 'Force divided by area', 'Stress times modulus', 'Measured in pascals'], 0, 'A ratio of lengths, so it has no units.'),
      mcq(2, "The slope of the elastic region of a stress-strain curve is:", ["Young's modulus", 'Yield strength', 'Ultimate strength', 'Toughness'], 0, 'A steeper slope means a stiffer material, not necessarily a stronger one.'),
      mcq(2, 'Loading a ductile metal beyond its yield point causes:', ['Permanent deformation', 'Immediate fracture', 'No change', 'Increased stiffness'], 0, 'It deforms plastically and does not fully recover on unloading.'),
      mcq(2, 'A brittle material is characterised by:', ['Fracture with little plastic deformation', 'Large plastic deformation before fracture', 'Low stiffness', 'High toughness'], 0, 'It fails suddenly - which is why structural design usually prefers a ductile failure mode.'),
      mcq(3, 'Doubling the thickness of a rectangular cantilever beam makes it:', ['8 times stiffer', '2 times stiffer', '4 times stiffer', '16 times stiffer'], 0, 'I = bh^3/12, so stiffness scales with h^3. This is the single most useful structural design fact.'),
      numeric(3, 'I = b h^3/12 for b = 12 mm and h = 6 mm. What is I in mm^4?', 216, '12 * 216 / 12 = 216 mm^4.', { unit: 'mm^4' }),
      mcq(3, 'Creep is:', ['Slow continued deformation under sustained load below the yield point', 'Sudden fracture under impact', 'Deformation during printing', 'Elastic recovery over time'], 0, 'Especially significant in polymers at raised temperature - a real failure mode for permanently loaded printed parts.'),
    ],
    skills: ['mat-stress-strain'],
  }),

  lesson({
    id: 'mat-03',
    subject: 'materials',
    order: 3,
    title: 'Structures, Load Paths and Joints',
    difficulty: 'intermediate',
    minutes: 40,
    prereqs: ['mat-02'],
    description: 'How load travels through a structure, tension versus compression members, and why joints are the weak point.',
    why: 'Most robot failures happen at joints and mounting points, not in the middle of members. Understanding load paths tells you where to add material, where to add ribs, and why a bolted joint in a printed part needs an insert rather than a self-tapping screw.',
    objectives: [
      'Trace a load path from the point of application to the reaction and identify the critical section',
      'Distinguish tension, compression, bending and shear loading and their failure modes',
      'Evaluate a joint design and explain why fasteners in printed plastic need special treatment',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Load follows the stiffest path',
        body: [
          'Load flows from where it is applied to where it is reacted, preferring the stiffest route. If you imagine the structure as a network of springs, the stiffest branches carry most of the load. A sudden change of section, a hole or a sharp corner interrupts that flow and concentrates stress locally.',
          'Stress concentration is quantified by a factor Kt: at a sharp internal corner Kt can be 3 or more, meaning the local stress is three times the nominal. That is why fillets and radii are not cosmetic - a 2 mm fillet at an internal corner can double the fatigue life of a bracket. Sharp internal corners are also where 3D prints crack first.',
        ],
      },
      {
        kind: 'table',
        heading: 'Loading modes and their failure signatures',
        columns: ['Mode', 'Typical failure', 'Design response'],
        rows: [
          ['Tension', 'Necking then fracture; net section reduced by holes', 'Add cross-section, avoid holes in the loaded path'],
          ['Compression', 'Buckling before yielding in slender members', 'Increase second moment of area, add bracing, shorten the member'],
          ['Bending', 'Yield on the outer fibres, deflection limits function', 'Increase thickness (cube law), add ribs, shorten the span'],
          ['Shear', 'Sliding failure at fasteners and short beams', 'Check bolt shear area, avoid single-lap joints where possible'],
          ['Torsion', 'Angular twist, shear failure on the surface', 'Use closed sections (tubes) - far stiffer than open ones'],
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - why a tube beats a solid bar',
        problem: 'Compare the torsional stiffness of a solid 10 mm diameter bar with a 12 mm outer diameter, 1 mm wall tube of the same material. Which is stiffer per unit mass?',
        solution: [
          'Polar second moment for a solid shaft: J = pi d^4 / 32 = pi * 10000 / 32 = 982 mm^4',
          'For a tube: J = pi (d_o^4 - d_i^4)/32 = pi (20736 - 10000)/32 = 1053 mm^4',
          'Cross-sectional areas: solid 78.5 mm^2, tube 34.6 mm^2',
          'The tube has slightly more torsional stiffness at 44% of the mass',
        ],
        answer: 'The tube - because material far from the centre does most of the torsional work',
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Joints are the design, not an afterthought',
        body: [
          'In printed plastic, a self-tapping screw cuts its own thread and will strip after a few assemblies. Use heat-set threaded inserts, or design for a bolt and nut with a washer spreading the load. Never put a screw in a thin wall without a boss. In metal, a bolted joint relies on clamp force and friction, not on the bolt bearing against the hole - which is why overtightening and under-tightening both cause failure, and why thread locker exists.',
        ],
      },
    ],
    resources: [
      R('Structural loading and stress concentration', 'article', 'https://en.wikipedia.org/wiki/Stress_concentration', { minutes: 25 }),
      R('Buckling', 'docs', 'https://en.wikipedia.org/wiki/Buckling', { minutes: 25 }),
      R('MIT OpenCourseWare 2.002: Mechanics and Materials II', 'course', 'https://ocw.mit.edu/courses/2-002-mechanics-and-materials-ii-spring-2004/', { author: 'MIT', minutes: 1200 }),
    ],
    exercises: [
      X('question', 'Trace the load path for a motor mounted on a printed bracket bolted to a chassis plate. Identify each interface, the loading mode at each, and the most likely failure point.', 20, { solution: 'Motor mass and torque -> motor mount faces (shear on the screws, bearing on the print) -> bracket wall (bending) -> bracket-to-chassis bolts (shear plus pull-out tension on the printed bosses) -> chassis plate (bending and local bearing). The most likely failure is the printed boss pulling out or cracking around the screw hole, because printed plastic has poor through-thickness strength and stress concentrates at the hole.' }),
      X('calculation', 'A slender compression member is 200 mm long with a 6 mm square section. Estimate its slenderness ratio (length divided by the least radius of gyration, r = sqrt(I/A)) and comment on buckling risk.', 15, { solution: 'I = 6^4/12 = 108 mm^4, A = 36 mm^2, r = sqrt(108/36) = 1.73 mm. Slenderness = 200/1.73 = 115. That is very slender - buckling will occur well below the material yield load, so the member must be braced or thickened.' }),
      X('calculation', 'A bracket has a nominal bending stress of 12 MPa at a section with a sharp internal corner (Kt = 2.8). What is the local peak stress, and what happens if a 3 mm fillet reduces Kt to 1.4?', 10, { solution: 'Peak 33.6 MPa - above PLA yield, so it deforms and eventually cracks. With the fillet: 16.8 MPa, which is inside the elastic range with margin. A fillet costs nothing and doubles the load capacity.' }),
    ],
    questions: [
      mcq(1, 'Load in a structure travels:', ['Along the stiffest available path from application to reaction', 'Evenly through all material', 'Along the shortest geometric path', 'Only through the outer surface'], 0, 'This is why removing material from a stiff path is safe and removing it from a compliant path is not.'),
      mcq(1, 'A sharp internal corner in a loaded bracket causes:', ['Stress concentration, raising local stress well above nominal', 'Reduced stress', 'No effect', 'Increased stiffness'], 0, 'Kt can exceed 3. A fillet is the standard fix and costs nothing in a printed or machined part.'),
      mcq(2, 'A slender column under compression typically fails by:', ['Buckling before the material yields', 'Tensile fracture', 'Shear at mid-height', 'Creep'], 0, 'Buckling load depends on the second moment of area and the length, not directly on material strength.'),
      mcq(2, 'For torsional stiffness at minimum mass, the best cross-section is:', ['A closed tube', 'A solid bar', 'An open channel', 'A flat plate'], 0, 'Material far from the centre carries most of the shear; a closed section uses it efficiently and resists warping.'),
      mcq(3, 'Why should a self-tapping screw be avoided in a repeatedly assembled printed joint?', [
        'It cuts its own thread and strips quickly; a heat-set insert preserves the joint',
        'Self-tapping screws are too strong for plastic',
        'They cannot be tightened with a screwdriver',
        'They cause the print to warp',
      ], 0, 'Printed threads also have poor strength across layer lines. Inserts transfer load into a larger volume of plastic.'),
      mcq(3, 'A bolted metal joint primarily transmits load by:', ['Friction between the clamped surfaces, created by bolt preload', 'The bolt bearing against the hole wall', 'Shear across the threads', 'Adhesion'], 0, 'Which is why correct preload matters and why loose joints fret and fatigue.'),
      numeric(3, 'Nominal stress 15 MPa with Kt = 2.2: what is the peak local stress in MPa?', 33, '15 * 2.2 = 33 MPa.', { unit: 'MPa' }),
    ],
    skills: ['mat-structures'],
  }),

  lesson({
    id: 'mat-04',
    subject: 'materials',
    order: 4,
    title: 'Safety Factors, Fatigue and Failure Modes',
    difficulty: 'intermediate',
    minutes: 40,
    prereqs: ['mat-02'],
    description: 'Choosing a safety factor, static versus fatigue loading, and analysing why a part actually failed.',
    why: 'A robot is a cyclically loaded machine. Parts that survive once often fail after a few thousand cycles, which is why designs that "looked fine" break after a week. This lesson is also the entry point to failure analysis, which is the fastest way to become a better mechanical designer.',
    objectives: [
      'Select and justify a safety factor for a given loading situation and consequence of failure',
      'Distinguish static, fatigue and impact loading and explain why fatigue dominates in machines',
      'Perform a basic failure analysis: identify the mode, the initiating feature and the corrective action',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Typical safety factors (static yield basis)',
        columns: ['Situation', 'Factor on yield', 'Reasoning'],
        rows: [
          ['Well understood load, ductile material, failure is inconvenient', '1.5 - 2', 'Standard mechanical practice'],
          ['Load estimated, printed plastic, failure stops the robot', '2.5 - 4', 'Anisotropy, creep and process variation'],
          ['Impact or shock loading present', '4 - 6', 'Dynamic loads far exceed static estimates'],
          ['Failure could injure a person', '6+, plus analysis and testing', 'Consequence-driven, not material-driven'],
          ['Brittle material', 'Higher, with a different basis', 'Use ultimate strength, not yield - there is no yield'],
        ],
      },
      {
        kind: 'text',
        heading: 'Fatigue: failure below the yield stress',
        body: [
          'Under repeated loading, a crack initiates at a stress concentration and grows a little each cycle until the remaining section cannot carry the load and fractures suddenly. The stress at failure can be far below the static yield strength - typically 30-50% of ultimate strength for steels at high cycle counts.',
          'The signature of fatigue is distinctive: a smooth, often burnished crack-propagation region with concentric "beach marks", followed by a rough region of final fast fracture. Recognising that appearance tells you immediately that the problem was cyclic loading and a stress raiser, not an overload.',
          'The fixes are the ones you already know: fillets to reduce Kt, compressive surface treatment, better material, shorter spans, and above all keeping the operating stress well below the endurance limit.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - safety factor on a printed bracket',
        problem: 'A PLA bracket (yield 40 MPa, but printed across layer lines so effective strength about 22 MPa) sees a nominal bending stress of 8 MPa with Kt = 2.0. Is it acceptable for a robot that will run 2 hours a day?',
        solution: [
          'Peak stress = 8 * 2.0 = 16 MPa',
          'Effective strength = 22 MPa',
          'Static safety factor = 22 / 16 = 1.4',
          'That is marginal for static loading and unacceptable for cyclic loading, where 16 MPa is around 73% of the effective strength and fatigue will initiate at the corner',
          'Corrective action: add a fillet (Kt to about 1.3, peak 10.4 MPa, factor 2.1) and increase thickness by 50% (bending stress falls by a factor of about 3.4 due to the cube law, giving a large margin)',
        ],
        answer: 'Not acceptable as designed. Fillet plus thicker section brings it to a comfortable margin.',
      },
      {
        kind: 'callout',
        tone: 'safety',
        heading: 'Consequence decides the factor',
        body: [
          'A safety factor is not a number you like the look of; it is a statement about uncertainty and consequence. Uncertainty in load, material, manufacturing and analysis pushes it up. Consequence of failure - a broken bracket versus a broken part near a person - pushes it up far more. Anything that can contact a human being needs a formal risk assessment, documented margins and testing, and the Systems Engineering track treats this properly.',
        ],
      },
    ],
    resources: [
      R('Fatigue (material)', 'docs', 'https://en.wikipedia.org/wiki/Fatigue_(material)', { minutes: 35 }),
      R('Factor of safety', 'article', 'https://en.wikipedia.org/wiki/Factor_of_safety', { minutes: 25 }),
      R('Fractography', 'article', 'https://en.wikipedia.org/wiki/Fractography', { minutes: 20, note: 'Learn what a fatigue surface looks like and you will diagnose failures much faster.' }),
    ],
    exercises: [
      X('calculation', 'A steel tie rod (yield 250 MPa) carries a steady 8 kN load with a 60 mm^2 net section. Compute the stress and the safety factor on yield. Is it adequate for a static application?', 12, { solution: 'stress = 8000/60 = 133 MPa. Factor = 250/133 = 1.88. Adequate for a well-understood static ductile application (target 1.5-2), but not for cyclic loading without a fatigue check.' }),
      X('question', 'A 3D printed gearbox mount cracked after two weeks at a sharp internal corner. Describe the failure mode, what evidence you would look for on the fracture surface, and three corrective actions in priority order.', 15, { solution: 'Fatigue initiated at the stress concentration. Evidence: smooth region with beach marks radiating from the corner, then a rough fast-fracture zone. Corrections in priority: (1) add a fillet to reduce Kt, (2) increase section thickness (cube-law stiffness gain), (3) reprint with the load along the filament direction, or move to PETG/metal for toughness. Reducing the load is a fourth option if the motor is over-torqued for the design.' }),
      X('calculation', 'A part sees a nominal stress of 20 MPa with Kt = 2.5 in a material with an endurance limit of 120 MPa. Estimate whether infinite life is expected and what factor of safety on fatigue you have.', 12, { solution: 'Peak alternating stress = 50 MPa. Factor on endurance limit = 120/50 = 2.4, which suggests infinite life is plausible - but only if the endurance limit quoted applies to the actual surface finish, size and mean stress. Surface finish alone can reduce it substantially, so verify rather than assume.' }),
    ],
    questions: [
      mcq(1, 'A safety factor is chosen primarily based on:', ['Uncertainty in load and material, and the consequence of failure', 'The designer\'s preference', 'Always exactly 2.0', 'The cost of the material'], 0, 'It is a statement about what you do not know and what happens if you are wrong.'),
      mcq(1, 'For a brittle material, a safety factor should be based on:', ['Ultimate strength, because there is no yield point', 'Yield strength', 'Endurance limit', 'Hardness'], 0, 'Brittle materials fracture without yielding, so yield strength is not defined or not meaningful.'),
      mcq(2, 'Fatigue failure occurs:', ['Below the static yield stress, after many load cycles', 'Only above the ultimate strength', 'Only under impact', 'Only in polymers'], 0, 'A crack initiates at a stress raiser and grows incrementally. This is the dominant failure mode in machines.'),
      mcq(2, 'A fracture surface with smooth beach marks and a rough final zone indicates:', ['Fatigue', 'Ductile overload', 'Brittle overload', 'Creep'], 0, 'Beach marks are the crack front position after each load block; the rough zone is the last fast fracture.'),
      mcq(3, 'Which single change most improves the fatigue life of a bracket with a sharp internal corner?', ['Adding a fillet to reduce the stress concentration factor', 'Using a stronger but more brittle material', 'Increasing the load slowly', 'Painting the surface'], 0, 'Kt drives crack initiation. Reducing it attacks the root cause; a stronger brittle material can make things worse.'),
      numeric(3, 'Yield strength 300 MPa, working stress 120 MPa. What is the safety factor on yield?', 2.5, '300/120 = 2.5.'),
      mcq(3, 'Why do printed plastic parts usually need a higher safety factor than machined aluminium?', [
        'Anisotropy, layer adhesion variation, creep and process sensitivity all add uncertainty',
        'Because plastic is always weaker',
        'Because printed parts cannot be measured',
        'They do not; the same factor applies',
      ], 0, 'More uncertainty means a higher factor. That is the entire logic of safety factors.'),
    ],
    skills: ['mat-safety-factors', 'mat-failure-analysis'],
  }),
];
