import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

let vezaSingleton: ReturnType<typeof napraviVezu> | undefined;

function napraviVezu() {
  const fajl = process.env.DATABASE_FILE ?? "./podaci/vk.db";
  const sqlite = new Database(fajl);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  return drizzle(sqlite, { schema });
}

// Lenjo otvaranje — baza se ne dira dok neko stvarno ne upita nešto (build ne
// otvara fajl koji možda još ne postoji).
export function db() {
  if (!vezaSingleton) {
    vezaSingleton = napraviVezu();
  }
  return vezaSingleton;
}
