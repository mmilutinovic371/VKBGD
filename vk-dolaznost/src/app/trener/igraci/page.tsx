import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import DodajIgracaForma from "./dodaj-igraca-forma";
import IgracRed from "./igrac-red";

export default async function SpisakIgraca() {
  const spisak = await db()
    .select()
    .from(players)
    .where(eq(players.role, "igrac"))
    .orderBy(asc(players.name));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-cond text-xl font-bold uppercase tracking-[.03em] text-navy-800">Spisak igrača</h1>
      <DodajIgracaForma />
      <div className="rounded-xl bg-white p-4 shadow-sm">
        {spisak.map((igrac) => (
          <IgracRed
            key={igrac.id}
            playerId={igrac.id}
            name={igrac.name}
            capNumber={igrac.capNumber}
            active={igrac.active}
            imaPin={!!igrac.pinHash}
          />
        ))}
      </div>
    </div>
  );
}
