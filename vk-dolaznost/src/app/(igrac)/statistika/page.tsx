import { eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { sesija } from "@/lib/auth";
import { PRAG_DOLAZNOSTI, kljucPar, presek } from "@/lib/statistika";
import { formatDatum } from "@/lib/vreme";

const NAZIV_VRSTE: Record<string, string> = { trening: "Trening", utakmica: "Utakmica", teretana: "Teretana" };

export default async function StranicaMojeStatistike() {
  const s = await sesija();
  if (!s) return null;

  const baza = db();
  const [ja] = await baza.select().from(players).where(eq(players.id, s.playerId)).limit(1);
  if (!ja) return null;

  const { termini, prisustvo, statistika } = await presek(new Date(0), new Date());
  const moja = statistika.find((r) => r.player.id === ja.id);
  const procenat = moja?.procenat ?? 0;
  const istorija = [...termini].reverse().slice(0, 20);

  return (
    <div className="min-h-[calc(100vh-89px)] bg-cream-100 px-6 py-8 md:px-10">
      <h1 className="font-cond text-[30px] font-bold uppercase leading-none text-navy-800">Moja statistika</h1>

      <div className="mt-5 max-w-md rounded-[10px] border border-navy-800/9 bg-white p-5.5 shadow-[0_6px_20px_rgba(15,29,53,.1)]">
        <div className="flex items-baseline justify-between">
          <span className="font-body text-[11px] font-semibold uppercase tracking-[.16em] text-navy-800/45">
            Sezona 25/26
          </span>
          <span className={`font-cond text-[40px] font-bold ${procenat < PRAG_DOLAZNOSTI ? "text-red-600" : "text-navy-800"}`}>
            {procenat}%
          </span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-[3px] bg-navy-800/10">
          <div
            className={`h-full ${procenat < PRAG_DOLAZNOSTI ? "bg-red-600" : "bg-green-700"}`}
            style={{ width: `${procenat}%` }}
          />
        </div>
        <div className="mt-2 font-body text-[12.5px] text-navy-800/55">
          {moja?.brojPrisutan ?? 0} od {moja?.brojOdrzanih ?? 0} odigranih termina · prag za utakmice je{" "}
          {PRAG_DOLAZNOSTI}%
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[10px] border border-navy-800/9 bg-white">
        <div className="border-b border-navy-800/8 px-5 py-3.5 font-body text-xs font-semibold uppercase tracking-[.1em] text-navy-800/50">
          Istorija
        </div>
        {istorija.length === 0 && (
          <p className="px-5 py-4 font-body text-sm text-navy-800/50">Još nema odigranih termina.</p>
        )}
        {istorija.map((termin) => {
          const p = prisustvo.get(kljucPar(termin.id, ja.id));
          return (
            <div
              key={termin.id}
              className="flex items-center justify-between border-b border-navy-800/5 px-5 py-2.75 last:border-0"
            >
              <div>
                <span className="font-body text-sm font-medium text-navy-800">{formatDatum(termin.startsAt)}</span>
                <span className="ml-2 font-body text-xs text-navy-800/45">{NAZIV_VRSTE[termin.kind]}</span>
              </div>
              <span
                className={`font-body text-xs font-semibold ${
                  p === true ? "text-green-700" : p === false ? "text-red-600" : "text-navy-800/35"
                }`}
              >
                {p === true ? "Prisutan" : p === false ? "Odsutan" : "Nije evidentirano"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
