import { db, schema } from './db';
import { eq } from 'drizzle-orm';

export type SettingKey = 'siteName' | 'siteUrl' | 'allowRegistration' | 'turnstileEnabled' | 'turnstileSiteKey' | 'turnstileSecretKey';

const cache = new Map<string, { value: string; ts: number }>();
const CACHE_TTL = 30_000;

export async function getSetting(key: SettingKey): Promise<string> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.value;
  }

  const row = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
  const value = row[0]?.value ?? '';
  cache.set(key, { value, ts: Date.now() });
  return value;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await db.insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  cache.set(key, { value, ts: Date.now() });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(schema.settings);
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
    cache.set(row.key, { value: row.value, ts: Date.now() });
  }
  return result;
}
