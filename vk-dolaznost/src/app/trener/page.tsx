import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { participation, trainings } from "@/db/schema";
import { formatDatumVreme } from "@/lib/vreme";
import NoviTerminForma from "./novi-termin-forma";
import OtkaziDugme from "./otkazi-dugme";

const NAZIV_VRSTE: Record<string, string> = { trening: "Trening", utakmica: "Utakmica", teretana: "Teretana" };
const AKCENT: Record<string, string> = { trening: "#0F1D35", utakmica: "#DA1F2E", teretana: "#2A4A7A" };

export default async function PregledTermina() {
  const baza = db();
  const sada = new Date();

  const termini = await baza.select().from(trainings).orderBy(desc(trainings.startsAt)).limit(40);

  const idTermina = termini.map((t) => t.id);
  const ucesca = idTermina.length
    ? await baza.select().from(participation).where(inArray(participation.trainingId, idTermina))
    : [];

  const brojac = new Map<number, { dolazi: number; prisutni: number }>();
  for (const u of ucesca) {
    const trenutno = brojac.get(u.trainingId) ?? { dolazi: 0, prisutni: 0 };
    if (u.rsvp === "dolazim") trenutno.dolazi++;
    if (u.present === true) trenutno.prisutni++;
    brojac.set(u.trainingId, trenutno);
  }

  return (
    <div className="flex flex-col gap-4">
      <NoviTerminForma />

      <div className="flex flex-col gap-2.5">
        {termini.map((termin) => {
          const odrzan = termin.startsAt.getTime() <= sada.getTime();
          const brojevi = brojac.get(termin.id) ?? { dolazi: 0, prisutni: 0 };
          return (
            <Link
              key={termin.id}
              href={`/trener/${termin.id}`}
              className={`flex items-center justify-between rounded-[9px] border border-navy-800/9 bg-white p-4 transition-transform hover:-translate-y-px ${
                termin.canceled ? "opacity-50" : ""
              }`}
              style={{ borderLeft: `4px solid ${AKCENT[termin.kind]}` }}
            >
              <div>
                <p className="font-body text-[14px] font-semibold text-navy-800">
                  {formatDatumVreme(termin.startsAt)}
                  {termin.canceled && <span className="ml-2 font-body text-xs text-red-600">otkazano</span>}
                </p>
                <p className="mt-0.5 font-body text-[12.5px] text-navy-800/50">
                  {NAZIV_VRSTE[termin.kind]} · {termin.location}
                  {!termin.canceled &&
                    (odrzan
                      ? ` · ${brojevi.prisutni} prisutno`
                      : ` · ${brojevi.dolazi} najavilo dolazak`)}
                </p>
              </div>
              {!termin.canceled && !odrzan && <OtkaziDugme trainingId={termin.id} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
