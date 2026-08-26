import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { participation, trainings } from "@/db/schema";
import { formatDatumVreme } from "@/lib/vreme";
import NoviTerminForma from "./novi-termin-forma";
import OtkaziDugme from "./otkazi-dugme";

const NAZIV_VRSTE: Record<string, string> = {
  trening: "Trening",
  utakmica: "Utakmica",
  teretana: "Teretana",
};

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
      <h1 className="text-xl font-bold">Termini</h1>
      <NoviTerminForma />

      <div className="flex flex-col gap-2">
        {termini.map((termin) => {
          const odrzan = termin.startsAt.getTime() <= sada.getTime();
          const brojevi = brojac.get(termin.id) ?? { dolazi: 0, prisutni: 0 };
          return (
            <Link
              key={termin.id}
              href={`/trener/${termin.id}`}
              className={`flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ${
                termin.canceled ? "opacity-50" : ""
              }`}
            >
              <div>
                <p className="font-medium">
                  {formatDatumVreme(termin.startsAt)}
                  {termin.canceled && <span className="ml-2 text-xs text-red-600">otkazano</span>}
                </p>
                <p className="text-sm text-slate-500">
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
