# Predaja projekta — Dolaznost, VK Beograd

Dokument za drugog Claudea (Claude Code / Cowork) koji nastavlja rad na ovom
projektu. Sadrži kontekst, donete odluke sa obrazloženjem, stanje koda i šta je
sledeće. Kod je u pratećem folderu `vk-dolaznost/`.

---

## 1. Šta se pravi i zašto

Vaterpolo klub u Beogradu, oko 30 igrača. Dva problema koja rešavamo:

1. **Najava dolaska** — trener pre termina ne zna koliko ljudi dolazi.
2. **Evidencija prisustva** — sa 30 ljudi je ručno zapisivanje ko je došao
   sporo i nepouzdano, a bez toga nema statistike kroz sezonu.

Korisnik (Petar, 22, Srbija, radi na srpskom) je prvo pitao može li Google
kalendar ili Forms, pa smo prošli kroz gotova rešenja (Spond, SportMember,
SportEasy). Odlučio je da pravi svoje. **Interfejs i sav kod su na srpskom**
(latinica) — nazivi funkcija, promenljivih, komentari i tekst na ekranu.
Zadrži to.

## 2. Ključne odluke i zašto (nemoj ih preokretati bez razloga)

| Odluka | Zašto |
|---|---|
| TypeScript, Next.js 15 App Router | Korisnik je predložio TS. Jedan jezik na obe strane. |
| **SQLite** (libSQL / `@libsql/client`), ne Postgres | Korisnik je tražio „samo fajl". Prvo je bio Postgres/Neon; prebačeno na SQLite jer je ekipa mala i hoće sve svoje. |
| **Vercel + Turso** (besplatno), Fly.io kao alternativa | Vercel nema trajni disk, pa SQLite fajl ne može tamo da živi; Turso je hostovani SQLite sa free planom. Lokalno i na Fly-u i dalje radi običan fajl — bira se preko `TURSO_DATABASE_URL`. |
| PIN + kolačić, bez mejlova i naloga | 30 ljudi neće praviti naloge. Ime sa spiska + 4 cifre; kolačić traje 180 dana. |
| Prozor za čekiranje (60 min pre, 30 posle) | Bez toga se polovina ekipe čekira iz kreveta i statistika ne vredi ništa. |
| Procenat se **ne čuva** u bazi | Računa se iz `participation` pri svakom prikazu, pa se ne može raziđe sa stvarnošću. Isti kod (`src/lib/statistika.ts`) hrani i ekran i Excel. |
| Server actions, ne REST API | Manje koda, tipovi se ne dupliraju. Jedini `route.ts` je Excel izvoz. |

Odbačeno svesno: čist SPA na Supabase (pravila bi živela kao RLS politike,
teže za izmenu), JSON fajl umesto baze (istovremeni upisi se gaze, nema
zaključavanja).

## 3. Model podataka

Tri tabele, `src/db/schema.ts`:

- **players** — `name`, `capNumber`, `role` (`igrac` | `trener`), `pinHash`
  (null dok ne postavi PIN), `active`
- **trainings** — `startsAt`, `durationMin`, `location`, `kind`
  (`trening` | `utakmica` | `teretana`), `checkinOpensMin`, `checkinClosesMin`,
  `canceled`
- **participation** — jedan red po paru (igrač, trening), jedinstven indeks na
  `(training_id, player_id)`. Dve nezavisne stvari u istom redu:
  - `rsvp` (`dolazim` | `ne_dolazim` | `mozda`) — šta je **najavio** unapred
  - `present` (bool, null = nije evidentirano) — da li je **stvarno bio**,
    plus `checkedInAt` i `markedBy` (`igrac` = sam se čekirao, `trener` = ručno)

Razlika između `rsvp` i `present` je namerna i korisna — trener vidi ko najavi
pa ne dođe. Ne spajaj ih.

SQLite tipovi: `integer` sa `mode: "boolean"` i `mode: "timestamp"` (sekunde).
Drizzle ih automatski pretvara u `boolean` i `Date` — provereno.

## 4. Struktura

```
src/db/schema.ts          tabele
src/db/index.ts           veza (libSQL klijent + drizzle), lenjo otvaranje
src/db/konfig.ts          Turso (env) ili lokalni fajl
src/lib/auth.ts           PIN (bcrypt) + JWT kolačić (jose), sesija(), trenerSesija()
src/lib/vreme.ts          beogradska zona, prozorOtvoren(), generisiTermine()
src/lib/statistika.ts     presek(od, do) -> redovi + matrica; koriste ga ekran i izvoz
src/app/akcije.ts         SVE izmene podataka (server actions)
src/app/login/            izbor imena + PIN (forma.tsx je client komponenta)
src/app/page.tsx          ekran igrača: naredni termini, najava, "Tu sam", moj procenat
src/app/trener/           pregled termina, jedan termin (štikliranje), statistika, spisak
src/app/api/izvoz/        Excel (exceljs): list "Dolaznost" (matrica) + "Sirovi podaci"
drizzle/                  SQL migracije — ide u git, iz njega se diže baza na serveru
scripts/migracija.mjs     primenjuje migracije (čist JS, pokreće se i u Dockeru pri startu)
scripts/seed.mjs          pravi spisak ekipe
scripts/demo.mjs          izmišljeni podaci za pregled izgleda
Dockerfile, fly.toml      hosting
```

## 5. Stanje — šta je provereno

- `npx tsc --noEmit` prolazi bez greške.
- `next build` prolazi; sve rute su dinamičke (`ƒ`) osim `_not-found`.
- Standalone server pokrenut nad pravim SQLite fajlom: `/login` prikazuje spisak
  iz baze, `/` bez sesije vraća 307 na `/login`.
- Provereno u radu: datumi se vraćaju kao `Date`, `present` kao `boolean`,
  `onConflictDoUpdate` ne pravi duplikat pri najavi pa čekiranju, `presek()`
  ne broji buduće termine, `prozorOtvoren()` tačan, generator rasporeda daje
  13 termina za septembar (pon/sre/pet).

**Nije provereno:** izgled u pravom pretraživaču (font se povlači sa Google
Fonts, mreža u sandboxu je bila zatvorena), sam `fly deploy`, Excel fajl otvoren
u Excelu.

## 6. Poznate rupe / šta je sledeće

1. **Push obaveštenja (web push)** — najveći dobitak. Podsetnik dan pre termina
   je ono što tera ljude da se izjasne; bez toga aplikacija zavisi od toga da
   se neko seti da je otvori. Traži service worker i VAPID ključeve.
2. **Rezervna kopija** je ručna (`turso db shell ... .dump`).
3. **Nema zaključavanja čekiranja na lokaciju** — ako se pojavi čekiranje iz
   autobusa, sledeći korak je QR kod koji trener prikaže na bazenu.
4. **Nema izmene termina** — samo dodavanje i otkazivanje.
5. Ako se koristi Fly umesto Vercela: `fly scale count` mora ostati 1 — disk se
   kači na jednu mašinu, druga bi dobila svoju praznu bazu.

## 7. Pokretanje

```bash
npm install
cp .env.example .env      # popuni AUTH_SECRET
npm run db:migrate
npm run demo              # ili: npm run seed  za pravi spisak
npm run dev
```

Detalji i postupak za Vercel + Turso su u `README.md`.
