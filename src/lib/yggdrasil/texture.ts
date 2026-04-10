import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db, schema, dataDir } from '@/lib/db';
import { eq } from 'drizzle-orm';

export function computeSha256(filePath: string): string {
  const absolutePath = path.join(dataDir, filePath);
  const data = fs.readFileSync(absolutePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function ensureTextureSha256(
  table: 'skins' | 'capes',
  id: number,
  filePath: string
): Promise<string> {
  const tbl = table === 'skins' ? schema.skins : schema.capes;
  const rows = await db.select({ textureSha256: tbl.textureSha256 })
    .from(tbl)
    .where(eq(tbl.id, id))
    .limit(1);

  if (rows[0]?.textureSha256) return rows[0].textureSha256;

  const sha256 = computeSha256(filePath);
  await db.update(tbl).set({ textureSha256: sha256 }).where(eq(tbl.id, id));
  return sha256;
}

export function getTextureUrl(host: string, sha256: string): string {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}/api/yggdrasil/textures/${sha256}`;
}

export async function findFileByHash(sha256: string): Promise<string | null> {
  const skin = await db.select({ filePath: schema.skins.filePath })
    .from(schema.skins)
    .where(eq(schema.skins.textureSha256, sha256))
    .limit(1);
  if (skin[0]) return path.join(dataDir, skin[0].filePath);

  const cape = await db.select({ filePath: schema.capes.filePath })
    .from(schema.capes)
    .where(eq(schema.capes.textureSha256, sha256))
    .limit(1);
  if (cape[0]) return path.join(dataDir, cape[0].filePath);

  return null;
}
