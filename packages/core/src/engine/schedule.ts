import { playerReducer, type PlayerConfig, type PlayerEvent, type PlayerState } from './player';
import type { Step } from './timeline';

export type ScheduledTick = {
  /** Zeitpunkt (ms), an dem der Takt die Ereignisse auslöst. */
  at: number;
  events: PlayerEvent[];
  /** Player-Zustand direkt nach diesem Takt. */
  state: PlayerState;
};

/**
 * Sagt voraus, welche Ereignisse der Player ab `now` auslöst, solange niemand eingreift.
 * Endet beim Workout-Ende, bei einem manuellen Step (Wiederholungen) oder in der Pause.
 * Damit kann ein nativer Dienst Töne auch dann pünktlich spielen, wenn JS im
 * Hintergrund schläft.
 */
export function predictTicks(
  state: PlayerState,
  steps: readonly Step[],
  config: PlayerConfig,
  now: number,
  limit = 5000,
): ScheduledTick[] {
  const out: ScheduledTick[] = [];
  let s = state;
  let t = now;
  // Erster Takt genau jetzt: fällige Cues (z. B. der erste Vorlauf-Beep) sofort.
  for (let i = 0; i < limit; i++) {
    const r = playerReducer(s, { type: 'tick', now: t }, steps, config);
    s = r.state;
    if (r.events.length > 0) out.push({ at: t, events: r.events, state: s });
    if ((s.status !== 'countdown' && s.status !== 'running') || s.endsAt === null) break;
    // Nächster interessanter Zeitpunkt: volle Sekunde vor Phasenende (Cue) oder das Ende selbst.
    const cueMax = s.status === 'countdown' ? Infinity : config.cueSeconds;
    const k = Math.min(Math.ceil((s.endsAt - t) / 1000) - 1, cueMax);
    t = s.endsAt - k * 1000;
  }
  return out;
}
