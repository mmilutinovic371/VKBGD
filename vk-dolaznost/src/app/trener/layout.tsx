import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { participation, players, trainings } from "@/db/schema";
import { trenerSesija } from "@/lib/auth";
import { PRAG_DOLAZNOSTI, presek } from "@/lib/statistika";
import { relativniDan } from "@/lib/vreme";
import Grb from "@/app/grb";
import OdjaviDugme from "../odjavi-dugme";
import TrenerTabs from "./tabs";

async function ucitajKartice() {
  const baza = db();
  const sada = new Date();
  const pocetakMeseca = new Date(sada.getFullYear(), sada.getMonth(), 1);

  const { termini, statistika } = await presek(new Date(0), sada);
  const prosecna = statistika.length
    ? Math.round(statistika.reduce((zbir, r) => zbir + r.procenat, 0) / statistika.length)
    : 0;
  const ispodPraga = statistika.filter((r) => r.procenat < PRAG_DOLAZNOSTI).length;

  const { statistika: statistikaMeseca } = await presek(pocetakMeseca, sada);
  const prosecnaMeseca = statistikaMeseca.length
    ? Math.round(statistikaMeseca.reduce((zbir, r) => zbir + r.procenat, 0) / statistikaMeseca.length)
    : null;

  const [narednaUtakmica] = await baza
    .select()
    .from(trainings)
    .where(and(eq(trainings.kind, "utakmica"), eq(trainings.canceled, false), gte(trainings.startsAt, sada)))
    .orderBy(asc(trainings.startsAt))
    .limit(1);

  let najavaUtakmice = { vrednost: "—", ime: "Naredna utakmica" };
  if (narednaUtakmica) {
    const igraci = await baza
      .select({ id: players.id })
      .from(players)
      .where(and(eq(players.role, "igrac"), eq(players.active, true)));
    const ucesce = await baza
      .select()
      .from(participation)
      .where(eq(participation.trainingId, narednaUtakmica.id));
    const dolazi = ucesce.filter((u) => u.rsvp === "dolazim").length;
    najavaUtakmice = {
      vrednost: `${dolazi}/${igraci.length}`,
      ime: `Najavilo za ${relativniDan(narednaUtakmica.startsAt, sada)}`,
    };
  }

  return [
    {
      ime: "Prosečna dolaznost",
      vrednost: `${prosecna}%`,
      nota: prosecnaMeseca !== null ? `${prosecnaMeseca}% ovog meseca` : "sezona 25/26",
      boja: "text-green-700",
    },
    {
      ime: `Ispod praga ${PRAG_DOLAZNOSTI}%`,
      vrednost: String(ispodPraga),
      nota: "igrača",
      boja: "text-red-600",
    },
    { ime: najavaUtakmice.ime, vrednost: najavaUtakmice.vrednost, nota: "utakmica", boja: "text-navy-800" },
    { ime: "Odigrano u sezoni", vrednost: String(termini.length), nota: "termina", boja: "text-navy-800" },
  ];
}

export default async function TrenerLayout({ children }: { children: React.ReactNode }) {
  const t = await trenerSesija();
  if (!t) redirect("/login");

  const kartice = await ucitajKartice();

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="bg-navy-800 px-6 md:px-7.5">
        <div className="flex items-center justify-between py-4.5">
          <div className="flex items-center gap-3">
            <Grb size={38} />
            <div>
              <div className="font-cond text-[15px] font-bold uppercase tracking-[.08em] text-white">
                Trenerska konzola
              </div>
              <div className="font-body text-[11px] font-medium text-white/45">Seniori · sezona 25/26</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/trener/igraci"
              className="rounded-[7px] border border-white/20 px-3.5 py-2.25 font-body text-[12.5px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Igrači
            </Link>
            <a
              href="/api/izvoz"
              className="rounded-[7px] border border-white/20 px-3.5 py-2.25 font-body text-[12.5px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Izvezi u Excel
            </a>
            <Link
              href="/trener"
              className="rounded-[7px] bg-red-600 px-3.5 py-2.25 font-body text-[12.5px] font-semibold text-white transition-colors hover:bg-red-500"
            >
              Novi termin
            </Link>
            <OdjaviDugme />
          </div>
        </div>
        <TrenerTabs />
      </header>

      <div className="px-6 py-6 md:px-7.5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kartice.map((k, i) => (
            <div key={i} className="rounded-[9px] border border-navy-800/9 bg-white p-4">
              <div className="font-body text-[10.5px] font-medium uppercase tracking-[.13em] text-navy-800/45">
                {k.ime}
              </div>
              <div className="mt-1.25 flex items-baseline gap-1.75">
                <span className="font-cond text-[32px] font-bold text-navy-800">{k.vrednost}</span>
                <span className={`font-body text-xs font-semibold ${k.boja}`}>{k.nota}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
