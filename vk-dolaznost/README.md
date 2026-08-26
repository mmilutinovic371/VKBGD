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

SQLite, jedan fajl. Lokalno `./podaci/vk.db`, na serveru `/data/vk.db`.
Nema servera baze, naloga ni connection stringa. WAL režim je uključen, pa
čitanja ne blokiraju upise dok se ekipa čekira.

Kad promeniš `src/db/schema.ts`:

```bash
npm run db:generate         # napravi SQL migraciju u ./drizzle
npm run db:migrate          # primeni je
```

Folder `drizzle/` ide u git — iz njega se baza podiže na serveru.

## Objavljivanje na Fly.io

```bash
brew install flyctl                 # ili: curl -L https://fly.io/install.sh | sh
fly auth signup
fly launch --no-deploy              # prepoznaje Dockerfile i fly.toml
fly volumes create vk_podaci --size 1 --region fra
fly secrets set AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
fly deploy
fly scale count 1                   # obavezno tačno jedna mašina
fly ssh console -C "node scripts/seed.mjs"   # prvo punjenje spiska
```

Dobiješ `https://ime-aplikacije.fly.dev`. Pošalji link ekipi i neka ga sačuvaju
na početni ekran telefona (Podeli → Dodaj na početni ekran).

**Tačno jedna mašina.** Disk se kači na jednu mašinu; druga bi dobila svoj
prazan disk i svoju bazu. Nikad ne diži broj mašina.

### Rezervna kopija

```bash
fly ssh console -C "sqlite3 /data/vk.db \".backup \'/data/kopija.db\'\""
fly sftp get /data/kopija.db ./kopija-$(date +%F).db
```

Uradi to na kraju svakog meseca. Fajl je mali, staje u mejl.

## Struktura

```
src/db/schema.ts        tri tabele: players, trainings, participation
src/db/index.ts         SQLite veza (WAL, foreign keys)
src/lib/auth.ts         PIN + potpisani kolačić (bez mejlova i naloga)
src/lib/vreme.ts        beogradska zona, prozor za čekiranje, generator rasporeda
src/lib/statistika.ts   računanje dolaznosti (koriste ga i ekran i izvoz)
src/app/akcije.ts       sve izmene podataka (server actions)
src/app/page.tsx        ekran igrača
src/app/trener/         pregled, jedan termin, statistika, spisak igrača
src/app/api/izvoz/      Excel
drizzle/                SQL migracije
Dockerfile, fly.toml    hosting
```

## Šta bi bilo sledeće

- Push obaveštenja (web push) dan pre termina — najveći dobitak, jer podsetnik
  je ono što tera ljude da se izjasne.
- Litestream, ako ti ručna rezervna kopija bude teret: neprekidno šalje izmene
  baze na S3 kantu, oko 1 € mesečno.
- Pravilo tipa „ispod 70% nema utakmice" kao automatska oznaka na spisku.
