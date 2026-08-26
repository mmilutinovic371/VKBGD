import { presek } from "@/lib/statistika";

export default async function StranicaStatistike() {
  const { statistika, termini } = await presek(new Date(0), new Date());
  const poredjano = [...statistika].sort((a, b) => b.procenat - a.procenat);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Statistika dolaznosti</h1>
        <a
          href="/api/izvoz"
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
        >
          Izvezi u Excel
        </a>
      </div>
      <p className="text-sm text-slate-500">{termini.length} odigranih termina u sezoni.</p>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="p-3 font-medium">Igrač</th>
              <th className="p-3 font-medium">Prisustvo</th>
              <th className="p-3 font-medium">Procenat</th>
            </tr>
          </thead>
          <tbody>
            {poredjano.map((red) => (
              <tr key={red.player.id} className="border-b border-slate-50 last:border-0">
                <td className="p-3">{red.player.name}</td>
                <td className="p-3 text-slate-500">
                  {red.brojPrisutan}/{red.brojOdrzanih}
                </td>
                <td className="p-3">
                  <span
                    className={`font-semibold ${
                      red.procenat < 70 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {red.procenat}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
