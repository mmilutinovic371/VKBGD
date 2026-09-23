"use client";

import { useState, useTransition } from "react";
import { postaviPrisustvo } from "@/app/akcije";
import { formatVreme } from "@/lib/vreme";

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
  rsvp,
  present: pocetnoPresent,
  checkedInAt,
  procenat,
  prag,
}: {
  trainingId: number;
  playerId: number;
  ime: string;
  rsvp: Rsvp;
  present: boolean | null;
  checkedInAt: string | null;
  procenat: number;
  prag: number;
}) {
  const [present, setPresent] = useState<boolean | null>(pocetnoPresent);
  const [uToku, pokreni] = useTransition();

  function postavi(vrednost: boolean | null) {
    setPresent(vrednost);
    pokreni(async () => {
      await postaviPrisustvo(trainingId, playerId, vrednost);
    });
  }

  const procBoja = procenat < prag ? "#DA1F2E" : "#1F7A4D";

  return (
    <div
      className="grid grid-cols-[28px_1fr_auto] items-center gap-2.5 border-b border-navy-800/5 px-3.5 py-2.25 last:border-0 sm:grid-cols-[34px_1fr_100px_190px] sm:gap-3.5 sm:px-5"
      style={{ background: present === false ? "rgba(218,31,46,.05)" : "#fff" }}
    >
      <div className="grid h-6.5 w-6.5 place-items-center rounded-full bg-navy-800 font-cond text-[11px] font-bold text-white sm:h-7 sm:w-7 sm:text-xs">
        {ime.split(" ").map((d) => d[0]).join("").slice(0, 2).toUpperCase()}
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-body text-[13px] font-semibold text-navy-800 sm:text-sm">{ime}</span>
          <span
            className="tabular-nums font-body text-[11px] font-semibold sm:hidden"
            style={{ color: procBoja }}
          >
            {procenat}%
          </span>
        </div>
        <div className="font-body text-[11px] text-navy-800/45 sm:text-[11.5px]">
          Najavio: {rsvp ? RSVP_TEKST[rsvp] : "—"}
          {present === true && checkedInAt ? ` · sam se čekirao ${formatVreme(new Date(checkedInAt))}` : ""}
        </div>
      </div>
      <div className="hidden items-center gap-1.75 sm:flex">
        <span className="tabular-nums font-body text-[13px] font-semibold" style={{ color: procBoja }}>
          {procenat}%
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-[2px] bg-navy-800/10">
          <div className="h-full" style={{ width: `${procenat}%`, background: procBoja }} />
        </div>
      </div>
      <div className="flex justify-end gap-1.25 sm:gap-1.5">
        <button
          onClick={() => postavi(present === true ? null : true)}
          disabled={uToku}
          className={`rounded-[6px] border px-2 py-1.5 font-body text-[10.5px] font-semibold transition-colors sm:px-3.5 sm:py-1.75 sm:text-xs ${
            present === true ? "border-green-700 bg-green-700 text-white" : "border-navy-800/16 text-navy-800/55"
          }`}
        >
          Prisutan
        </button>
        <button
          onClick={() => postavi(present === false ? null : false)}
          disabled={uToku}
          className={`rounded-[6px] border px-2 py-1.5 font-body text-[10.5px] font-semibold transition-colors sm:px-3.5 sm:py-1.75 sm:text-xs ${
            present === false ? "border-red-600 bg-red-600 text-white" : "border-navy-800/16 text-navy-800/55"
          }`}
        >
          Odsutan
        </button>
      </div>
    </div>
  );
}
