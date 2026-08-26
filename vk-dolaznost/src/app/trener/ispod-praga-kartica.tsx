"use client";

import { useState } from "react";

interface IgracIspod {
  ime: string;
  procenat: number;
}

export default function IspodPragaKartica({ prag, igraci }: { prag: number; igraci: IgracIspod[] }) {
  const [otvoreno, setOtvoreno] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOtvoreno((v) => !v)}
        className={`w-full rounded-[9px] border bg-white p-4 text-left transition-colors ${
          otvoreno ? "border-red-600/50" : "border-navy-800/9 hover:border-red-600/30"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-body text-[10.5px] font-medium uppercase tracking-[.13em] text-navy-800/45">
            Ispod praga {prag}%
          </span>
          <span className="font-body text-[10px] text-navy-800/35">{otvoreno ? "sakrij ▲" : "prikaži ▼"}</span>
        </div>
        <div className="mt-1.25 flex items-baseline gap-1.75">
          <span className="font-cond text-[32px] font-bold text-navy-800">{igraci.length}</span>
          <span className="font-body text-xs font-semibold text-red-600">igrača</span>
        </div>
      </button>

      {otvoreno && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-72 overflow-y-auto rounded-[9px] border border-navy-800/12 bg-white shadow-[0_10px_30px_rgba(15,29,53,.18)]">
          {igraci.length === 0 ? (
            <p className="p-3.5 font-body text-sm text-navy-800/50">Niko nije ispod praga.</p>
          ) : (
            [...igraci]
              .sort((a, b) => a.procenat - b.procenat)
              .map((i) => (
                <div
                  key={i.ime}
                  className="flex items-center justify-between border-b border-navy-800/5 px-3.5 py-2.25 last:border-0"
                >
                  <span className="font-body text-sm text-navy-800">{i.ime}</span>
                  <span className="tabular-nums font-body text-sm font-semibold text-red-600">{i.procenat}%</span>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
