import type { Subject, SubjectId, Track, TrackId } from '@/lib/types';

/**
 * The roadmap: 12 tracks, ordered so that each one rests on the ones before it.
 *
 * `maturity` and `realityCheck` are not decoration. They are the mechanism by
 * which this app refuses to promise outcomes it cannot deliver - in particular
 * for humanoid and large-scale robotics, which are active research areas gated
 * by actuation, materials, power density, safety, funding and team capability.
 */
export const TRACKS: Track[] = [
  {
    id: 'foundation',
    code: 'FND',
    name: 'Foundation',
    order: 1,
    summary:
      'Mathematics, physics and materials. Everything downstream is applied math and applied physics; this track is where weak fundamentals get rebuilt properly.',
    maturity: 'core',
    realityCheck:
      'Fully learnable now with free resources. No hardware required. This is the track to finish before anything else feels easy.',
    subjectIds: ['math', 'math-advanced', 'physics', 'materials'],
  },
  {
    id: 'software',
    code: 'SWE',
    name: 'Software',
    order: 2,
    summary:
      'Programming fundamentals, Python, data structures and algorithms, Git, Linux, APIs, then C and C++ - the languages robotics actually runs on.',
    maturity: 'core',
    realityCheck:
      'Fully learnable now on any computer, including a low-end one. This is your existing L4 background extended into engineering-grade practice.',
    subjectIds: ['programming', 'python', 'ds-algo', 'tools', 'apis', 'c-cpp'],
  },
  {
    id: 'electronics',
    code: 'EE',
    name: 'Electronics',
    order: 3,
    summary:
      'Voltage, current, resistance, circuits, components and the digital interface between software and the physical world.',
    maturity: 'core',
    realityCheck:
      'Learnable with a simulator for free, and with about $20-40 of parts for real practice. Real measurement is where electronics stops being abstract.',
    subjectIds: ['electronics'],
  },
  {
    id: 'embedded',
    code: 'EMB',
    name: 'Embedded',
    order: 4,
    summary:
      'Microcontrollers, GPIO, UART, I2C, SPI, interrupts, timers, sensors and motor drivers - software that touches hardware in real time.',
    maturity: 'core',
    realityCheck:
      'Requires one inexpensive microcontroller board (Arduino-class or ESP32). Everything in this track is well documented and reproducible at home.',
    subjectIds: ['microcontrollers', 'embedded-systems'],
  },
  {
    id: 'mechanical',
    code: 'MECH',
    name: 'Mechanical',
    order: 5,
    summary:
      'Forces in real parts: materials, stress and strain, bearings, shafts, gears, linkages, fasteners, manufacturing, 3D printing and machining.',
    maturity: 'advanced',
    realityCheck:
      'Theory is free; practice needs tools, materials and workshop access. Expect to learn this alongside building physical projects, not before them.',
    subjectIds: ['mechanical'],
  },
  {
    id: 'cad',
    code: 'CAD',
    name: 'CAD',
    order: 6,
    summary:
      'Parametric modelling: sketches and constraints, 3D features, assemblies, motion, technical drawings and tolerances.',
    maturity: 'advanced',
    realityCheck:
      'Free professional tools exist (FreeCAD, Fusion 360 personal, Onshape free tier). CAD skill only comes from modelling real parts that get made.',
    subjectIds: ['cad'],
  },
  {
    id: 'control',
    code: 'CTL',
    name: 'Control',
    order: 7,
    summary:
      'Feedback, error, open and closed loop, PID, stability and trajectory generation - the theory that makes a robot behave rather than twitch.',
    maturity: 'advanced',
    realityCheck:
      'Learnable with free simulators and one small robot. Formal control theory needs the calculus from the Foundation track; practical PID needs a real plant.',
    subjectIds: ['control'],
  },
  {
    id: 'robotics',
    code: 'ROB',
    name: 'Robotics',
    order: 8,
    summary:
      'Sensors, actuators, encoders, kinematics, inverse kinematics, dynamics, path planning, simulation and ROS 2.',
    maturity: 'advanced',
    realityCheck:
      'This is a genuine engineering discipline with real, reachable milestones: an arm, a mobile robot, a simulated robot. It is not the end of the road.',
    subjectIds: ['robotics', 'ros2'],
  },
  {
    id: 'ai-robotics',
    code: 'AI',
    name: 'AI + Robotics',
    order: 9,
    summary:
      'Computer vision, OpenCV, machine learning, object detection, SLAM, navigation and AI-assisted robotic behaviour.',
    maturity: 'advanced',
    realityCheck:
      'Classical CV and SLAM are well within reach. Deep learning is learnable, but useful models need data, compute and iteration - not just a tutorial.',
    subjectIds: ['perception', 'navigation'],
  },
  {
    id: 'humanoid',
    code: 'HUM',
    name: 'Humanoid',
    order: 10,
    summary:
      'Balance, bipedal locomotion, joint control, centre of mass, walking, whole-body control, fall detection and humanoid simulation.',
    maturity: 'frontier',
    realityCheck:
      'Research frontier. Funded labs with custom actuators still struggle with robust bipedal walking. Simulation and small bipeds are achievable; a full-size walking humanoid is not a solo beginner outcome and is not promised here.',
    subjectIds: ['humanoid'],
  },
  {
    id: 'systems',
    code: 'SYS',
    name: 'Systems Engineering',
    order: 11,
    summary:
      'Requirements, architecture, interfaces, verification, failure analysis, safety, reliability and integration - the discipline that keeps large systems from collapsing under their own complexity.',
    maturity: 'core',
    realityCheck:
      'Learnable now and immediately useful on any project. Underrated: this is what separates people who finish robots from people who accumulate half-built ones.',
    subjectIds: ['systems'],
  },
  {
    id: 'large-robotics',
    code: 'LRG',
    name: 'Large Robotics',
    order: 12,
    summary:
      'Actuator scaling, structural scaling, power requirements, thermal management, materials, manufacturing and large robotic subsystems.',
    maturity: 'frontier',
    realityCheck:
      'Scaling is not free: mass grows faster than strength and energy storage does not scale with ambition. This track teaches the constraints, and it explicitly does not promise a buildable outcome at large scale.',
    subjectIds: ['large-robotics'],
  },
];

export const SUBJECTS: Subject[] = [
  {
    id: 'math',
    trackId: 'foundation',
    name: 'Mathematics',
    code: 'MATH',
    order: 1,
    description:
      'Arithmetic to vectors, rebuilt from the ground up. Every robotics equation you will ever use is assembled from these pieces.',
    prerequisites: [],
  },
  {
    id: 'math-advanced',
    trackId: 'foundation',
    name: 'Advanced Mathematics',
    code: 'MATH+',
    order: 2,
    description:
      'Calculus and linear algebra - the language of rates of change and of rotations, transforms and state-space control.',
    prerequisites: ['math'],
  },
  {
    id: 'physics',
    trackId: 'foundation',
    name: 'Physics',
    code: 'PHYS',
    order: 3,
    description:
      'Units, measurement, motion, forces, energy, power, torque, rotation and centre of mass. A robot is physics that has been taught to behave.',
    prerequisites: ['math'],
  },
  {
    id: 'materials',
    trackId: 'foundation',
    name: 'Materials & Structures',
    code: 'MAT',
    order: 4,
    description:
      'What things are made of, how they deform, how they fail, and why structures carry load the way they do.',
    prerequisites: ['physics'],
  },
  {
    id: 'programming',
    trackId: 'software',
    name: 'Programming Fundamentals',
    code: 'PROG',
    order: 1,
    description:
      'How programs actually work: state, control flow, functions, decomposition and debugging. Language-independent.',
    prerequisites: [],
  },
  {
    id: 'python',
    trackId: 'software',
    name: 'Python',
    code: 'PY',
    order: 2,
    description:
      'The working language of robotics prototyping, data, vision and ROS tooling.',
    prerequisites: ['programming'],
  },
  {
    id: 'ds-algo',
    trackId: 'software',
    name: 'Data Structures & Algorithms',
    code: 'DSA',
    order: 3,
    description:
      'The structures every robot program depends on - queues, maps, trees, graphs - and the cost of using them.',
    prerequisites: ['python'],
  },
  {
    id: 'tools',
    trackId: 'software',
    name: 'Git & Linux',
    code: 'TOOLS',
    order: 4,
    description:
      'The terminal, the filesystem, version control and collaboration workflows. Non-negotiable for engineering work.',
    prerequisites: ['programming'],
  },
  {
    id: 'apis',
    trackId: 'software',
    name: 'Networks & APIs',
    code: 'NET',
    order: 5,
    description: 'HTTP, REST, JSON and streaming telemetry - how robots talk to other machines.',
    prerequisites: ['python'],
  },
  {
    id: 'c-cpp',
    trackId: 'software',
    name: 'C & C++',
    code: 'C/C++',
    order: 6,
    description:
      'Memory, pointers and deterministic performance. Embedded firmware and ROS 2 are written in these.',
    prerequisites: ['ds-algo'],
  },
  {
    id: 'electronics',
    trackId: 'electronics',
    name: 'Electronics',
    code: 'EE',
    order: 1,
    description:
      'From Ohm\u2019s law to MOSFETs, regulators, PWM, ADC and digital logic - the physical layer of every robot.',
    prerequisites: ['physics'],
  },
  {
    id: 'microcontrollers',
    trackId: 'embedded',
    name: 'Microcontrollers',
    code: 'MCU',
    order: 1,
    description:
      'GPIO, UART, I2C, SPI, interrupts, timers, sensors and motor drivers on real silicon.',
    prerequisites: ['electronics', 'c-cpp'],
  },
  {
    id: 'embedded-systems',
    trackId: 'embedded',
    name: 'Embedded Systems',
    code: 'ES',
    order: 2,
    description:
      'Real-time constraints, memory budgets, boot behaviour, debugging and networked firmware.',
    prerequisites: ['microcontrollers'],
  },
  {
    id: 'mechanical',
    trackId: 'mechanical',
    name: 'Mechanical Design',
    code: 'MECH',
    order: 1,
    description:
      'Gears, linkages, bearings, shafts, fasteners, fits and the manufacturing processes that make parts real.',
    prerequisites: ['materials'],
  },
  {
    id: 'cad',
    trackId: 'cad',
    name: 'CAD & Technical Drawing',
    code: 'CAD',
    order: 1,
    description: 'Parametric modelling, assemblies, drawings and tolerances for parts that fit.',
    prerequisites: ['mechanical'],
  },
  {
    id: 'control',
    trackId: 'control',
    name: 'Control Theory',
    code: 'CTL',
    order: 1,
    description:
      'Feedback, error, PID, stability and trajectory generation - turning a mechanism into a controlled system.',
    prerequisites: ['math-advanced', 'embedded-systems'],
  },
  {
    id: 'robotics',
    trackId: 'robotics',
    name: 'Robotics',
    code: 'ROB',
    order: 1,
    description:
      'Actuators, encoders, kinematics, dynamics, path planning and simulation for real machines.',
    prerequisites: ['control', 'mechanical'],
  },
  {
    id: 'ros2',
    trackId: 'robotics',
    name: 'ROS 2',
    code: 'ROS2',
    order: 2,
    description:
      'The middleware robotics actually ships with: nodes, topics, services, actions, tf2, URDF and launch.',
    prerequisites: ['robotics', 'apis'],
  },
  {
    id: 'perception',
    trackId: 'ai-robotics',
    name: 'Perception & Machine Learning',
    code: 'PERC',
    order: 1,
    description: 'Images, OpenCV, features, machine learning and object detection.',
    prerequisites: ['python', 'math-advanced'],
  },
  {
    id: 'navigation',
    trackId: 'ai-robotics',
    name: 'Localization & Navigation',
    code: 'NAV',
    order: 2,
    description: 'SLAM, mapping, localization, costmaps and navigation stacks.',
    prerequisites: ['perception', 'ros2'],
  },
  {
    id: 'humanoid',
    trackId: 'humanoid',
    name: 'Humanoid Robotics',
    code: 'HUM',
    order: 1,
    description:
      'Balance, bipedal locomotion, joint control, whole-body control and humanoid simulation.',
    prerequisites: ['robotics', 'control'],
  },
  {
    id: 'systems',
    trackId: 'systems',
    name: 'Systems Engineering',
    code: 'SYS',
    order: 1,
    description:
      'Requirements, architecture, interfaces, verification, failure analysis, safety and reliability.',
    prerequisites: ['programming'],
  },
  {
    id: 'large-robotics',
    trackId: 'large-robotics',
    name: 'Large-Scale Robotics',
    code: 'LRG',
    order: 1,
    description:
      'Scaling laws, actuator and structural scaling, power, thermal management and large subsystems.',
    prerequisites: ['mechanical', 'humanoid', 'systems'],
  },
];

const TRACK_BY_ID: Record<TrackId, Track> = TRACKS.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<TrackId, Track>,
);

const SUBJECT_BY_ID: Record<SubjectId, Subject> = SUBJECTS.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<SubjectId, Subject>,
);

export function getTrack(id: TrackId): Track {
  const t = TRACK_BY_ID[id];
  if (!t) throw new Error(`unknown track: ${id}`);
  return t;
}

export function getSubject(id: SubjectId): Subject {
  const s = SUBJECT_BY_ID[id];
  if (!s) throw new Error(`unknown subject: ${id}`);
  return s;
}

/** Passed to `defineLesson` so each lesson derives its track from its subject. */
export function trackOfSubject(subjectId: SubjectId): Track['id'] {
  return getSubject(subjectId).trackId;
}
