import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const skins = sqliteTable('skin', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  slim: integer('slim', { mode: 'boolean' }).notNull().default(false),
  type: text('type'),
  tags: text('tags', { mode: 'json' }).notNull().$type<string[]>().default([]),
  source: text('source'),
  fileHash: text('file_hash').notNull(),
  filePath: text('file_path').notNull(),
  linkedCapeId: integer('linked_cape_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const capes = sqliteTable('cape', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  type: text('type'),
  tags: text('tags', { mode: 'json' }).notNull().$type<string[]>().default([]),
  source: text('source'),
  fileHash: text('file_hash').notNull(),
  filePath: text('file_path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
