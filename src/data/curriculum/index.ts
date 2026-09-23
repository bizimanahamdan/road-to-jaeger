import { SUBJECTS, TRACKS } from './catalog';
import { MATH_LESSONS } from './math';
import { MATH_ADVANCED_LESSONS } from './math-advanced';
import { PHYSICS_LESSONS } from './physics';
import { MATERIALS_LESSONS } from './materials';
import { PROGRAMMING_LESSONS } from './programming';
import { PYTHON_LESSONS } from './python';
import { DSA_LESSONS } from './ds-algo';
import { TOOLS_LESSONS } from './tools';
import { API_LESSONS } from './apis';
import { C_CPP_LESSONS } from './c-cpp';
import { ELECTRONICS_LESSONS } from './electronics';
import { MCU_LESSONS } from './microcontrollers';
import { EMBEDDED_LESSONS } from './embedded-systems';
import { MECHANICAL_LESSONS } from './mechanical';
import { CAD_LESSONS } from './cad';
import { CONTROL_LESSONS } from './control';
import { ROBOTICS_LESSONS } from './robotics';
import { ROS2_LESSONS } from './ros2';
import { PERCEPTION_LESSONS } from './perception';
import { NAVIGATION_LESSONS } from './navigation';
import { HUMANOID_LESSONS } from './humanoid';
import { SYSTEMS_LESSONS } from './systems';
import { LARGE_ROBOTICS_LESSONS } from './large-robotics';
import { SKILLS } from './skills';
import { PROJECTS } from './projects';
import type { Lesson, Project, Skill, Subject, Track } from '@/lib/types';

/**
 * Single source of truth for the curriculum.
 *
 * Every array below is authored content, frozen at build time and shipped in
 * the bundle. That is what makes the app work with no network and no database:
 * the roadmap is not fetched, it is compiled in.
 */
export const LESSONS: Lesson[] = Object.freeze([
  ...MATH_LESSONS,
  ...MATH_ADVANCED_LESSONS,
  ...PHYSICS_LESSONS,
  ...MATERIALS_LESSONS,
  ...PROGRAMMING_LESSONS,
  ...PYTHON_LESSONS,
  ...DSA_LESSONS,
  ...TOOLS_LESSONS,
  ...API_LESSONS,
  ...C_CPP_LESSONS,
  ...ELECTRONICS_LESSONS,
  ...MCU_LESSONS,
  ...EMBEDDED_LESSONS,
  ...MECHANICAL_LESSONS,
  ...CAD_LESSONS,
  ...CONTROL_LESSONS,
  ...ROBOTICS_LESSONS,
  ...ROS2_LESSONS,
  ...PERCEPTION_LESSONS,
  ...NAVIGATION_LESSONS,
  ...HUMANOID_LESSONS,
  ...SYSTEMS_LESSONS,
  ...LARGE_ROBOTICS_LESSONS,
]) as Lesson[];

export { SUBJECTS, TRACKS, SKILLS, PROJECTS };

export type { Lesson, Project, Skill, Subject, Track };
