import type { Block, ExtensionBlock, GroupBlock, IntervalBlock, RepeatBlock } from '../schema/blocks';
import type { Exercise } from '../schema/exercise';
import type { LocalizedText } from '../schema/localized';

/** Ein einzelner Abschnitt im Player: eine Übung, eine Pause, eine Notiz … */
export type Step = {
  kind: 'exercise' | 'rest' | 'note' | 'unsupported';
  /** Typ des Bausteins, aus dem der Step stammt. */
  blockType: string;
  exerciseId?: string;
  text?: LocalizedText;
  /** Dauer in Sekunden. Fehlt sie, geht es per Tap weiter (z. B. Wiederholungen). */
  duration?: number;
  reps?: number;
  side?: 'left' | 'right';
  /** Runden-Kontext von außen nach innen, z. B. [{ current: 2, total: 4 }]. */
  rounds: { current: number; total: number }[];
  /** Namen der umschließenden Gruppen von außen nach innen. */
  groups: LocalizedText[];
};

type Context = Pick<Step, 'rounds' | 'groups'>;

/** Wandelt einen Erweiterungs-Baustein (Sport-Pack) in Steps um. */
export type BlockExpander = (block: ExtensionBlock, ctx: Context) => Omit<Step, keyof Context>[];

export type FlattenOptions = {
  getExercise: (id: string) => Exercise | undefined;
  expanders?: Record<string, BlockExpander>;
};

const DEFAULT_EXERCISE_SECONDS = 30;

/** Löst den Baustein-Baum in eine lineare Timeline auf. */
export function flatten(blocks: Block[], options: FlattenOptions): Step[] {
  const steps: Step[] = [];
  visit(blocks, { rounds: [], groups: [] }, options, steps);
  return steps;
}

function visit(blocks: Block[], ctx: Context, options: FlattenOptions, out: Step[]): void {
  for (const block of blocks) {
    switch (block.type) {
      case 'exercise': {
        const b = block as Extract<Block, { type: 'exercise' }>;
        pushExercise(out, ctx, options, b.ref, b.duration, b.reps);
        break;
      }
      case 'rest':
        out.push({ kind: 'rest', blockType: 'rest', duration: (block as { duration: number }).duration, ...ctx });
        break;
      case 'note': {
        const b = block as Extract<Block, { type: 'note' }>;
        out.push({ kind: 'note', blockType: 'note', text: b.text, duration: b.duration, ...ctx });
        break;
      }
      case 'interval': {
        const b = block as IntervalBlock;
        for (let r = 1; r <= b.rounds; r++) {
          const roundCtx = { ...ctx, rounds: [...ctx.rounds, { current: r, total: b.rounds }] };
          const ref = b.refs[(r - 1) % b.refs.length]!;
          pushExercise(out, roundCtx, options, ref, b.work, undefined, 'interval');
          if (b.rest > 0 && r < b.rounds) {
            out.push({ kind: 'rest', blockType: 'interval', duration: b.rest, ...roundCtx });
          }
        }
        break;
      }
      case 'repeat': {
        const b = block as RepeatBlock;
        for (let r = 1; r <= b.times; r++) {
          const roundCtx = { ...ctx, rounds: [...ctx.rounds, { current: r, total: b.times }] };
          visit(b.blocks, roundCtx, options, out);
          if (b.restBetween && r < b.times) {
            out.push({ kind: 'rest', blockType: 'repeat', duration: b.restBetween, ...roundCtx });
          }
        }
        break;
      }
      case 'group': {
        const b = block as GroupBlock;
        visit(b.blocks, { ...ctx, groups: [...ctx.groups, b.name] }, options, out);
        break;
      }
      default: {
        const expander = options.expanders?.[block.type];
        if (expander) {
          for (const s of expander(block as ExtensionBlock, ctx)) out.push({ ...s, ...ctx });
        } else {
          out.push({ kind: 'unsupported', blockType: block.type, ...ctx });
        }
      }
    }
  }
}

function pushExercise(
  out: Step[],
  ctx: Context,
  options: FlattenOptions,
  ref: string,
  duration: number | undefined,
  reps: number | undefined,
  blockType = 'exercise',
): void {
  const exercise = options.getExercise(ref);
  if (duration === undefined && reps === undefined) {
    const d = exercise?.defaults;
    if (d?.mode === 'reps' && d.reps) reps = d.reps;
    else duration = d?.duration ?? DEFAULT_EXERCISE_SECONDS;
  }
  const base: Step = { kind: 'exercise', blockType, exerciseId: ref, duration, reps, ...ctx };
  if (exercise?.sides === 'left_right') {
    out.push({ ...base, side: 'left' }, { ...base, side: 'right' });
  } else {
    out.push(base);
  }
}

/** Geschätzte Sekunden pro Wiederholung, für die ungefähre Gesamtdauer. */
export const SECONDS_PER_REP = 3;
/** Geschätzte Sekunden für Steps ohne Dauer und ohne Wiederholungen (z. B. Notizen). */
const SECONDS_PER_MANUAL_STEP = 10;

export type TimelineSummary = {
  /** Summe aller festen Dauern in Sekunden. */
  totalSeconds: number;
  /** totalSeconds plus Schätzung für Steps nach Wiederholungen. */
  estimatedSeconds: number;
  /** Anzahl Steps ohne feste Dauer (per Tap weiter). */
  manualSteps: number;
  exerciseSteps: number;
};

export function summarize(steps: Step[]): TimelineSummary {
  let totalSeconds = 0;
  let manualSteps = 0;
  let exerciseSteps = 0;
  let estimatedSeconds = 0;
  for (const s of steps) {
    if (s.duration !== undefined) {
      totalSeconds += s.duration;
      estimatedSeconds += s.duration;
    } else {
      manualSteps++;
      estimatedSeconds += s.reps ? s.reps * SECONDS_PER_REP : SECONDS_PER_MANUAL_STEP;
    }
    if (s.kind === 'exercise') exerciseSteps++;
  }
  return { totalSeconds, estimatedSeconds, manualSteps, exerciseSteps };
}
