import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationReads, notifications, players } from "@/db/schema";
import { formatDatumVreme } from "@/lib/vreme";
import NovoObavestenjeForma from "./novo-obavestenje-forma";

export default async function StranicaObavestenjaTrener() {
  const baza = db();

  const igraci = await baza
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.role, "igrac"), eq(players.active, true)));

  const poslato = await baza.select().from(notifications).orderBy(desc(notifications.sentAt)).limit(10);

  const poslatoSaProcitanim = await Promise.all(
    poslato.map(async (n) => {
      const procitano = await baza
        .select({ id: notificationReads.id })
        .from(notificationReads)
        .where(eq(notificationReads.notificationId, n.id));
      return { ...n, procitano: procitano.length };
    }),
  );

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_380px]">
      <NovoObavestenjeForma primalaca={igraci.length} />

      <div className="rounded-[10px] bg-navy-800 p-5">
        <div className="font-body text-[11px] font-semibold uppercase tracking-[.16em] text-white/45">Poslato</div>
        <div className="mt-3.5 flex flex-col gap-3">
          {poslatoSaProcitanim.length === 0 && (
            <p className="font-body text-[13px] text-white/45">Još ništa nije poslato.</p>
          )}
          {poslatoSaProcitanim.map((n) => (
            <div key={n.id} className="rounded-[8px] border-l-[3px] border-red-600 bg-white/6 p-3.25">
              <p className="font-body text-[13.5px] leading-relaxed text-white">{n.body}</p>
              <p className="mt-1.5 font-body text-[11.5px] font-medium text-white/42">
                {formatDatumVreme(n.sentAt)} · pročitalo {n.procitano}/{igraci.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
