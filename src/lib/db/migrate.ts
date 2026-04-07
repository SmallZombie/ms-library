import { db } from './index';
import { sql } from 'drizzle-orm';

export async function ensureTables() {
  await db.run(sql`CREATE TABLE IF NOT EXISTS skin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    slim INTEGER NOT NULL DEFAULT 0,
    type TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    source TEXT,
    file_hash TEXT NOT NULL,
    file_path TEXT NOT NULL,
    linked_cape_id INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS cape (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    source TEXT,
    file_hash TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
}
