import { describe, expect, it } from 'vitest';
import { Workout, localize } from '../src';

describe('Workout-Schema', () => {
  it('akzeptiert verschachtelte Kern-Bausteine', () => {
    const w = Workout.parse({
      id: 'w1',
      name: { de: 'Test' },
      blocks: [
        { type: 'group', name: { de: 'Warm-up' }, blocks: [{ type: 'exercise', ref: 'general.plank', duration: 30 }] },
        { type: 'repeat', times: 3, restBetween: 30, blocks: [{ type: 'rest', duration: 10 }] },
        { type: 'interval', refs: ['general.pushup'], work: 20, rest: 10, rounds: 8 },
        { type: 'note', text: { en: 'Get your board' } },
      ],
    });
    expect(w.sportPack).toBe('general');
    expect(w.blocks).toHaveLength(4);
  });

  it('lässt Erweiterungs-Bausteine durch', () => {
    const w = Workout.parse({ id: 'w', name: { de: 'A' }, blocks: [{ type: 'breath_table', holds: [60, 60] }] });
    expect(w.blocks[0]).toEqual({ type: 'breath_table', holds: [60, 60] });
  });

  it('meldet Fehler mit Pfad in verschachtelten Bausteinen', () => {
    const r = Workout.safeParse({
      id: 'w',
      name: { de: 'A' },
      blocks: [{ type: 'repeat', times: 2, blocks: [{ type: 'exercise', ref: 'kaputt', duration: -1 }] }],
    });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('blocks.0.blocks.0.ref');
    expect(paths).toContain('blocks.0.blocks.0.duration');
  });

  it('verbietet duration und reps gleichzeitig', () => {
    const r = Workout.safeParse({ id: 'w', name: { de: 'A' }, blocks: [{ type: 'exercise', ref: 'a.b', duration: 5, reps: 5 }] });
    expect(r.success).toBe(false);
  });

  it('braucht ein type-Feld und mindestens eine Sprache', () => {
    expect(Workout.safeParse({ id: 'w', name: { de: 'A' }, blocks: [{ foo: 1 }] }).success).toBe(false);
    expect(Workout.safeParse({ id: 'w', name: {}, blocks: [{ type: 'rest', duration: 1 }] }).success).toBe(false);
  });

  it('localize fällt auf vorhandene Sprache zurück', () => {
    expect(localize({ de: 'Hallo', en: 'Hello' }, 'en')).toBe('Hello');
    expect(localize({ de: 'Hallo' }, 'en')).toBe('Hallo');
  });
});
