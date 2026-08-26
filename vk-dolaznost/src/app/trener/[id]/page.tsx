import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { participation, players, trainings } from "@/db/schema";
import { PRAG_DOLAZNOSTI, presek } from "@/lib/statistika";
import { formatDatumVreme } from "@/lib/vreme";
import PrisustvoRed from "./prisustvo-red";
import AkcijeSkupno from "./akcije-skupno";

const NAZIV_VRSTE: Record<string, string> = { trening: "Trening", utakmica: "Utakmica", teretana: "Teretana" };

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

  const { statistika } = await presek(new Date(0), new Date());
  const procenatMapa = new Map(statistika.map((r) => [r.player.id, r.procenat]));

  const vrednosti = igraci.map((i) => ucesceMapa.get(i.id)?.present ?? null);
  const prisutnoBroj = vrednosti.filter((v) => v === true).length;
  const odsutnoBroj = vrednosti.filter((v) => v === false).length;
  const neoznacenoBroj = igraci.length - prisutnoBroj - odsutnoBroj;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[10px] border border-navy-800/9 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-800/8 px-5 py-4">
          <div>
            <h1 className="font-cond text-xl font-bold uppercase tracking-[.03em] text-navy-800">
              {formatDatumVreme(termin.startsAt)} · {termin.location}
            </h1>
            <p className="mt-1 font-body text-[12.5px] text-navy-800/50">
              {prisutnoBroj} prisutno · {odsutnoBroj} odsutno · {neoznacenoBroj} neoznačeno
            </p>
          </div>
          <AkcijeSkupno trainingId={trainingId} />
        </div>

        {termin.canceled && (
          <p className="border-b border-navy-800/8 bg-red-600/5 px-5 py-2.5 font-body text-[12.5px] font-semibold text-red-600">
            Ovaj termin je otkazan.
          </p>
        )}

        <div>
          {igraci.map((igrac) => (
            <PrisustvoRed
              key={igrac.id}
              trainingId={trainingId}
              playerId={igrac.id}
              ime={igrac.name}
              capNumber={igrac.capNumber}
              rsvp={ucesceMapa.get(igrac.id)?.rsvp ?? null}
              present={ucesceMapa.get(igrac.id)?.present ?? null}
              checkedInAt={ucesceMapa.get(igrac.id)?.checkedInAt?.toISOString() ?? null}
              procenat={procenatMapa.get(igrac.id) ?? 0}
              prag={PRAG_DOLAZNOSTI}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
