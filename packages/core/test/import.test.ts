import { describe, expect, it } from 'vitest';
import { CORE_BLOCK_TYPES, Workout, exportWorkout, importWorkout } from '../src';
import { exercises } from './fixtures';

const options = { hasExercise: (id: string) => exercises.has(id), supportedBlockTypes: new Set<string>(CORE_BLOCK_TYPES) };

describe('Import/Export', () => {
  it('Roundtrip ohne Verluste', () => {
    const workout = Workout.parse({ id: 'w', name: { de: 'A' }, blocks: [{ type: 'exercise', ref: 'general.plank' }] });
    const r = importWorkout(exportWorkout(workout), options);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.file.workout).toEqual(workout);
      expect(r.missingExercises).toEqual([]);
    }
  });

  it('meldet fehlende Übungen und unbekannte Bausteine', () => {
    const json = JSON.stringify({
      format: 'workout.file',
      version: 1,
      workout: {
        id: 'w',
        name: { de: 'A' },
        blocks: [
          { type: 'exercise', ref: 'surf.popup' },
          { type: 'exercise', ref: 'custom.thing' },
          { type: 'breath_table' },
        ],
      },
      customExercises: [{ id: 'custom.thing', sportPack: 'custom', name: { de: 'Ding' } }],
    });
    const r = importWorkout(json, options);
    expect(r.ok && r.missingExercises).toEqual(['surf.popup']);
    expect(r.ok && r.unsupportedBlocks).toEqual(['breath_table']);
  });

  it('liefert lesbare Fehler', () => {
    const bad = importWorkout('{ nope', options);
    expect(bad.ok).toBe(false);
    const wrong = importWorkout({ format: 'workout.file', version: 1, workout: { id: 'w', name: { de: 'A' }, blocks: [] } }, options);
    expect(!wrong.ok && wrong.issues[0]).toEqual({ path: 'workout.blocks', message: 'Ein Workout braucht mindestens einen Baustein' });
  });
});
