import { PRAG_DOLAZNOSTI, kljucPar, presek } from "@/lib/statistika";

const BROJ_KOLONA = 10;

export default async function StranicaStatistike() {
  const { statistika, termini, prisustvo } = await presek(new Date(0), new Date());
  const poslednji = termini.slice(-BROJ_KOLONA);
  const poredjano = [...statistika].sort((a, b) => b.procenat - a.procenat);

  return (
    <div className="rounded-[10px] border border-navy-800/9 bg-white p-4.5 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-cond text-xl font-bold uppercase tracking-[.03em] text-navy-800">
          Matrica dolaznosti · zadnjih {poslednji.length} termina
        </h1>
        <div className="flex gap-3.5 font-body text-[11.5px] font-medium text-navy-800/50">
          <span>■ prisutan</span>
          <span className="text-red-600">■ odsutan</span>
          <span className="text-navy-800/30">■ nije evidentirano</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.25">
        {poslednji.length === 0 ? (
          <p className="py-6 font-body text-sm text-navy-800/50">Još nema odigranih termina u sezoni.</p>
        ) : (
          poredjano.map((red) => (
            <div
              key={red.player.id}
              className="grid items-center gap-4 md:grid-cols-[190px_1fr_74px]"
            >
              <div className="font-body text-[13.5px] font-semibold text-navy-800">{red.player.name}</div>
              <div className="flex gap-1.25 overflow-x-auto">
                {poslednji.map((termin) => {
                  const p = prisustvo.get(kljucPar(termin.id, red.player.id));
                  const bg =
                    p === true ? "rgba(31,122,77,.75)" : p === false ? "rgba(218,31,46,.75)" : "rgba(15,29,53,.12)";
                  return (
                    <div key={termin.id} className="h-[26px] flex-1 min-w-[18px] rounded-[4px]" style={{ background: bg }} />
                  );
                })}
              </div>
              <div
                className="tabular-nums text-right font-cond text-[17px] font-bold"
                style={{ color: red.procenat < PRAG_DOLAZNOSTI ? "#DA1F2E" : "#1F7A4D" }}
              >
                {red.procenat}%
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
