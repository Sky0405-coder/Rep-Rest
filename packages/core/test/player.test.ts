import { describe, expect, it } from 'vitest';
import {
  getPlayerView,
  initialPlayerState,
  playerReducer,
  type PlayerAction,
  type PlayerConfig,
  type PlayerEvent,
  type PlayerState,
  type Step,
} from '../src';

const step = (duration?: number, reps?: number): Step => ({
  kind: 'exercise',
  blockType: 'exercise',
  exerciseId: 'general.x',
  duration,
  reps,
  rounds: [],
  groups: [],
});

const config: PlayerConfig = { leadInSeconds: 3, cueSeconds: 3 };

function drive(steps: Step[], actions: PlayerAction[], cfg = config) {
  let state: PlayerState = initialPlayerState();
  const events: PlayerEvent[] = [];
  for (const a of actions) {
    const r = playerReducer(state, a, steps, cfg);
    state = r.state;
    events.push(...r.events);
  }
  return { state, events };
}

describe('Player', () => {
  it('Vorlauf → Step → Ende, mit Cues jede Sekunde', () => {
    const steps = [step(5)];
    const ticks: PlayerAction[] = [{ type: 'start', now: 0 }];
    for (let t = 0; t <= 9000; t += 100) ticks.push({ type: 'tick', now: t });
    const { state, events } = drive(steps, ticks);

    expect(state.status).toBe('done');
    expect(state.finishedAt).toBe(8000);
    expect(events).toEqual([
      { type: 'cue', secondsLeft: 3, phase: 'countdown' },
      { type: 'cue', secondsLeft: 2, phase: 'countdown' },
      { type: 'cue', secondsLeft: 1, phase: 'countdown' },
      { type: 'stepStart', stepIndex: 0 },
      { type: 'cue', secondsLeft: 3, phase: 'step' },
      { type: 'cue', secondsLeft: 2, phase: 'step' },
      { type: 'cue', secondsLeft: 1, phase: 'step' },
      { type: 'stepEnd', stepIndex: 0 },
      { type: 'done' },
    ]);
  });

  it('holt nach langer Hintergrundzeit ohne Drift auf', () => {
    const steps = [step(10), step(10), step(10)];
    const { state, events } = drive(steps, [
      { type: 'start', now: 0 },
      { type: 'tick', now: 3000 + 10_000 + 4_000 }, // mitten im 2. Step
    ]);
    expect(state.stepIndex).toBe(1);
    expect(state.endsAt).toBe(23_000);
    expect(events.filter((e) => e.type === 'stepEnd')).toHaveLength(1);
  });

  it('Pause friert die Restzeit ein, Resume setzt sie fort', () => {
    const steps = [step(10)];
    const { state } = drive(steps, [
      { type: 'start', now: 0 },
      { type: 'tick', now: 3000 },
      { type: 'pause', now: 7000 },
      { type: 'tick', now: 60_000 },
      { type: 'resume', now: 100_000 },
    ]);
    expect(state.status).toBe('running');
    expect(state.endsAt).toBe(106_000);
  });

  it('manueller Step wartet auf "next" und meldet ihn als erledigt', () => {
    const steps = [step(undefined, 10), step(5)];
    const { state, events } = drive(steps, [
      { type: 'start', now: 0 },
      { type: 'tick', now: 3000 },
      { type: 'tick', now: 999_000 },
      { type: 'next', now: 1_000_000 },
    ]);
    expect(state.stepIndex).toBe(1);
    expect(state.endsAt).toBe(1_005_000);
    expect(events).toContainEqual({ type: 'stepEnd', stepIndex: 0 });
  });

  it('next überspringt den Vorlauf, prev geht zurück', () => {
    const steps = [step(5), step(5)];
    let r = drive(steps, [
      { type: 'start', now: 0 },
      { type: 'next', now: 500 },
    ]);
    expect(r.state).toMatchObject({ status: 'running', stepIndex: 0, endsAt: 5500 });
    r = drive(steps, [
      { type: 'start', now: 0 },
      { type: 'next', now: 0 },
      { type: 'next', now: 1000 },
      { type: 'prev', now: 2000 },
    ]);
    expect(r.state).toMatchObject({ stepIndex: 0, endsAt: 7000 });
  });

  it('addTime verlängert die Phase, auch im Pausenzustand', () => {
    const steps = [step(10)];
    const { state } = drive(steps, [
      { type: 'start', now: 0 },
      { type: 'next', now: 0 },
      { type: 'addTime', now: 1000, seconds: 10 },
      { type: 'pause', now: 2000 },
      { type: 'addTime', now: 2000, seconds: 5 },
    ]);
    expect(state.pausedRemainingMs).toBe(23_000);
  });

  it('ohne Vorlauf geht es sofort los', () => {
    const { state, events } = drive([step(5)], [{ type: 'start', now: 0 }], { leadInSeconds: 0, cueSeconds: 3 });
    expect(state).toMatchObject({ status: 'running', endsAt: 5000 });
    expect(events).toEqual([{ type: 'stepStart', stepIndex: 0 }]);
  });

  it('View berechnet Rest- und Gesamtfortschritt', () => {
    const steps = [step(10), step(10)];
    const { state } = drive(steps, [
      { type: 'start', now: 0 },
      { type: 'tick', now: 3000 + 15_000 },
    ]);
    const view = getPlayerView(state, steps, 18_000, config);
    expect(view.remainingMs).toBe(5000);
    expect(view.phaseProgress).toBe(0.5);
    expect(view.overallProgress).toBe(0.75);
    expect(view.nextStep).toBeUndefined();
  });
});
