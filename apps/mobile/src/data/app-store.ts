import { Exercise, Workout, type LocalizedText } from '@workout/core';
import { create } from 'zustand';

import { docStore } from './doc-store';

export type LanguageSetting = 'system' | 'de' | 'en';

export type Settings = {
  language: LanguageSetting;
  /** Vorlauf vor dem ersten Step in Sekunden. */
  leadInSeconds: number;
  sound: boolean;
  vibration: boolean;
};

export const DEFAULT_SETTINGS: Settings = { language: 'system', leadInSeconds: 5, sound: true, vibration: true };

/** Ein absolviertes (oder abgebrochenes) Workout. */
export type Session = {
  id: string;
  workoutId: string;
  workoutName: LocalizedText;
  startedAt: number;
  finishedAt: number;
  completed: boolean;
  stepsDone: number;
  stepsTotal: number;
};

type AppState = {
  ready: boolean;
  workouts: Workout[];
  exercises: Exercise[];
  sessions: Session[];
  settings: Settings;
  init: () => Promise<void>;
  saveWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  saveExercises: (exercises: Exercise[]) => Promise<void>;
  addSession: (session: Session) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
};

/** Ungültige gespeicherte Dokumente werden übersprungen statt die App zu blockieren. */
function parseAll<T>(docs: { data: unknown }[], parse: (v: unknown) => T | undefined): T[] {
  return docs.flatMap((d) => {
    const v = parse(d.data);
    return v === undefined ? [] : [v];
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  workouts: [],
  exercises: [],
  sessions: [],
  settings: DEFAULT_SETTINGS,

  async init() {
    if (get().ready) return;
    const [workouts, exercises, sessions, settings] = await Promise.all([
      docStore.list('workouts'),
      docStore.list('exercises'),
      docStore.list<Session>('sessions'),
      docStore.list<Partial<Settings>>('settings'),
    ]);
    set({
      ready: true,
      workouts: parseAll(workouts, (v) => Workout.safeParse(v).data),
      exercises: parseAll(exercises, (v) => Exercise.safeParse(v).data),
      sessions: sessions.map((s) => s.data).sort((a, b) => b.startedAt - a.startedAt),
      settings: { ...DEFAULT_SETTINGS, ...settings.find((s) => s.id === 'app')?.data },
    });
  },

  async saveWorkout(workout) {
    await docStore.put('workouts', workout.id, workout);
    set({ workouts: [workout, ...get().workouts.filter((w) => w.id !== workout.id)] });
  },

  async deleteWorkout(id) {
    await docStore.remove('workouts', id);
    set({ workouts: get().workouts.filter((w) => w.id !== id) });
  },

  async saveExercises(exercises) {
    await Promise.all(exercises.map((e) => docStore.put('exercises', e.id, e)));
    const ids = new Set(exercises.map((e) => e.id));
    set({ exercises: [...exercises, ...get().exercises.filter((e) => !ids.has(e.id))] });
  },

  async addSession(session) {
    await docStore.put('sessions', session.id, session);
    set({ sessions: [session, ...get().sessions] });
  },

  async updateSettings(patch) {
    const settings = { ...get().settings, ...patch };
    await docStore.put('settings', 'app', settings);
    set({ settings });
  },
}));
