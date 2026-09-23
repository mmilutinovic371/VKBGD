/**
 * Upisuje pravi spisak ekipe. Izmeni IMENA ispod pre pokretanja.
 * Pokreni samo jednom, na praznoj bazi (npm run db:migrate pa onda ovo).
 * Za Turso: postavi TURSO_DATABASE_URL i TURSO_AUTH_TOKEN u .env pa pokreni
 * sa svog računara — skripta piše direktno u hostovanu bazu.
 *
 * PIN-ovi su unapred postavljeni (niko ne bira svoj pri prvoj prijavi):
 * igrači dobijaju PODRAZUMEVANI_PIN, trener svoj poseban TRENER_PIN.
 * Trener kasnije može da resetuje bilo čiji PIN na /trener/igraci — posle
 * reseta, ta osoba sama bira nov PIN pri sledećoj prijavi.
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { bazaKonfig } from "./konfig.mjs";

const TRENER = "Petar Boscanin";
const TRENER_PIN = "1978";
const PODRAZUMEVANI_PIN = "1234";

const IMENA = [
  // "Ime Prezime",
];

const db = createClient(bazaKonfig());
await db.execute("pragma foreign_keys = ON");

const { rows } = await db.execute("select count(*) as n from players");
if (Number(rows[0].n) > 0) {
  console.log("Baza nije prazna — obriši podatke pa pokreni ponovo.");
  process.exit(0);
}

if (IMENA.length === 0) {
  console.log("Spisak je prazan — otvori scripts/seed.mjs i upiši imena ekipe u IMENA.");
  process.exit(1);
}

const sada = Math.floor(Date.now() / 1000);
const upis =
  "insert into players (name, cap_number, role, pin_hash, active, created_at) values (?, ?, ?, ?, 1, ?)";

const igracHash = bcrypt.hashSync(PODRAZUMEVANI_PIN, 10);
await db.batch(
  [
    { sql: upis, args: [TRENER, null, "trener", bcrypt.hashSync(TRENER_PIN, 10), sada] },
    ...IMENA.map((ime, i) => ({ sql: upis, args: [ime, i + 1, "igrac", igracHash, sada] })),
  ],
  "write",
);

console.log(`Upisano ${IMENA.length} igrača (PIN ${PODRAZUMEVANI_PIN}) i trener "${TRENER}" (PIN ${TRENER_PIN}).`);
db.close();
