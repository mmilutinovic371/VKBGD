import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { participation, players, trainings } from "@/db/schema";
import { sesija } from "@/lib/auth";
import TerminKarta from "../termin-karta";

export default async function StranicaRasporeda() {
  const s = await sesija();
  if (!s) return null;

  const baza = db();
  const [ja] = await baza.select().from(players).where(eq(players.id, s.playerId)).limit(1);
  if (!ja) return null;

  const sada = new Date();
  const odGranica = new Date(sada.getTime() - 2 * 3600_000);

  const termini = await baza
    .select()
    .from(trainings)
    .where(and(eq(trainings.canceled, false), gte(trainings.startsAt, odGranica)))
    .orderBy(asc(trainings.startsAt))
    .limit(15);

  const idTermina = termini.map((t) => t.id);
  const ucesce = idTermina.length
    ? await baza.select().from(participation).where(inArray(participation.trainingId, idTermina))
    : [];

  const mojeMapa = new Map(ucesce.filter((u) => u.playerId === ja.id).map((u) => [u.trainingId, u]));
  const najaveBrojac = new Map<number, number>();
  for (const u of ucesce) {
    if (u.rsvp === "dolazim") najaveBrojac.set(u.trainingId, (najaveBrojac.get(u.trainingId) ?? 0) + 1);
  }

  const inicijali = ja.name
    .split(/\s+/)
    .map((r) => r[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-[calc(100vh-89px)] bg-cream-100 px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy-800/10 pb-4">
        <div>
          <h1 className="font-cond text-[30px] font-bold uppercase leading-none text-navy-800">
            Naredni termini
          </h1>
          <p className="mt-1.5 font-body text-[13.5px] text-navy-800/55">
            Zdravo, {ja.name.split(" ")[0]}. Izjasni se za sve termine.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="font-body text-[12.5px] font-semibold text-navy-800">{ja.name}</div>
            <div className="font-body text-[11px] font-medium text-navy-800/45">
              igrač
            </div>
          </div>
          <div className="grid h-[34px] w-[34px] place-items-center rounded-full bg-navy-800 font-cond text-[13px] font-bold text-white">
            {inicijali}
          </div>
        </div>
      </div>

      <div className="mt-4.5 flex flex-col gap-3">
        {termini.length === 0 && (
          <p className="rounded-xl bg-white p-4 font-body text-sm text-navy-800/60">Nema zakazanih termina.</p>
        )}
        {termini.map((termin) => (
          <TerminKarta
            key={termin.id}
            termin={{
              id: termin.id,
              startsAt: termin.startsAt.toISOString(),
              durationMin: termin.durationMin,
              location: termin.location,
              kind: termin.kind,
              checkinOpensMin: termin.checkinOpensMin,
              checkinClosesMin: termin.checkinClosesMin,
            }}
            rsvp={mojeMapa.get(termin.id)?.rsvp ?? null}
            present={mojeMapa.get(termin.id)?.present ?? null}
            najave={najaveBrojac.get(termin.id) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
