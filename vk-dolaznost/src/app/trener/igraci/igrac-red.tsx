"use client";

import { useTransition } from "react";
import { izmeniIgraca, resetujPin } from "@/app/akcije";

export default function IgracRed({
  playerId,
  name,
  capNumber,
  active,
  imaPin,
}: {
  playerId: number;
  name: string;
  capNumber: number | null;
  active: boolean;
  imaPin: boolean;
}) {
  const [uToku, pokreni] = useTransition();

  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <div>
        <p className={`text-sm font-medium ${!active ? "text-slate-400 line-through" : ""}`}>
          {name}
          {capNumber ? <span className="text-slate-400"> #{capNumber}</span> : null}
        </p>
        <p className="text-xs text-slate-400">{imaPin ? "PIN postavljen" : "Čeka prvu prijavu"}</p>
      </div>
      <div className="flex gap-1.5">
        {imaPin && (
          <button
            onClick={() => {
              if (confirm(`Resetovati PIN za ${name}?`))
                pokreni(async () => {
                  await resetujPin(playerId);
                });
            }}
            disabled={uToku}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-600"
          >
            Reset PIN
          </button>
        )}
        <button
          onClick={() =>
            pokreni(async () => {
              await izmeniIgraca(playerId, { active: !active });
            })
          }
          disabled={uToku}
          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-600"
        >
          {active ? "Deaktiviraj" : "Aktiviraj"}
        </button>
      </div>
    </div>
  );
}
