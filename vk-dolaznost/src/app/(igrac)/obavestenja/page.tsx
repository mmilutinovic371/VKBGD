import { desc } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { sesija } from "@/lib/auth";
import { oznaciObavestenjaProcitana } from "@/app/akcije";
import { formatDatumVreme } from "@/lib/vreme";

export default async function StranicaObavestenjaIgrac() {
  const s = await sesija();
  if (!s) return null;

  await oznaciObavestenjaProcitana();

  const lista = await db().select().from(notifications).orderBy(desc(notifications.sentAt)).limit(30);

  return (
    <div className="min-h-[calc(100vh-89px)] bg-cream-100 px-6 py-8 md:px-10">
      <h1 className="font-cond text-[30px] font-bold uppercase leading-none text-navy-800">Obaveštenja</h1>

      <div className="mt-5 flex max-w-2xl flex-col gap-2.5">
        {lista.length === 0 && (
          <p className="rounded-[10px] border border-navy-800/9 bg-white p-5 font-body text-sm text-navy-800/55">
            Još nema obaveštenja.
          </p>
        )}
        {lista.map((n) => (
          <div key={n.id} className="rounded-[8px] border-l-[3px] border-red-600 bg-white p-3.5 shadow-[0_2px_8px_rgba(15,29,53,.06)]">
            <p className="font-body text-[14px] leading-relaxed text-navy-800">{n.body}</p>
            <p className="mt-1.5 font-body text-[11.5px] font-medium text-navy-800/42">
              {formatDatumVreme(n.sentAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
