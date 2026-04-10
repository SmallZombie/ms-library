import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const skins = sqliteTable('skin', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  name: text('name'),
  slim: integer('slim', { mode: 'boolean' }).notNull().default(false),
  type: text('type'),
  tags: text('tags', { mode: 'json' }).notNull().$type<string[]>().default([]),
  source: text('source'),
  fileHash: text('file_hash').notNull(),
  filePath: text('file_path').notNull(),
  textureSha256: text('texture_sha256'),
  linkedCapeId: integer('linked_cape_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const capes = sqliteTable('cape', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  name: text('name'),
  type: text('type'),
  tags: text('tags', { mode: 'json' }).notNull().$type<string[]>().default([]),
  source: text('source'),
  fileHash: text('file_hash').notNull(),
  filePath: text('file_path').notNull(),
  textureSha256: text('texture_sha256'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const profiles = sqliteTable('profile', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull().unique(),
  skinId: integer('skin_id'),
  capeId: integer('cape_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const tokens = sqliteTable('token', {
  accessToken: text('access_token').primaryKey(),
  clientToken: text('client_token').notNull(),
  userId: text('user_id').notNull(),
  profileId: text('profile_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const settings = sqliteTable('setting', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
