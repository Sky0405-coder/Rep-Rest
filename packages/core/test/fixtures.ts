import { Exercise, type ExerciseInput } from '../src';

const raw: ExerciseInput[] = [
  { id: 'general.pushup', sportPack: 'general', name: { de: 'Liegestütz', en: 'Push-up' }, defaults: { mode: 'reps', reps: 10 } },
  { id: 'general.plank', sportPack: 'general', name: { de: 'Unterarmstütz', en: 'Plank' }, defaults: { mode: 'time', duration: 45 } },
  { id: 'general.lunge', sportPack: 'general', name: { de: 'Ausfallschritt', en: 'Lunge' }, sides: 'left_right', defaults: { mode: 'time', duration: 30 } },
];

export const exercises = new Map(raw.map((e) => [e.id, Exercise.parse(e)]));
export const getExercise = (id: string) => exercises.get(id);
