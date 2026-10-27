import { describe, expect, it } from 'vitest';
import { CORE_BLOCK_TYPES, flatten, importWorkout, exportWorkout } from '@workout/core';
import { bundledPacks } from '../src';

const all = bundledPacks.flatMap((p) => p.exercises);
const byId = new Map(all.map((e) => [e.id, e]));

describe('Mitgelieferte Sport-Packs', () => {
  it('haben eindeutige Übungs-IDs mit Pack-Präfix', () => {
    expect(byId.size).toBe(all.length);
    for (const p of bundledPacks) for (const e of p.exercises) expect(e.id.startsWith(`${p.manifest.id}.`)).toBe(true);
  });

  it('haben jede Übung auf Deutsch und Englisch', () => {
    for (const e of all) expect(e.name.de && e.name.en, e.id).toBeTruthy();
  });

  it('verweisen in Workouts nur auf existierende Übungen', () => {
    for (const p of bundledPacks)
      for (const w of p.workouts) {
        const r = importWorkout(exportWorkout(w), {
          hasExercise: (id) => byId.has(id),
          supportedBlockTypes: new Set(CORE_BLOCK_TYPES),
        });
        expect(r.ok && r.missingExercises, w.id).toEqual([]);
        expect(flatten(w.blocks, { getExercise: (id) => byId.get(id) }).length).toBeGreaterThan(0);
      }
  });
});

describe('Strichfiguren', () => {
  it('jede mitgelieferte Übung hat eine Figur', () => {
    for (const e of all) expect(e.media.figure, e.id).toBeDefined();
  });
});
