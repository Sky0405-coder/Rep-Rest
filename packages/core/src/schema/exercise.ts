import { z } from 'zod';
import { LocalizedText } from './localized';

/** ID im Format "<pack>.<name>", z. B. "general.pushup". */
export const ExerciseId = z
  .string()
  .regex(/^[a-z0-9_-]+\.[a-z0-9_.-]+$/, 'Format: "<pack>.<name>", z. B. "general.pushup"');

/** Verweis auf ein Bild/Video: gebündeltes Asset ("asset:…"), Server-Datei oder URL. */
export const AssetRef = z.string().min(1);

export const Exercise = z.object({
  id: ExerciseId,
  sportPack: z.string().min(1),
  name: LocalizedText,
  description: LocalizedText.optional(),
  cues: z.array(LocalizedText).default([]),
  media: z
    .object({
      image: AssetRef.optional(),
      animation: AssetRef.optional(),
      video: AssetRef.optional(),
    })
    .default({}),
  tags: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  defaults: z
    .object({
      mode: z.enum(['time', 'reps']),
      duration: z.number().int().positive().optional(),
      reps: z.number().int().positive().optional(),
    })
    .default({ mode: 'time', duration: 30 }),
  sides: z.enum(['both', 'left_right']).default('both'),
  safety: LocalizedText.optional(),
});
export type Exercise = z.infer<typeof Exercise>;
export type ExerciseInput = z.input<typeof Exercise>;
