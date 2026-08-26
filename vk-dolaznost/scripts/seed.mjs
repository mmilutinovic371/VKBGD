/**
 * Upisuje pravi spisak ekipe. Izmeni IMENA ispod pre pokretanja.
 * Pokreni samo jednom, na praznoj bazi (npm run db:migrate pa onda ovo).
 *
 * PIN-ovi su unapred postavljeni (niko ne bira svoj pri prvoj prijavi):
 * igrači dobijaju PODRAZUMEVANI_PIN, trener svoj poseban TRENER_PIN.
 * Trener kasnije može da resetuje bilo čiji PIN na /trener/igraci — posle
 * reseta, ta osoba sama bira nov PIN pri sledećoj prijavi.
 */
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const TRENER = "Petar Boscanin";
const TRENER_PIN = "1978";
const PODRAZUMEVANI_PIN = "1234";

const IMENA = [
  // "Ime Prezime",
];

const db = new Database(process.env.DATABASE_FILE ?? "./podaci/vk.db");
db.pragma("foreign_keys = ON");

if (db.prepare("select count(*) as n from players").get().n > 0) {
  console.log("Baza nije prazna — obriši fajl pa pokreni ponovo.");
  process.exit(0);
}

if (IMENA.length === 0) {
  console.log("Spisak je prazan — otvori scripts/seed.mjs i upiši imena ekipe u IMENA.");
  process.exit(1);
}

const sada = Math.floor(Date.now() / 1000);
const upisiIgraca = db.prepare(
  "insert into players (name, cap_number, role, pin_hash, active, created_at) values (?, ?, ?, ?, 1, ?)",
);

db.transaction(() => {
  upisiIgraca.run(TRENER, null, "trener", bcrypt.hashSync(TRENER_PIN, 10), sada);
  const igracHash = bcrypt.hashSync(PODRAZUMEVANI_PIN, 10);
  IMENA.forEach((ime, i) => upisiIgraca.run(ime, i + 1, "igrac", igracHash, sada));
})();

console.log(`Upisano ${IMENA.length} igrača (PIN ${PODRAZUMEVANI_PIN}) i trener "${TRENER}" (PIN ${TRENER_PIN}).`);
db.close();
