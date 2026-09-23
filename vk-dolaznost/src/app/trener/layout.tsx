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
import IspodPragaKartica from "./ispod-praga-kartica";

async function ucitajKartice() {
  const baza = db();
  const sada = new Date();
  const pocetakMeseca = new Date(sada.getFullYear(), sada.getMonth(), 1);

  const { termini, statistika } = await presek(new Date(0), sada);
  const prosecna = statistika.length
    ? Math.round(statistika.reduce((zbir, r) => zbir + r.procenat, 0) / statistika.length)
    : 0;
  const ispodPragaIgraci = statistika
    .filter((r) => r.procenat < PRAG_DOLAZNOSTI)
    .map((r) => ({ ime: r.player.name, procenat: r.procenat }));

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

  return {
    prosecna: { vrednost: `${prosecna}%`, nota: prosecnaMeseca !== null ? `${prosecnaMeseca}% ovog meseca` : "sezona 25/26" },
    ispodPragaIgraci,
    najavaUtakmice,
    odigranoTermina: termini.length,
  };
}

export default async function TrenerLayout({ children }: { children: React.ReactNode }) {
  const t = await trenerSesija();
  if (!t) redirect("/login");

  const { prosecna, ispodPragaIgraci, najavaUtakmice, odigranoTermina } = await ucitajKartice();

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="bg-navy-800">
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-7.5 sm:py-4.5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Grb size={30} className="sm:hidden" />
            <Grb size={38} className="hidden sm:block" />
            <div>
              <div className="font-cond text-[13px] font-bold uppercase tracking-[.06em] text-white sm:text-[15px] sm:tracking-[.08em]">
                Trenerska konzola
              </div>
              <div className="hidden font-body text-[11px] font-medium text-white/45 sm:block">
                Seniori · sezona 25/26
              </div>
            </div>
          </div>
          <OdjaviDugme />
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 sm:px-7.5">
          <Link
            href="/trener/igraci"
            className="whitespace-nowrap rounded-[7px] border border-white/20 px-3 py-1.75 font-body text-[11.5px] font-semibold text-white transition-colors hover:bg-white/10 sm:px-3.5 sm:py-2.25 sm:text-[12.5px]"
          >
            Igrači
          </Link>
          <a
            href="/api/izvoz"
            className="whitespace-nowrap rounded-[7px] border border-white/20 px-3 py-1.75 font-body text-[11.5px] font-semibold text-white transition-colors hover:bg-white/10 sm:px-3.5 sm:py-2.25 sm:text-[12.5px]"
          >
            Izvezi u Excel
          </a>
          <Link
            href="/trener"
            className="whitespace-nowrap rounded-[7px] bg-red-600 px-3 py-1.75 font-body text-[11.5px] font-semibold text-white transition-colors hover:bg-red-500 sm:px-3.5 sm:py-2.25 sm:text-[12.5px]"
          >
            Novi termin
          </Link>
        </div>
        <TrenerTabs />
      </header>

      <div className="px-4 py-5 sm:px-7.5 sm:py-6">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
          <div className="rounded-[9px] border border-navy-800/9 bg-white p-4">
            <div className="font-body text-[10.5px] font-medium uppercase tracking-[.13em] text-navy-800/45">
              Prosečna dolaznost
            </div>
            <div className="mt-1.25 flex items-baseline gap-1.75">
              <span className="font-cond text-[32px] font-bold text-navy-800">{prosecna.vrednost}</span>
              <span className="font-body text-xs font-semibold text-green-700">{prosecna.nota}</span>
            </div>
          </div>

          <IspodPragaKartica prag={PRAG_DOLAZNOSTI} igraci={ispodPragaIgraci} />

          <div className="rounded-[9px] border border-navy-800/9 bg-white p-4">
            <div className="font-body text-[10.5px] font-medium uppercase tracking-[.13em] text-navy-800/45">
              {najavaUtakmice.ime}
            </div>
            <div className="mt-1.25 flex items-baseline gap-1.75">
              <span className="font-cond text-[32px] font-bold text-navy-800">{najavaUtakmice.vrednost}</span>
              <span className="font-body text-xs font-semibold text-navy-800">utakmica</span>
            </div>
          </div>

          <div className="rounded-[9px] border border-navy-800/9 bg-white p-4">
            <div className="font-body text-[10.5px] font-medium uppercase tracking-[.13em] text-navy-800/45">
              Odigrano u sezoni
            </div>
            <div className="mt-1.25 flex items-baseline gap-1.75">
              <span className="font-cond text-[32px] font-bold text-navy-800">{odigranoTermina}</span>
              <span className="font-body text-xs font-semibold text-navy-800">termina</span>
            </div>
          </div>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
