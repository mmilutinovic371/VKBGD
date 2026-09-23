import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { bazaKonfig } from "./konfig";

let vezaSingleton: ReturnType<typeof napraviVezu> | undefined;

function napraviVezu() {
  const klijent = createClient(bazaKonfig());
  return drizzle(klijent, { schema });
}

// Lenjo otvaranje — baza se ne dira dok neko stvarno ne upita nešto (build ne
// otvara vezu ka bazi koja možda još ne postoji).
export function db() {
  if (!vezaSingleton) {
    vezaSingleton = napraviVezu();
  }
  return vezaSingleton;
}
