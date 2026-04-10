import { db } from './index';
import { sql } from 'drizzle-orm';

export async function ensureTables() {
  await db.run(sql`CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS skin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT '',
    name TEXT,
    slim INTEGER NOT NULL DEFAULT 0,
    type TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    source TEXT,
    file_hash TEXT NOT NULL,
    file_path TEXT NOT NULL,
    texture_sha256 TEXT,
    linked_cape_id INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS cape (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT '',
    name TEXT,
    type TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    source TEXT,
    file_hash TEXT NOT NULL,
    file_path TEXT NOT NULL,
    texture_sha256 TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL UNIQUE,
    skin_id INTEGER,
    cape_id INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS token (
    access_token TEXT PRIMARY KEY,
    client_token TEXT NOT NULL,
    user_id TEXT NOT NULL,
    profile_id TEXT,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS setting (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  // default settings
  await db.run(sql`INSERT OR IGNORE INTO setting (key, value) VALUES ('siteName', 'MSLibrary')`);
  await db.run(sql`INSERT OR IGNORE INTO setting (key, value) VALUES ('allowRegistration', 'true')`);
  await db.run(sql`INSERT OR IGNORE INTO setting (key, value) VALUES ('turnstileSiteKey', '')`);
  await db.run(sql`INSERT OR IGNORE INTO setting (key, value) VALUES ('turnstileSecretKey', '')`);
}
