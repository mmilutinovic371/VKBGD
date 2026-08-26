"use client";

import { useState, useTransition } from "react";
import { prijaviSe } from "@/app/akcije";

interface Igrac {
  id: number;
  name: string;
  capNumber: number | null;
}

export default function Forma({ igraci }: { igraci: Igrac[] }) {
  const [playerId, setPlayerId] = useState<number | "">("");
  const [pin, setPin] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [uToku, pokreni] = useTransition();

  function posalji(e: React.FormEvent) {
    e.preventDefault();
    if (playerId === "") {
      setGreska("Izaberi ime sa spiska.");
      return;
    }
    setGreska(null);
    pokreni(async () => {
      const rez = await prijaviSe(Number(playerId), pin);
      if (rez?.greska) setGreska(rez.greska);
    });
  }

  return (
    <form onSubmit={posalji} className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Ime</span>
        <select
          className="rounded-lg border border-slate-300 p-2.5 text-base"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">— izaberi —</option>
          {igraci.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
              {i.capNumber ? ` (kapa ${i.capNumber})` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">PIN</span>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          minLength={4}
          maxLength={6}
          className="rounded-lg border border-slate-300 p-2.5 text-base tracking-widest"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="••••"
        />
      </label>

      {greska && <p className="text-sm text-red-600">{greska}</p>}

      <button
        type="submit"
        disabled={uToku}
        className="rounded-lg bg-indigo-600 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {uToku ? "Prijavljivanje…" : "Uđi"}
      </button>
    </form>
  );
}
