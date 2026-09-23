import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { players } from "@/db/schema";
import { sesija } from "@/lib/auth";
import Grb from "@/app/grb";
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
    <main className="flex min-h-screen items-center justify-center bg-navy-900 p-6">
      <div className="relative w-full max-w-[470px] overflow-hidden rounded-2xl">
        <div
          className="pointer-events-none absolute -bottom-36 -left-32 h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(218,31,46,.28), transparent 66%)" }}
        />
        <div className="relative flex flex-col gap-6 px-9 py-11">
          <div className="flex flex-col items-center gap-3.5 text-center">
            <Grb size={92} />
            <div>
              <h1 className="font-cond text-[34px] font-bold uppercase tracking-[.04em] text-white">
                Dolaznost
              </h1>
              <p className="mt-1.5 font-body text-[11px] font-semibold uppercase tracking-[.2em] text-red-600">
                VK Singidunum · seniori
              </p>
            </div>
          </div>

          <Forma igraci={spisak} />
        </div>
      </div>
    </main>
  );
}
