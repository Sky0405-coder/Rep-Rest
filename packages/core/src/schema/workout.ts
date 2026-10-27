import { z } from 'zod';
import { Block } from './blocks';
import { Exercise } from './exercise';
import { LocalizedText } from './localized';

export const Workout = z.object({
  id: z.string().min(1),
  name: LocalizedText,
  description: LocalizedText.optional(),
  sportPack: z.string().min(1).default('general'),
  difficulty: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).default([]),
  blocks: z.array(Block).min(1, 'Ein Workout braucht mindestens einen Baustein'),
});
export type Workout = z.infer<typeof Workout>;
export type WorkoutInput = z.input<typeof Workout>;

export const WORKOUT_FILE_FORMAT = 'workout.file';
export const WORKOUT_FILE_VERSION = 1;

/** Austauschformat für Import/Export (Datei, Link, QR-Code). */
export const WorkoutFile = z.object({
  format: z.literal(WORKOUT_FILE_FORMAT),
  version: z.literal(WORKOUT_FILE_VERSION),
  workout: Workout,
  /** Eigene Übungen, auf die das Workout verweist und die der Empfänger evtl. nicht hat. */
  customExercises: z.array(Exercise).default([]),
});
export type WorkoutFile = z.infer<typeof WorkoutFile>;

export const SportPackManifest = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/),
  version: z.string(),
  name: LocalizedText,
  description: LocalizedText.optional(),
  /** Akzentfarbe des Packs in der UI. */
  color: z.string().optional(),
  icon: z.string().optional(),
});
export type SportPackManifest = z.infer<typeof SportPackManifest>;
