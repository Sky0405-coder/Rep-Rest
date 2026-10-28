import { describe, expect, it } from 'vitest';
import { initialPlayerState, playerReducer, predictTicks, type PlayerConfig, type Step } from '../src';

const step = (duration?: number, reps?: number): Step => ({
  kind: 'exercise',
  blockType: 'exercise',
  exerciseId: 'general.x',
  duration,
  reps,
  rounds: [],
  groups: [],
});

const config: PlayerConfig = { leadInSeconds: 3, cueSeconds: 2 };

describe('predictTicks', () => {
  it('sagt Vorlauf, Cues, Wechsel und Ende mit Zeitpunkten voraus', () => {
    const steps = [step(4), step(3)];
    const started = playerReducer(initialPlayerState(), { type: 'start', now: 1000 }, steps, config).state;
    const ticks = predictTicks(started, steps, config, 1000);
    const flat = ticks.flatMap((t) => t.events.map((e) => [t.at, e.type === 'cue' ? `cue${e.secondsLeft}` : e.type]));
    expect(flat).toEqual([
      [1000, 'cue3'],
      [2000, 'cue2'],
      [3000, 'cue1'],
      [4000, 'stepStart'],
      [6000, 'cue2'],
      [7000, 'cue1'],
      [8000, 'stepEnd'],
      [8000, 'stepStart'],
      [9000, 'cue2'],
      [10000, 'cue1'],
      [11000, 'stepEnd'],
      [11000, 'done'],
    ]);
    expect(ticks.at(-1)?.state.status).toBe('done');
  });

  it('stimmt mit fein getaktetem Reducer überein', () => {
    const steps = [step(7), step(1), step(0), step(5)];
    const cfg = { leadInSeconds: 5, cueSeconds: 3 };
    let s = playerReducer(initialPlayerState(), { type: 'start', now: 0 }, steps, cfg).state;
    const predicted = predictTicks(s, steps, cfg, 0).flatMap((t) => t.events);
    const actual = [];
    for (let t = 0; t <= 30000; t += 50) {
      const r = playerReducer(s, { type: 'tick', now: t }, steps, cfg);
      s = r.state;
      actual.push(...r.events);
    }
    expect(predicted).toEqual(actual);
  });

  it('hält bei manuellen Steps und in der Pause an', () => {
    const steps = [step(2), step(undefined, 10), step(5)];
    const cfg = { leadInSeconds: 0, cueSeconds: 3 };
    const r = playerReducer(initialPlayerState(), { type: 'start', now: 0 }, steps, cfg);
    const ticks = predictTicks(r.state, steps, cfg, 0);
    expect(ticks.at(-1)?.events.at(-1)).toEqual({ type: 'stepStart', stepIndex: 1 });
    const paused = playerReducer(r.state, { type: 'pause', now: 500 }, steps, cfg).state;
    expect(predictTicks(paused, steps, cfg, 500)).toEqual([]);
  });
});
