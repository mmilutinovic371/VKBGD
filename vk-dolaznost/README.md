# Dolaznost — VK Beograd

Lagana web aplikacija: igrači najavljuju dolazak i sami se čekiraju na bazenu,
trener vidi ko je kada bio i izvozi sve u Excel.

## Šta radi

- **Igrač:** otvori link, izabere svoje ime i PIN (jednom po sezoni), vidi naredne
  termine, klikne *Dolazim / Možda / Ne dolazim*, a na bazenu *Tu sam*.
- **Prozor za čekiranje:** dugme *Tu sam* radi samo od 60 min pre do 30 min posle
  početka termina. Bez toga se pola ekipe čekira iz kreveta.
- **Trener:** upisuje termine (pojedinačno ili nedeljni raspored), ispravlja
  prisustvo sa dva dugmeta po igraču, gleda procenat dolaznosti po igraču.
- **Excel:** dva lista — matrica igrači × termini sa procentom, i sirovi redovi
  spremni za pivot tabelu.

## Pokretanje lokalno

```bash
npm install
cp .env.example .env        # popuni AUTH_SECRET
npm run db:migrate          # pravi fajl baze ./podaci/vk.db
npm run seed                # upisuje spisak ekipe (izmeni scripts/seed.mjs)
npm run dev                 # http://localhost:3000
```

`AUTH_SECRET` generiši sa:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Baza

SQLite preko libSQL (`@libsql/client`). Lokalno je to običan fajl
`./podaci/vk.db`; na Vercelu je hostovana Turso baza (isti SQLite, samo preko
mreže). Bira se automatski: ako je postavljen `TURSO_DATABASE_URL`, koristi se
Turso, inače fajl iz `DATABASE_FILE`.

Kad promeniš `src/db/schema.ts`:

```bash
npm run db:generate         # napravi SQL migraciju u ./drizzle
npm run db:migrate          # primeni je
```

Folder `drizzle/` ide u git. `npm run build` prvo primenjuje migracije pa tek
onda gradi Next, tako da Vercel sam ažurira bazu pri svakom deploy-u.

## Objavljivanje (besplatno): Vercel + Turso

Vercel Hobby i Turso free plan su više nego dovoljni za jedan klub, bez kartice.

**1. Baza na Turso**

```bash
curl -sSfL https://get.tur.so/install.sh | bash     # ili: brew install tursodatabase/tap/turso
turso auth signup
turso db create vk-dolaznost --location fra          # Frankfurt
turso db show vk-dolaznost --url                      # -> libsql://vk-dolaznost-xxx.turso.io
turso db tokens create vk-dolaznost                   # -> eyJ... (auth token)
```

Upiši oba u lokalni `.env` (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`), pa iz
svog računara napuni bazu:

```bash
npm run db:migrate          # pravi tabele u Turso bazi
npm run seed                # upisuje spisak ekipe (prvo izmeni scripts/seed.mjs)
```

**2. Aplikacija na Vercel**

1. [vercel.com](https://vercel.com) → *Sign up with GitHub* → *Add New → Project*
   → izaberi repo `VKBGD`.
2. **Root Directory:** `vk-dolaznost` (bitno — aplikacija nije u korenu repoa).
3. *Environment Variables* — dodaj tri:
   - `AUTH_SECRET` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `TURSO_DATABASE_URL` — iz `turso db show --url`
   - `TURSO_AUTH_TOKEN` — iz `turso db tokens create`
4. *Deploy*. Dobiješ `https://vkbgd.vercel.app` (ili slično), HTTPS uključen.

Svaki sledeći `git push` na `main` sam pravi nov deploy. Pošalji link ekipi i
neka ga sačuvaju na početni ekran telefona (Podeli → Dodaj na početni ekran).

### Rezervna kopija

```bash
turso db shell vk-dolaznost .dump > kopija-$(date +%F).sql
```

Uradi to na kraju svakog meseca. Fajl je mali, staje u mejl.

## Alternativa: Fly.io (plaćeno, ~3 $/mes)

Dockerfile i fly.toml su i dalje tu; aplikacija bez `TURSO_DATABASE_URL`
koristi fajl `/data/vk.db` na Fly disku.

```bash
fly launch --no-deploy
fly volumes create vk_podaci --size 1 --region fra
fly secrets set AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
fly deploy
fly scale count 1                   # obavezno tačno jedna mašina (disk ide uz jednu)
fly ssh console -C "node scripts/seed.mjs"
```

## Struktura

```
src/db/schema.ts        tri tabele: players, trainings, participation
src/db/index.ts         veza ka bazi (libSQL: Turso ili lokalni fajl)
src/db/konfig.ts        odakle se čita baza (env promenljive)
src/lib/auth.ts         PIN + potpisani kolačić (bez mejlova i naloga)
src/lib/vreme.ts        beogradska zona, prozor za čekiranje, generator rasporeda
src/lib/statistika.ts   računanje dolaznosti (koriste ga i ekran i izvoz)
src/app/akcije.ts       sve izmene podataka (server actions)
src/app/page.tsx        ekran igrača
src/app/trener/         pregled, jedan termin, statistika, spisak igrača
src/app/api/izvoz/      Excel
drizzle/                SQL migracije
Dockerfile, fly.toml    hosting (alternativa Vercelu)
```

## Šta bi bilo sledeće

- Push obaveštenja (web push) dan pre termina — najveći dobitak, jer podsetnik
  je ono što tera ljude da se izjasne.
- Pravilo tipa „ispod 70% nema utakmice" kao automatska oznaka na spisku.
