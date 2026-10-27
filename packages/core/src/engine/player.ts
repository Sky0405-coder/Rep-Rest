import type { Step } from './timeline';

/**
 * Zeitstempelbasierter Player als reine Funktion: (state, action) → (state, events).
 * Die Restzeit wird immer aus `endsAt - now` berechnet. Dadurch driftet der Timer
 * nicht und holt nach einer Pause im Hintergrund (gesperrter Bildschirm) korrekt auf.
 */

export type PlayerStatus = 'ready' | 'countdown' | 'running' | 'paused' | 'done';

export type PlayerState = {
  status: PlayerStatus;
  stepIndex: number;
  /** Zeitpunkt (ms), an dem die aktuelle Phase endet. null bei manuellen Steps oder Pause. */
  endsAt: number | null;
  /** Verbleibende Zeit (ms) während der Pause. */
  pausedRemainingMs: number | null;
  pausedFrom: 'countdown' | 'running' | null;
  /** Zuletzt ausgelöster Countdown-Cue (Sekunden), damit jeder Beep nur einmal kommt. */
  lastCue: number | null;
  startedAt: number | null;
  finishedAt: number | null;
};

export type PlayerEvent =
  | { type: 'cue'; secondsLeft: number; phase: 'countdown' | 'step' }
  | { type: 'stepStart'; stepIndex: number }
  | { type: 'stepEnd'; stepIndex: number }
  | { type: 'done' };

export type PlayerAction =
  | { type: 'start'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'next'; now: number }
  | { type: 'prev'; now: number }
  | { type: 'addTime'; now: number; seconds: number };

export type PlayerConfig = {
  /** Vorlauf vor dem ersten Step in Sekunden (0 = sofort los). */
  leadInSeconds: number;
  /** In den letzten N Sekunden eines Steps kommt jede Sekunde ein Cue. */
  cueSeconds: number;
};

export const DEFAULT_PLAYER_CONFIG: PlayerConfig = { leadInSeconds: 5, cueSeconds: 3 };

export type PlayerResult = { state: PlayerState; events: PlayerEvent[] };

export function initialPlayerState(): PlayerState {
  return {
    status: 'ready',
    stepIndex: 0,
    endsAt: null,
    pausedRemainingMs: null,
    pausedFrom: null,
    lastCue: null,
    startedAt: null,
    finishedAt: null,
  };
}

export function playerReducer(
  state: PlayerState,
  action: PlayerAction,
  steps: readonly Step[],
  config: PlayerConfig = DEFAULT_PLAYER_CONFIG,
): PlayerResult {
  const events: PlayerEvent[] = [];
  let next = state;

  switch (action.type) {
    case 'start': {
      if (state.status !== 'ready') break;
      next = { ...state, startedAt: action.now };
      if (config.leadInSeconds > 0 && steps.length > 0) {
        next = { ...next, status: 'countdown', endsAt: action.now + config.leadInSeconds * 1000, lastCue: null };
      } else {
        next = beginStep(next, 0, action.now, steps, events);
      }
      break;
    }
    case 'tick':
      next = advance(state, action.now, steps, events, config);
      break;
    case 'pause': {
      if (state.status !== 'countdown' && state.status !== 'running') break;
      const advanced = advance(state, action.now, steps, events, config);
      if (advanced.status !== 'countdown' && advanced.status !== 'running') {
        next = advanced;
        break;
      }
      next = {
        ...advanced,
        status: 'paused',
        pausedFrom: advanced.status,
        pausedRemainingMs: advanced.endsAt === null ? null : Math.max(0, advanced.endsAt - action.now),
        endsAt: null,
      };
      break;
    }
    case 'resume': {
      if (state.status !== 'paused' || state.pausedFrom === null) break;
      next = {
        ...state,
        status: state.pausedFrom,
        endsAt: state.pausedRemainingMs === null ? null : action.now + state.pausedRemainingMs,
        pausedRemainingMs: null,
        pausedFrom: null,
      };
      break;
    }
    case 'next': {
      if (state.status === 'ready' || state.status === 'done') break;
      if (state.status === 'countdown' || (state.status === 'paused' && state.pausedFrom === 'countdown')) {
        next = beginStep(clearPause(state), 0, action.now, steps, events);
        break;
      }
      const current = steps[state.stepIndex];
      // Bei manuellen Steps (Wiederholungen) bedeutet "weiter": erledigt.
      if (current && current.duration === undefined) events.push({ type: 'stepEnd', stepIndex: state.stepIndex });
      next = beginStep(clearPause(state), state.stepIndex + 1, action.now, steps, events);
      break;
    }
    case 'prev': {
      if (state.status === 'ready' || state.status === 'countdown') break;
      const target = state.status === 'done' ? steps.length - 1 : Math.max(0, state.stepIndex - 1);
      next = beginStep({ ...clearPause(state), finishedAt: null }, target, action.now, steps, events);
      break;
    }
    case 'addTime': {
      const ms = action.seconds * 1000;
      if (state.endsAt !== null && (state.status === 'running' || state.status === 'countdown')) {
        next = { ...state, endsAt: Math.max(action.now, state.endsAt + ms), lastCue: null };
      } else if (state.status === 'paused' && state.pausedRemainingMs !== null) {
        next = { ...state, pausedRemainingMs: Math.max(0, state.pausedRemainingMs + ms), lastCue: null };
      }
      break;
    }
  }

  return { state: next, events };
}

function clearPause(state: PlayerState): PlayerState {
  return { ...state, pausedFrom: null, pausedRemainingMs: null };
}

function beginStep(
  state: PlayerState,
  index: number,
  startAt: number,
  steps: readonly Step[],
  events: PlayerEvent[],
): PlayerState {
  if (index >= steps.length) {
    events.push({ type: 'done' });
    return { ...state, status: 'done', stepIndex: Math.max(0, steps.length - 1), endsAt: null, lastCue: null, finishedAt: startAt };
  }
  const step = steps[index]!;
  events.push({ type: 'stepStart', stepIndex: index });
  return {
    ...state,
    status: 'running',
    stepIndex: index,
    endsAt: step.duration === undefined ? null : startAt + step.duration * 1000,
    lastCue: null,
  };
}

/** Schließt abgelaufene Phasen ab (auch mehrere, falls die App im Hintergrund war) und löst Cues aus. */
function advance(
  state: PlayerState,
  now: number,
  steps: readonly Step[],
  events: PlayerEvent[],
  config: PlayerConfig,
): PlayerState {
  let s = state;
  while ((s.status === 'countdown' || s.status === 'running') && s.endsAt !== null && now >= s.endsAt) {
    const endedAt = s.endsAt;
    if (s.status === 'countdown') {
      s = beginStep(s, 0, endedAt, steps, events);
    } else {
      events.push({ type: 'stepEnd', stepIndex: s.stepIndex });
      s = beginStep(s, s.stepIndex + 1, endedAt, steps, events);
    }
  }

  if ((s.status === 'countdown' || s.status === 'running') && s.endsAt !== null) {
    const secondsLeft = Math.ceil((s.endsAt - now) / 1000);
    const cueSeconds = s.status === 'countdown' ? Infinity : config.cueSeconds;
    if (secondsLeft >= 1 && secondsLeft <= cueSeconds && s.lastCue !== secondsLeft) {
      events.push({ type: 'cue', secondsLeft, phase: s.status === 'countdown' ? 'countdown' : 'step' });
      s = { ...s, lastCue: secondsLeft };
    }
  }
  return s;
}

export type PlayerView = {
  step: Step | undefined;
  nextStep: Step | undefined;
  /** Restzeit der aktuellen Phase in ms (null bei manuellen Steps). */
  remainingMs: number | null;
  /** Fortschritt der aktuellen Phase 0..1 (null bei manuellen Steps). */
  phaseProgress: number | null;
  /** Fortschritt über alle Steps 0..1. */
  overallProgress: number;
};

export function getPlayerView(
  state: PlayerState,
  steps: readonly Step[],
  now: number,
  config: PlayerConfig = DEFAULT_PLAYER_CONFIG,
): PlayerView {
  const step = steps[state.stepIndex];
  const inLeadIn = state.status === 'countdown' || (state.status === 'paused' && state.pausedFrom === 'countdown');
  const totalMs = inLeadIn
    ? config.leadInSeconds * 1000
    : step?.duration === undefined
      ? null
      : step.duration * 1000;

  let remainingMs: number | null = null;
  if (state.status === 'paused') remainingMs = state.pausedRemainingMs;
  else if (state.endsAt !== null) remainingMs = Math.max(0, state.endsAt - now);
  else if (state.status === 'ready') remainingMs = totalMs;

  const phaseProgress =
    totalMs === null || remainingMs === null || totalMs === 0 ? null : Math.min(1, Math.max(0, 1 - remainingMs / totalMs));

  const overallProgress =
    state.status === 'done'
      ? 1
      : steps.length === 0 || inLeadIn
        ? 0
        : (state.stepIndex + (phaseProgress ?? 0)) / steps.length;

  return {
    step,
    nextStep: inLeadIn || state.status === 'ready' ? step : steps[state.stepIndex + 1],
    remainingMs,
    phaseProgress,
    overallProgress,
  };
}
