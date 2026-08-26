/**
 * Upisuje pravi spisak ekipe. Izmeni IMENA i TRENER ispod pre pokretanja.
 * Pokreni samo jednom, na praznoj bazi (npm run db:migrate pa onda ovo).
 */
import Database from "better-sqlite3";

const TRENER = "Trener";

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
  "insert into players (name, cap_number, role, active, created_at) values (?, ?, ?, 1, ?)",
);

db.transaction(() => {
  upisiIgraca.run(TRENER, null, "trener", sada);
  IMENA.forEach((ime, i) => upisiIgraca.run(ime, i + 1, "igrac", sada));
})();

console.log(`Upisano ${IMENA.length} igrača i trener "${TRENER}".`);
console.log("Svako se prijavljuje svojim imenom, PIN bira sam pri prvoj prijavi.");
db.close();
