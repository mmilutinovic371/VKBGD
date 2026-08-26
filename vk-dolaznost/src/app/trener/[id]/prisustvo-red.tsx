"use client";

import { useState, useTransition } from "react";
import { postaviPrisustvo } from "@/app/akcije";

type Rsvp = "dolazim" | "ne_dolazim" | "mozda" | null;

const RSVP_TEKST: Record<NonNullable<Rsvp>, string> = {
  dolazim: "Dolazi",
  mozda: "Možda",
  ne_dolazim: "Ne dolazi",
};

export default function PrisustvoRed({
  trainingId,
  playerId,
  ime,
  capNumber,
  rsvp,
  present: pocetnoPresent,
}: {
  trainingId: number;
  playerId: number;
  ime: string;
  capNumber: number | null;
  rsvp: Rsvp;
  present: boolean | null;
}) {
  const [present, setPresent] = useState<boolean | null>(pocetnoPresent);
  const [uToku, pokreni] = useTransition();

  function postavi(vrednost: boolean | null) {
    setPresent(vrednost);
    pokreni(async () => {
      await postaviPrisustvo(trainingId, playerId, vrednost);
    });
  }

  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <div>
        <p className="text-sm font-medium">
          {ime}
          {capNumber ? <span className="text-slate-400"> #{capNumber}</span> : null}
        </p>
        {rsvp && <p className="text-xs text-slate-500">Najavio: {RSVP_TEKST[rsvp]}</p>}
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => postavi(true)}
          disabled={uToku}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
            present === true
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-300 text-slate-500"
          }`}
        >
          Prisutan
        </button>
        <button
          onClick={() => postavi(false)}
          disabled={uToku}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
            present === false ? "border-red-500 bg-red-500 text-white" : "border-slate-300 text-slate-500"
          }`}
        >
          Odsutan
        </button>
      </div>
    </div>
  );
}
