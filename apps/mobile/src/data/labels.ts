import { flatten, localize, summarize, type Exercise, type Locale, type Step, type Workout } from '@workout/core';
import type { TFunction } from 'i18next';

import { formatDuration } from '@/i18n';

import { getExercise } from './catalog';

export function workoutSteps(workout: Workout): Step[] {
  return flatten(workout.blocks, { getExercise });
}

/** "8:30 Min. · 18 Übungen", bei Wiederholungen als ungefähre Dauer. */
export function workoutMeta(workout: Workout, t: TFunction): string {
  const s = summarize(workoutSteps(workout));
  const duration = formatDuration(s.estimatedSeconds, t);
  const time = s.manualSteps > 0 ? t('workouts.approx', { duration }) : duration;
  return `${time} · ${t('workouts.exercises', { count: s.exerciseSteps })}`;
}

export function exerciseName(id: string | undefined, locale: Locale): string {
  const ex = id ? getExercise(id) : undefined;
  return ex ? localize(ex.name, locale) : (id ?? '');
}

export function stepTitle(step: Step, t: TFunction, locale: Locale): string {
  switch (step.kind) {
    case 'exercise': {
      const name = exerciseName(step.exerciseId, locale);
      return step.side ? `${name} (${t(`step.${step.side}`)})` : name;
    }
    case 'rest':
      return t('step.rest');
    case 'note':
      return localize(step.text, locale) || t('step.note');
    case 'unsupported':
      return t('step.unsupported', { type: step.blockType });
  }
}

/** "45 s", "10×" oder "–" */
export function stepAmount(step: Step, t: TFunction): string {
  if (step.duration !== undefined) return formatDuration(step.duration, t);
  if (step.reps) return t('step.reps', { count: step.reps });
  return '–';
}

export function exerciseDefaultLabel(e: Exercise, t: TFunction): string {
  return e.defaults.mode === 'reps' && e.defaults.reps
    ? t('step.reps', { count: e.defaults.reps })
    : formatDuration(e.defaults.duration ?? 30, t);
}

/** Dateiname für den Export: "Quick Full Body" → "quick-full-body.workout.json" */
export function exportFileName(workout: Workout, locale: Locale): string {
  const slug = localize(workout.name, locale)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'workout'}.workout.json`;
}
