import { describe, expect, it } from 'vitest';

import { PROJECTS } from '@/data/curriculum';
import { getLesson } from '@/lib/curriculum';
import type { ProjectStage } from '@/lib/types';

/** The progression stated in the Jaeger goal, in order. */
const STAGE_ORDER: ProjectStage[] = [
  'bench',
  'small-robot',
  'robotic-arm',
  'autonomous-robot',
  'advanced-manipulator',
  'small-humanoid',
  'large-subsystem',
  'large-scale-research',
];

describe('project ladder', () => {
  it('has projects and unique ids', () => {
    expect(PROJECTS.length).toBeGreaterThanOrEqual(8);
    const ids = PROJECTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every stage of the progression, in progression order', () => {
    const stages = PROJECTS.map((p) => p.stage);
    for (const stage of STAGE_ORDER) {
      expect(stages, `no project for stage ${stage}`).toContain(stage);
    }
    const ranks = stages.map((s) => STAGE_ORDER.indexOf(s));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('orders projects 1..n with no gaps', () => {
    const orders = PROJECTS.map((p) => p.order).sort((a, b) => a - b);
    expect(orders).toEqual(orders.map((_, i) => i + 1));
  });

  it('includes the obstacle-avoiding robot the learner asked for', () => {
    const bot = PROJECTS.find((p) => p.id === 'prj-obstacle-bot');
    expect(bot).toBeDefined();
    expect(bot?.stage).toBe('small-robot');
    expect(bot?.tasks.length).toBeGreaterThanOrEqual(10);
  });

  it('never promises a movie-scale Jaeger as an outcome', () => {
    const research = PROJECTS.find((p) => p.stage === 'large-scale-research');
    expect(research).toBeDefined();
    // The capstone is a study, not a build: no hardware, no budget for a machine.
    expect(research?.requiresHardware).toBe(false);
    const text = `${research?.description} ${research?.tasks.map((t) => t.detail).join(' ')}`;
    expect(text.toLowerCase()).toMatch(/jaeger|feasib/);
  });
});

describe('project internals', () => {
  for (const p of PROJECTS) {
    describe(`${p.id}`, () => {
      it('has a description, a why, and outcomes', () => {
        expect(p.description.length).toBeGreaterThan(80);
        expect(p.why.length).toBeGreaterThan(40);
        expect(p.learningOutcomes.length).toBeGreaterThanOrEqual(3);
        expect(p.materials.length).toBeGreaterThanOrEqual(3);
      });

      it('only requires lessons that exist', () => {
        expect(p.requiredSkills.length).toBeGreaterThan(0);
        for (const lid of p.requiredSkills) {
          expect(getLesson(lid), `${p.id} requires unknown lesson ${lid}`).toBeDefined();
        }
      });

      it('has tasks with unique ids, orders and positive estimates', () => {
        const ids = p.tasks.map((t) => t.id);
        expect(new Set(ids).size).toBe(ids.length);
        const orders = p.tasks.map((t) => t.order).sort((a, b) => a - b);
        expect(orders).toEqual(orders.map((_, i) => i + 1));
        for (const t of p.tasks) {
          expect(t.estimatedMinutes).toBeGreaterThan(0);
          expect(t.title.length).toBeGreaterThan(8);
        }
        // A project is a real commitment: several hours at minimum.
        const total = p.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
        expect(total).toBeGreaterThanOrEqual(300);
      });

      it('links every milestone to real tasks and every task to a real milestone', () => {
        const taskIds = new Set(p.tasks.map((t) => t.id));
        const milestoneIds = new Set(p.milestones.map((m) => m.id));
        const covered = new Set<string>();
        for (const m of p.milestones) {
          expect(m.taskIds.length).toBeGreaterThan(0);
          for (const tid of m.taskIds) {
            expect(taskIds.has(tid), `${m.id} -> ${tid}`).toBe(true);
            covered.add(tid);
          }
        }
        for (const t of p.tasks) {
          if (t.milestoneId) expect(milestoneIds.has(t.milestoneId)).toBe(true);
        }
        // Every task must belong to a milestone, otherwise progress cannot be tracked.
        for (const tid of taskIds) {
          expect(covered.has(tid), `task ${tid} is in no milestone`).toBe(true);
        }
        const mOrders = p.milestones.map((m) => m.order).sort((a, b) => a - b);
        expect(mOrders).toEqual(mOrders.map((_, i) => i + 1));
      });

      it('has observable acceptance criteria, not feelings', () => {
        expect(p.acceptanceCriteria.length).toBeGreaterThanOrEqual(4);
        const vague = /\b(feel|confident|comfortable|understand|know how|familiar)\b/i;
        for (const c of p.acceptanceCriteria) {
          expect(c.length).toBeGreaterThan(30);
          expect(vague.test(c), `vague criterion in ${p.id}: ${c}`).toBe(false);
        }
      });

      it('is honest about hardware', () => {
        const anyTaskNeedsHardware = p.tasks.some((t) => t.requiresHardware);
        if (anyTaskNeedsHardware) expect(p.requiresHardware).toBe(true);
        if (!p.requiresHardware) {
          // Software-only projects must not carry a hardware budget.
          expect(p.estimatedCostUsd ?? 0).toBeLessThanOrEqual(0);
        } else {
          expect(p.estimatedCostUsd).toBeGreaterThan(0);
        }
      });
    });
  }
});
