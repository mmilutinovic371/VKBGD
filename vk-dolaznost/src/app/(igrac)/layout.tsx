import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notificationReads, notifications, players } from "@/db/schema";
import { sesija } from "@/lib/auth";
import Grb from "@/app/grb";
import NavTabs from "./nav-tabs";

export default async function IgracLayout({ children }: { children: React.ReactNode }) {
  const s = await sesija();
  if (!s) redirect("/login");
  if (s.role === "trener") redirect("/trener");

  const baza = db();
  const [ja] = await baza.select().from(players).where(eq(players.id, s.playerId)).limit(1);
  if (!ja) redirect("/login");

  const nepročitana = await baza
    .select({ id: notifications.id })
    .from(notifications)
    .leftJoin(
      notificationReads,
      and(eq(notificationReads.notificationId, notifications.id), eq(notificationReads.playerId, s.playerId)),
    )
    .where(isNull(notificationReads.id));

  return (
    <div className="min-h-screen bg-navy-900">
      <header className="flex items-center justify-between border-b border-white/9 px-10 py-6">
        <div className="flex items-center gap-3">
          <Grb size={40} />
          <span className="font-body text-xs font-semibold uppercase tracking-[.2em] text-white/55">
            VK Singidunum · seniori
          </span>
        </div>
        <NavTabs neprocitano={nepročitana.length} />
      </header>
      {children}
    </div>
  );
}
