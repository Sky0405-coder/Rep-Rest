import { z } from 'zod';
import { ExerciseId } from './exercise';
import { LocalizedText } from './localized';

const Seconds = z.number().int().positive().max(24 * 60 * 60);

export const ExerciseBlock = z
  .object({
    type: z.literal('exercise'),
    ref: ExerciseId,
    duration: Seconds.optional(),
    reps: z.number().int().positive().max(10_000).optional(),
    note: LocalizedText.optional(),
  })
  .refine((b) => !(b.duration !== undefined && b.reps !== undefined), {
    message: 'Eine Übung hat entweder "duration" oder "reps", nicht beides',
  });
export type ExerciseBlock = z.infer<typeof ExerciseBlock>;

export const RestBlock = z.object({
  type: z.literal('rest'),
  duration: Seconds,
});
export type RestBlock = z.infer<typeof RestBlock>;

export const NoteBlock = z.object({
  type: z.literal('note'),
  text: LocalizedText,
  /** Optional automatisch weiter nach X Sekunden, sonst per Tap. */
  duration: Seconds.optional(),
});
export type NoteBlock = z.infer<typeof NoteBlock>;

export const IntervalBlock = z.object({
  type: z.literal('interval'),
  /** Übungen, die reihum pro Runde drankommen. */
  refs: z.array(ExerciseId).min(1),
  work: Seconds,
  rest: z.number().int().min(0).max(3600),
  rounds: z.number().int().positive().max(1000),
});
export type IntervalBlock = z.infer<typeof IntervalBlock>;

export type RepeatBlock = {
  type: 'repeat';
  times: number;
  restBetween?: number | undefined;
  blocks: Block[];
};

export type GroupBlock = {
  type: 'group';
  name: LocalizedText;
  blocks: Block[];
};

/** Baustein eines Sport-Packs, den der Kern nicht kennt (z. B. "breath_table"). */
export type ExtensionBlock = {
  type: string;
  [key: string]: unknown;
};

export type CoreBlock =
  | ExerciseBlock
  | RestBlock
  | NoteBlock
  | IntervalBlock
  | RepeatBlock
  | GroupBlock;

export type Block = CoreBlock | ExtensionBlock;

export const CORE_BLOCK_TYPES = ['exercise', 'rest', 'note', 'interval', 'repeat', 'group'] as const;

export const RepeatBlock: z.ZodType<RepeatBlock> = z.lazy(() =>
  z.object({
    type: z.literal('repeat'),
    times: z.number().int().positive().max(1000),
    restBetween: z.number().int().min(0).max(3600).optional(),
    blocks: z.array(Block).min(1),
  }),
);

export const GroupBlock: z.ZodType<GroupBlock> = z.lazy(() =>
  z.object({
    type: z.literal('group'),
    name: LocalizedText,
    blocks: z.array(Block).min(1),
  }),
);

const ExtensionBlockSchema = z
  .looseObject({ type: z.string().regex(/^[a-z][a-z0-9_]*$/) })
  .refine((b) => !(CORE_BLOCK_TYPES as readonly string[]).includes(b.type), {
    message: 'Ungültiger Kern-Baustein',
  });

const blockByType = {
  exercise: ExerciseBlock,
  rest: RestBlock,
  note: NoteBlock,
  interval: IntervalBlock,
  repeat: RepeatBlock,
  group: GroupBlock,
} satisfies Record<(typeof CORE_BLOCK_TYPES)[number], z.ZodType>;

/**
 * Ein Baustein. Kern-Bausteine werden streng nach ihrem `type` validiert,
 * damit Fehlermeldungen auf das richtige Schema zeigen. Unbekannte Typen
 * werden als Erweiterungs-Bausteine durchgelassen.
 */
export const Block: z.ZodType<Block> = z.lazy(() =>
  z.unknown().transform((value, ctx): Block => {
    const type =
      typeof value === 'object' && value !== null ? (value as { type?: unknown }).type : undefined;
    if (typeof type !== 'string') {
      ctx.addIssue({ code: 'custom', message: 'Baustein braucht ein Feld "type"' });
      return z.NEVER;
    }
    const schema = blockByType[type as keyof typeof blockByType] ?? ExtensionBlockSchema;
    const result = schema.safeParse(value);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ code: 'custom', message: issue.message, path: issue.path });
      }
      return z.NEVER;
    }
    return result.data as Block;
  }),
);

export function isCoreBlock(block: Block): block is CoreBlock {
  return (CORE_BLOCK_TYPES as readonly string[]).includes(block.type);
}
