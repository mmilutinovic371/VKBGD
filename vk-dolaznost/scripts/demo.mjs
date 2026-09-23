/**
 * Puni bazu izmišljenim podacima da možeš da vidiš kako aplikacija izgleda kad
 * je puna. NE pokreći na pravoj bazi.
 *
 *   DATABASE_FILE=./podaci/demo.db node scripts/migracija.mjs
 *   DATABASE_FILE=./podaci/demo.db node scripts/demo.mjs
 *   DATABASE_FILE=./podaci/demo.db npm run dev
 *
 * Pravi 30 igrača, jednog trenera, 12 odigranih termina sa nasumičnim
 * prisustvom, jedan termin koji počinje za 10 minuta (da vidiš dugme
 * "Tu sam") i 6 budućih termina.
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import { bazaKonfig } from "./konfig.mjs";

const IMENA = [
  "Nikola Jovanović", "Marko Petrović", "Stefan Nikolić", "Luka Đorđević",
  "Miloš Stojanović", "Vuk Ilić", "Aleksa Marković", "Filip Pavlović",
  "Uroš Simić", "Lazar Ristić", "Dušan Todorović", "Nemanja Kostić",
  "Bogdan Vasić", "Petar Olujić", "Vasilije Mitrović", "Andrej Živković",
  "Ognjen Popović", "Mihajlo Lukić", "Strahinja Milošević", "Relja Đukić",
  "Pavle Radovanović", "Danilo Savić", "Vukašin Blagojević", "Jovan Perić",
  "Aleksandar Tomić", "Matija Janković", "Vladimir Obradović", "Damjan Krstić",
  "Sergej Milić", "Teodor Radić",
];

const db = createClient(bazaKonfig());
await db.execute("pragma foreign_keys = ON");

const { rows } = await db.execute("select count(*) as n from players");
if (Number(rows[0].n) > 0) {
  console.log("Baza nije prazna — obriši podatke pa pokreni ponovo.");
  process.exit(0);
}

const sat = 3600;
const sada = Math.floor(Date.now() / 1000);
const danas19h = () => {
  const d = new Date();
  d.setHours(19, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
};

const tx = await db.transaction("write");
const upisiIgraca = (...args) =>
  tx.execute({
    sql: "insert into players (name, cap_number, role, active, created_at) values (?, ?, ?, 1, ?)",
    args,
  });
const upisiTermin = (...args) =>
  tx.execute({
    sql: "insert into trainings (starts_at, duration_min, location, kind, canceled, checkin_opens_min, checkin_closes_min) values (?, 90, ?, ?, 0, 60, 30)",
    args,
  });
const upisiUcesce = (...args) =>
  tx.execute({
    sql: "insert into participation (training_id, player_id, rsvp, rsvp_at, present, checked_in_at, marked_by) values (?, ?, ?, ?, ?, ?, ?)",
    args,
  });

try {
  await upisiIgraca("Trener Petrović", null, "trener", sada);
  for (const [i, ime] of IMENA.entries()) await upisiIgraca(ime, i + 1, "igrac", sada);

  const igraci = (await tx.execute("select id from players where role = 'igrac'")).rows;

  // 12 odrzanih termina, svaki drugi dan unazad
  for (let i = 12; i >= 1; i--) {
    const kada = danas19h() - i * 2 * 24 * sat;
    const { lastInsertRowid: tid } = await upisiTermin(kada, "Bazen Beograd", "trening");
    for (const g of igraci) {
      // svaki igrac ima svoju "urednost" — neki dolaze uvek, neki retko
      const urednost = 0.45 + ((Number(g.id) * 37) % 55) / 100;
      const bio = Math.random() < urednost;
      await upisiUcesce(
        tid, g.id,
        bio ? "dolazim" : Math.random() < 0.5 ? "ne_dolazim" : null,
        kada - 12 * sat,
        bio ? 1 : 0,
        bio ? kada - 600 : null,
        bio ? "igrac" : "trener",
      );
    }
  }

  // termin koji pocinje za 10 minuta — prozor za cekiranje je otvoren
  const uskoro = sada + 10 * 60;
  const { lastInsertRowid: sledeci } = await upisiTermin(uskoro, "Bazen Beograd", "trening");
  for (const g of igraci.slice(0, 18)) {
    await upisiUcesce(sledeci, g.id, "dolazim", sada - sat, null, null, null);
  }

  // 6 buducih termina
  for (let i = 1; i <= 6; i++) {
    await upisiTermin(
      danas19h() + i * 2 * 24 * sat, "Bazen Beograd",
      i === 3 ? "utakmica" : "trening",
    );
  }
  await tx.commit();
} catch (e) {
  await tx.rollback();
  throw e;
}

console.log("Demo podaci upisani.");
console.log("Prijavi se kao bilo koje ime sa spiska, PIN biraš sam (npr. 1111).");
console.log("Za trenerski pregled izaberi 'Trener Petrović'.");
db.close();
