/**
 * Primenjuje SQL migracije iz ./drizzle na fajl baze. Čist JS (bez tsx) da bi
 * mogao da se pokrene i u Dockeru pri startu kontejnera.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";

const fajl = process.env.DATABASE_FILE ?? "./podaci/vk.db";
fs.mkdirSync(path.dirname(fajl), { recursive: true });

const sqlite = new Database(fajl);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const baza = drizzle(sqlite);
migrate(baza, { migrationsFolder: "./drizzle" });

console.log(`Migracije primenjene na ${fajl}`);
sqlite.close();
