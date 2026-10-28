import { predictTicks, type PlayerConfig, type PlayerEvent, type PlayerState, type Step } from '@workout/core';
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import { hapticFor, soundFor, type Haptic, type Sound } from './feedback';

/**
 * Nativer Workout-Dienst (nur Android, `modules/workout-session`): spielt Töne und
 * Vibration nach einem vorausberechneten Fahrplan, auch bei gesperrtem Bildschirm,
 * und zeigt Übung und Countdown als Benachrichtigung. Ohne ihn (Web, iOS) spielt JS.
 */
type WorkoutSessionModule = {
  start(channelName: string): void;
  update(json: string): void;
  stop(): void;
  requestNotificationPermission(): Promise<unknown>;
};

export const nativeSession =
  Platform.OS === 'android' ? requireOptionalNativeModule<WorkoutSessionModule>('WorkoutSession') : null;

export type Notice = { title: string; text: string; endsAt: number | null };

type Cue = { at: number; sound?: Sound; haptic?: Haptic; notice?: Notice; finish?: boolean };

type ScheduleInput = {
  state: PlayerState;
  /** Ereignisse der gerade ausgeführten Aktion, sie werden sofort gespielt. */
  events: PlayerEvent[];
  now: number;
  steps: readonly Step[];
  config: PlayerConfig;
  sound: boolean;
  vibration: boolean;
  describe: (state: PlayerState) => Notice;
};

/** Fahrplan ab jetzt bis zum Ende, zum nächsten manuellen Step oder zur Pause. */
export function buildSchedule({ state, events, now, steps, config, sound, vibration, describe }: ScheduleInput) {
  const ticks = [{ at: now, events, state }];
  for (const tick of predictTicks(state, steps, config, now)) {
    const last = ticks[ticks.length - 1]!;
    if (tick.at === last.at) ticks[ticks.length - 1] = { at: tick.at, events: [...last.events, ...tick.events], state: tick.state };
    else ticks.push(tick);
  }

  const cues: Cue[] = [];
  for (const tick of ticks) {
    const cue: Cue = { at: tick.at };
    const s = soundFor(tick.events);
    if (s && sound) cue.sound = s;
    if (s && vibration) cue.haptic = hapticFor(s);
    if (tick.events.some((e) => e.type === 'stepStart' || e.type === 'done')) cue.notice = describe(tick.state);
    if (tick.events.some((e) => e.type === 'done')) cue.finish = true;
    if (Object.keys(cue).length > 1) cues.push(cue);
  }
  return { notice: describe(state), cues };
}
