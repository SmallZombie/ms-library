import { ensureTables } from './migrate';

let initialized = false;

export async function initDb() {
  if (initialized) return;
  await ensureTables();
  initialized = true;
}
