import fs from "node:fs";
import path from "node:path";

/** Ista logika kao src/db/konfig.ts, u čistom JS za skripte. */
export function bazaKonfig() {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    return { url, authToken: process.env.TURSO_AUTH_TOKEN };
  }
  const fajl = process.env.DATABASE_FILE ?? "./podaci/vk.db";
  fs.mkdirSync(path.dirname(fajl), { recursive: true });
  return { url: `file:${fajl}` };
}

export function opisBaze() {
  return process.env.TURSO_DATABASE_URL || process.env.DATABASE_FILE || "./podaci/vk.db";
}
