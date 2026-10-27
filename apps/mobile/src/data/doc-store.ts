import * as SQLite from 'expo-sqlite';

import type { Collection, DocStore, StoredDoc } from './doc-store.types';

// Native Implementierung (Android/iOS) mit SQLite. Im Web wird doc-store.web.ts verwendet.

let dbPromise: Promise<SQLite.SQLiteDatabase> | undefined;

function db(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= SQLite.openDatabaseAsync('represt.db').then(async (d) => {
    await d.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS docs (
        collection TEXT NOT NULL,
        id TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (collection, id)
      );
    `);
    return d;
  });
  return dbPromise;
}

type Row = { id: string; data: string; updated_at: number };

export const docStore: DocStore = {
  async list<T>(collection: Collection) {
    const rows = await (await db()).getAllAsync<Row>(
      'SELECT id, data, updated_at FROM docs WHERE collection = ? AND deleted = 0 ORDER BY updated_at DESC',
      collection,
    );
    return rows.map((r): StoredDoc<T> => ({ id: r.id, data: JSON.parse(r.data) as T, updatedAt: r.updated_at }));
  },
  async put(collection, id, data) {
    await (await db()).runAsync(
      `INSERT INTO docs (collection, id, data, updated_at, deleted) VALUES (?, ?, ?, ?, 0)
       ON CONFLICT (collection, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, deleted = 0`,
      collection,
      id,
      JSON.stringify(data),
      Date.now(),
    );
  },
  async remove(collection, id) {
    await (await db()).runAsync(
      'UPDATE docs SET deleted = 1, updated_at = ? WHERE collection = ? AND id = ?',
      Date.now(),
      collection,
      id,
    );
  },
};
