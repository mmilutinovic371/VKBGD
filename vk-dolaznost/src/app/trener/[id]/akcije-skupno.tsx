"use client";

import { useTransition } from "react";
import { obrisiOznake, oznaciSvePrisutne } from "@/app/akcije";

export default function AkcijeSkupno({ trainingId }: { trainingId: number }) {
  const [uToku, pokreni] = useTransition();

  return (
    <div className="flex gap-1.75">
      <button
        onClick={() => pokreni(async () => { await oznaciSvePrisutne(trainingId); })}
        disabled={uToku}
        className="rounded-[7px] border border-navy-800/18 bg-white px-3.5 py-2.25 font-body text-[12.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-800/5"
      >
        Označi sve prisutne
      </button>
      <button
        onClick={() => {
          if (!confirm("Obrisati sve oznake prisustva za ovaj termin?")) return;
          pokreni(async () => { await obrisiOznake(trainingId); });
        }}
        disabled={uToku}
        className="rounded-[7px] border border-navy-800/18 bg-white px-3.5 py-2.25 font-body text-[12.5px] font-semibold text-navy-800/60 transition-colors hover:bg-navy-800/5"
      >
        Obriši oznake
      </button>
    </div>
  );
}
