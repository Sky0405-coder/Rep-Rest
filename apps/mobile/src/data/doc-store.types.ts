/**
 * Einfacher Dokumentenspeicher: pro Sammlung ein Satz JSON-Dokumente.
 * `updatedAt` und Löschmarker sind schon für den späteren Server-Sync gedacht.
 */
export type Collection = 'workouts' | 'exercises' | 'sessions' | 'settings';

export type StoredDoc<T> = { id: string; data: T; updatedAt: number };

export interface DocStore {
  list<T>(collection: Collection): Promise<StoredDoc<T>[]>;
  put<T>(collection: Collection, id: string, data: T): Promise<void>;
  remove(collection: Collection, id: string): Promise<void>;
}
