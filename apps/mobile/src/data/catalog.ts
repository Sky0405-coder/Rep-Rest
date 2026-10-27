import type { Exercise, Workout } from '@workout/core';
import { bundledPacks } from '@workout/sport-packs';

// Vorerst nur die mitgelieferten Packs im Speicher. In Phase 1 kommt SQLite dazu
// (eigene Workouts, Importe), in Phase 2 der Sync mit dem Server.

const exercises = new Map<string, Exercise>(bundledPacks.flatMap((p) => p.exercises).map((e) => [e.id, e]));
const workouts = bundledPacks.flatMap((p) => p.workouts);

export const catalog = {
  packs: bundledPacks.map((p) => p.manifest),
  getExercise: (id: string) => exercises.get(id),
  listExercises: () => [...exercises.values()],
  listWorkouts: (): Workout[] => workouts,
  getWorkout: (id: string) => workouts.find((w) => w.id === id),
};
