import type { z } from 'zod';
import type { Block } from './schema/blocks';
import type { Exercise } from './schema/exercise';
import { WORKOUT_FILE_FORMAT, WORKOUT_FILE_VERSION, WorkoutFile, type Workout } from './schema/workout';

export type ImportIssue = { path: string; message: string };

export type ImportResult =
  | {
      ok: true;
      file: WorkoutFile;
      /** Übungs-IDs, die weder lokal noch in `customExercises` vorhanden sind. */
      missingExercises: string[];
      /** Bausteintypen, die diese App-Version nicht abspielen kann. */
      unsupportedBlocks: string[];
    }
  | { ok: false; issues: ImportIssue[] };

function formatPath(path: PropertyKey[]): string {
  return path
    .map((p, i) => (typeof p === 'number' ? `[${p}]` : i === 0 ? String(p) : `.${String(p)}`))
    .join('');
}

function toIssues(error: z.ZodError): ImportIssue[] {
  return error.issues.map((i) => ({ path: formatPath(i.path), message: i.message }));
}

export type ImportOptions = {
  /** Ob eine Übung lokal bekannt ist. */
  hasExercise: (id: string) => boolean;
  /** Bausteintypen, für die ein Player registriert ist. */
  supportedBlockTypes: ReadonlySet<string>;
};

/** Parst und validiert eine Workout-Datei (JSON-Text oder bereits geparstes Objekt). */
export function importWorkout(input: string | unknown, options: ImportOptions): ImportResult {
  let data: unknown = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch (e) {
      return { ok: false, issues: [{ path: '', message: `Kein gültiges JSON: ${(e as Error).message}` }] };
    }
  }

  const parsed = WorkoutFile.safeParse(data);
  if (!parsed.success) return { ok: false, issues: toIssues(parsed.error) };

  const file = parsed.data;
  const custom = new Set(file.customExercises.map((e) => e.id));
  const refs = new Set<string>();
  const types = new Set<string>();
  walkBlocks(file.workout.blocks, (b) => {
    types.add(b.type);
    for (const ref of blockRefs(b)) refs.add(ref);
  });

  return {
    ok: true,
    file,
    missingExercises: [...refs].filter((r) => !custom.has(r) && !options.hasExercise(r)).sort(),
    unsupportedBlocks: [...types].filter((t) => !options.supportedBlockTypes.has(t)).sort(),
  };
}

export function exportWorkout(workout: Workout, customExercises: Exercise[] = []): string {
  const file: WorkoutFile = {
    format: WORKOUT_FILE_FORMAT,
    version: WORKOUT_FILE_VERSION,
    workout,
    customExercises,
  };
  return JSON.stringify(file, null, 2);
}

export function walkBlocks(blocks: Block[], visit: (block: Block) => void): void {
  for (const b of blocks) {
    visit(b);
    const children = (b as { blocks?: unknown }).blocks;
    if (b.type === 'repeat' || b.type === 'group') walkBlocks(children as Block[], visit);
  }
}

function blockRefs(block: Block): string[] {
  if (block.type === 'exercise') return [(block as { ref: string }).ref];
  if (block.type === 'interval') return (block as { refs: string[] }).refs;
  return [];
}
