/**
 * Primenjuje SQL migracije iz ./drizzle na bazu (Turso ili lokalni fajl).
 * Čist JS (bez tsx) da bi mogao da se pokrene i u Dockeru pri startu kontejnera.
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { bazaKonfig, opisBaze } from "./konfig.mjs";

const klijent = createClient(bazaKonfig());
const baza = drizzle(klijent);
await migrate(baza, { migrationsFolder: "./drizzle" });

console.log(`Migracije primenjene na ${opisBaze()}`);
klijent.close();
