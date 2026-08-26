import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notificationReads, notifications, players } from "@/db/schema";
import { sesija } from "@/lib/auth";
import Grb from "@/app/grb";
import NavTabs from "./nav-tabs";
import OdjavaTanka from "./odjava-tanka";

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
      <header>
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-10 sm:py-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Grb size={32} className="sm:hidden" />
            <Grb size={40} className="hidden sm:block" />
            <span className="font-body text-[10px] font-semibold uppercase tracking-[.14em] text-white/55 sm:text-xs sm:tracking-[.2em]">
              VK Singidunum · seniori
            </span>
          </div>
          <OdjavaTanka />
        </div>
        <NavTabs neprocitano={nepročitana.length} />
      </header>
      {children}
    </div>
  );
}
