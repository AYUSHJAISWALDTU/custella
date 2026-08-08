import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import migrations from '../../drizzle/migrations';
import * as schema from './schema';

/**
 * One connection, opened once, for the life of the app.
 *
 * `enableChangeListener` is what makes `useLiveQuery` work: SQLite reports its own
 * writes, React re-renders from them, and no screen ever needs to know that a write
 * happened somewhere else. That is the whole reason this app needs no client cache
 * and no global store for data.
 */
const sqlite = openDatabaseSync('custella.db', { enableChangeListener: true });

// WAL lets a read run while a write is in flight. On a 3GB Android phone with a
// list on screen and the sync worker draining the outbox, that is the difference
// between a smooth scroll and a stutter.
sqlite.execSync('PRAGMA journal_mode = WAL;');
// Without this SQLite does not enforce foreign keys at all — it is off by default.
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });
export { migrations, schema, sqlite };
export type Database = typeof db;
