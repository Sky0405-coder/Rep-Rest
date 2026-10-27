import type { Collection, DocStore, StoredDoc } from './doc-store.types';

// Web-Implementierung mit localStorage. SQLite im Browser bräuchte WASM und
// spezielle HTTP-Header (COOP/COEP); für die Datenmengen hier reicht localStorage.

type Entry = { data: unknown; updatedAt: number; deleted: boolean };

const key = (c: Collection) => `represt:${c}`;

function read(c: Collection): Record<string, Entry> {
  try {
    return JSON.parse(localStorage.getItem(key(c)) ?? '{}') as Record<string, Entry>;
  } catch {
    return {};
  }
}

function write(c: Collection, value: Record<string, Entry>) {
  localStorage.setItem(key(c), JSON.stringify(value));
}

export const docStore: DocStore = {
  async list<T>(collection: Collection) {
    return Object.entries(read(collection))
      .filter(([, e]) => !e.deleted)
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
      .map(([id, e]): StoredDoc<T> => ({ id, data: e.data as T, updatedAt: e.updatedAt }));
  },
  async put(collection, id, data) {
    const all = read(collection);
    all[id] = { data, updatedAt: Date.now(), deleted: false };
    write(collection, all);
  },
  async remove(collection, id) {
    const all = read(collection);
    const entry = all[id];
    if (entry) all[id] = { ...entry, updatedAt: Date.now(), deleted: true };
    write(collection, all);
  },
};
