import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

const dataDir = path.join(process.cwd(), 'data');
const skinsDir = path.join(dataDir, 'skins');
const capesDir = path.join(dataDir, 'capes');

for (const dir of [dataDir, skinsDir, capesDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const dbPath = path.join(dataDir, 'db.sqlite');

const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });

export { schema };
export { skinsDir, capesDir, dataDir };
