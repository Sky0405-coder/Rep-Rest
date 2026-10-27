import type { Exercise, Workout } from '@workout/core';
import { bundledPacks } from '@workout/sport-packs';
import * as Crypto from 'expo-crypto';
import { useMemo } from 'react';

import { useAppStore } from './app-store';

// Verbindet mitgelieferte Inhalte (Sport-Packs) mit eigenen Workouts und
// importierten Übungen aus dem lokalen Speicher.

const bundledExercises = new Map<string, Exercise>(bundledPacks.flatMap((p) => p.exercises).map((e) => [e.id, e]));
const bundledWorkouts = bundledPacks.flatMap((p) => p.workouts);

export const USER_PREFIX = 'user.';

export const isUserWorkout = (id: string) => id.startsWith(USER_PREFIX);
export const newWorkoutId = () => `${USER_PREFIX}${Crypto.randomUUID()}`;

export function getExercise(id: string): Exercise | undefined {
  return bundledExercises.get(id) ?? useAppStore.getState().exercises.find((e) => e.id === id);
}

export function hasExercise(id: string): boolean {
  return getExercise(id) !== undefined;
}

export function listExercises(): Exercise[] {
  return [...bundledExercises.values(), ...useAppStore.getState().exercises];
}

export function useWorkout(id: string): Workout | undefined {
  const userWorkouts = useAppStore((s) => s.workouts);
  return useMemo(
    () => userWorkouts.find((w) => w.id === id) ?? bundledWorkouts.find((w) => w.id === id),
    [userWorkouts, id],
  );
}

export const templates: Workout[] = bundledWorkouts;
export const packs = bundledPacks.map((p) => p.manifest);
