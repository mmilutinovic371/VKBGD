import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { participation, players, trainings } from "@/db/schema";
import { sesija } from "@/lib/auth";
import { presek } from "@/lib/statistika";
import TerminKarta from "./termin-karta";
import OdjaviDugme from "./odjavi-dugme";

export default async function EkranIgraca() {
  const s = await sesija();
  if (!s) redirect("/login");
  if (s.role === "trener") redirect("/trener");

  const baza = db();
  const [ja] = await baza.select().from(players).where(eq(players.id, s.playerId)).limit(1);
  if (!ja) redirect("/login");

  const sada = new Date();
  const odGranica = new Date(sada.getTime() - 2 * 3600_000);

  const termini = await baza
    .select()
    .from(trainings)
    .where(and(eq(trainings.canceled, false), gte(trainings.startsAt, odGranica)))
    .orderBy(asc(trainings.startsAt))
    .limit(10);

  const idTermina = termini.map((t) => t.id);
  const mojeUcesce = idTermina.length
    ? await baza
        .select()
        .from(participation)
        .where(and(inArray(participation.trainingId, idTermina), eq(participation.playerId, ja.id)))
    : [];
  const ucesceMapa = new Map(mojeUcesce.map((u) => [u.trainingId, u]));

  const { statistika } = await presek(new Date(0), sada);
  const mojaStatistika = statistika.find((r) => r.player.id === ja.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-4 pb-10">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">Zdravo, {ja.name.split(" ")[0]}</h1>
          {mojaStatistika && (
            <p className="text-sm text-slate-600">
              Dolaznost: <span className="font-semibold">{mojaStatistika.procenat}%</span>{" "}
              ({mojaStatistika.brojPrisutan}/{mojaStatistika.brojOdrzanih})
            </p>
          )}
        </div>
        <OdjaviDugme />
      </header>

      {termini.length === 0 && (
        <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          Nema zakazanih termina.
        </p>
      )}

      <div className="flex flex-col gap-3">
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
            rsvp={ucesceMapa.get(termin.id)?.rsvp ?? null}
            present={ucesceMapa.get(termin.id)?.present ?? null}
          />
        ))}
      </div>
    </main>
  );
}
