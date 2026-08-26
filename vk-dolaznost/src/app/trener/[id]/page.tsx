import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { participation, players, trainings } from "@/db/schema";
import { formatDatumVreme } from "@/lib/vreme";
import PrisustvoRed from "./prisustvo-red";

const NAZIV_VRSTE: Record<string, string> = {
  trening: "Trening",
  utakmica: "Utakmica",
  teretana: "Teretana",
};

export default async function DetaljTermina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trainingId = Number(id);
  if (!Number.isInteger(trainingId)) notFound();

  const baza = db();
  const [termin] = await baza.select().from(trainings).where(eq(trainings.id, trainingId)).limit(1);
  if (!termin) notFound();

  const igraci = await baza
    .select()
    .from(players)
    .where(and(eq(players.role, "igrac"), eq(players.active, true)))
    .orderBy(asc(players.name));

  const ucesca = await baza.select().from(participation).where(eq(participation.trainingId, trainingId));
  const ucesceMapa = new Map(ucesca.map((u) => [u.playerId, u]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">{formatDatumVreme(termin.startsAt)}</h1>
        <p className="text-sm text-slate-500">
          {NAZIV_VRSTE[termin.kind]} · {termin.location}
          {termin.canceled && <span className="ml-2 text-red-600">otkazano</span>}
        </p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        {igraci.map((igrac) => (
          <PrisustvoRed
            key={igrac.id}
            trainingId={trainingId}
            playerId={igrac.id}
            ime={igrac.name}
            capNumber={igrac.capNumber}
            rsvp={ucesceMapa.get(igrac.id)?.rsvp ?? null}
            present={ucesceMapa.get(igrac.id)?.present ?? null}
          />
        ))}
      </div>
    </div>
  );
}
