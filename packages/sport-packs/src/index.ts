import { Exercise, Workout, type SportPackManifest } from '@workout/core';
import { generalFigures } from './general/figures';
import generalExercises from './general/exercises.json';
import generalWorkouts from './general/workouts.json';

export type BundledPack = {
  manifest: SportPackManifest;
  exercises: Exercise[];
  workouts: Workout[];
};

/** Validiert die mitgelieferten Daten. Fehler hier sind Programmierfehler und sollen laut auffallen. */
function pack(
  manifest: SportPackManifest,
  exercises: unknown[],
  workouts: unknown[],
  figures: Record<string, unknown> = {},
): BundledPack {
  return {
    manifest,
    exercises: exercises.map((e) => {
      const raw = e as { id: string; media?: object };
      const figure = figures[raw.id];
      return Exercise.parse(figure ? { ...raw, media: { ...raw.media, figure } } : raw);
    }),
    workouts: workouts.map((w) => Workout.parse(w)),
  };
}

export const bundledPacks: BundledPack[] = [
  pack(
    { id: 'general', version: '0.1.0', name: { de: 'Allgemein', en: 'General' }, color: '#208AEF', icon: 'fitness' },
    generalExercises,
    generalWorkouts,
    generalFigures,
  ),
];
