import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { sesija } from "@/lib/auth";
import { redirect } from "next/navigation";
import Forma from "./forma";

export default async function StranicaPrijave() {
  const s = await sesija();
  if (s) redirect(s.role === "trener" ? "/trener" : "/");

  const spisak = await db()
    .select({ id: players.id, name: players.name, capNumber: players.capNumber })
    .from(players)
    .where(eq(players.active, true))
    .orderBy(asc(players.name));

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dolaznost — VK Beograd</h1>
        <p className="mt-1 text-sm text-slate-600">
          Izaberi svoje ime i unesi PIN. Prvi put — sam biraš PIN od 4 cifre.
        </p>
      </div>
      <Forma igraci={spisak} />
    </main>
  );
}
