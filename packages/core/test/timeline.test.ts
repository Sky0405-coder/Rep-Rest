import { describe, expect, it } from 'vitest';
import { flatten, summarize, type Block } from '../src';
import { getExercise } from './fixtures';

const run = (blocks: Block[]) => flatten(blocks, { getExercise });

describe('flatten', () => {
  it('nimmt Übungs-Defaults, wenn nichts angegeben ist', () => {
    const [pushup, plank] = run([
      { type: 'exercise', ref: 'general.pushup' },
      { type: 'exercise', ref: 'general.plank' },
    ]);
    expect(pushup).toMatchObject({ reps: 10, duration: undefined });
    expect(plank).toMatchObject({ duration: 45 });
  });

  it('verdoppelt links/rechts-Übungen', () => {
    const steps = run([{ type: 'exercise', ref: 'general.lunge' }]);
    expect(steps.map((s) => s.side)).toEqual(['left', 'right']);
  });

  it('löst Runden mit Pause dazwischen auf, aber nicht nach der letzten', () => {
    const steps = run([
      {
        type: 'repeat',
        times: 3,
        restBetween: 60,
        blocks: [{ type: 'exercise', ref: 'general.plank', duration: 20 }],
      },
    ]);
    expect(steps.map((s) => s.kind)).toEqual(['exercise', 'rest', 'exercise', 'rest', 'exercise']);
    expect(steps[4]!.rounds).toEqual([{ current: 3, total: 3 }]);
  });

  it('Intervall wechselt Übungen reihum', () => {
    const steps = run([{ type: 'interval', refs: ['general.pushup', 'general.plank'], work: 20, rest: 10, rounds: 3 }]);
    expect(steps.map((s) => s.exerciseId ?? 'rest')).toEqual(['general.pushup', 'rest', 'general.plank', 'rest', 'general.pushup']);
    expect(steps[0]!.duration).toBe(20);
  });

  it('merkt sich Gruppen und verschachtelte Runden', () => {
    const steps = run([
      {
        type: 'group',
        name: { de: 'Hauptteil' },
        blocks: [{ type: 'repeat', times: 2, blocks: [{ type: 'repeat', times: 2, blocks: [{ type: 'rest', duration: 5 }] }] }],
      },
    ]);
    expect(steps).toHaveLength(4);
    expect(steps[3]!.groups).toEqual([{ de: 'Hauptteil' }]);
    expect(steps[3]!.rounds).toEqual([{ current: 2, total: 2 }, { current: 2, total: 2 }]);
  });

  it('nutzt Expander für Pack-Bausteine, sonst "unsupported"', () => {
    const blocks: Block[] = [{ type: 'breath_table', holds: [30, 40] }, { type: 'mystery' }];
    const steps = flatten(blocks, {
      getExercise,
      expanders: {
        breath_table: (b) => (b.holds as number[]).map((d) => ({ kind: 'exercise', blockType: 'breath_table', duration: d })),
      },
    });
    expect(steps.map((s) => [s.kind, s.duration])).toEqual([
      ['exercise', 30],
      ['exercise', 40],
      ['unsupported', undefined],
    ]);
  });

  it('summarize zählt Dauer und manuelle Steps', () => {
    const steps = run([
      { type: 'exercise', ref: 'general.pushup' },
      { type: 'rest', duration: 15 },
      { type: 'exercise', ref: 'general.plank' },
    ]);
    expect(summarize(steps)).toEqual({ totalSeconds: 60, manualSteps: 1, exerciseSteps: 2 });
  });
});
