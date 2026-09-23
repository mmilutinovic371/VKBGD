"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { prijaviSe } from "@/app/akcije";

interface Igrac {
  id: number;
  name: string;
  capNumber: number | null;
}

const KLJUC_POSLEDNJI = "vk_poslednji_igrac";

export default function Forma({ igraci }: { igraci: Igrac[] }) {
  const [playerId, setPlayerId] = useState<number | "">("");
  const [pin, setPin] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [uToku, pokreni] = useTransition();
  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const sacuvano = localStorage.getItem(KLJUC_POSLEDNJI);
      if (sacuvano && igraci.some((i) => i.id === Number(sacuvano))) {
        setPlayerId(Number(sacuvano));
        pinInputRef.current?.focus();
      }
    } catch {
      // localStorage nedostupan (privatni režim i sl.) — nije bitno, samo se ne pamti.
    }
  }, [igraci]);

  function izaberiIgraca(id: number | "") {
    setPlayerId(id);
    try {
      if (id === "") localStorage.removeItem(KLJUC_POSLEDNJI);
      else localStorage.setItem(KLJUC_POSLEDNJI, String(id));
    } catch {
      // ignoriši — nije kritično
    }
  }

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

  const brojKucica = Math.max(4, pin.length);

  return (
    <form onSubmit={posalji} className="relative flex flex-col gap-3.5">
      <label className="flex flex-col gap-1.5">
        <span className="font-body text-[11px] font-semibold uppercase tracking-[.14em] text-white/50">
          Ime
        </span>
        <select
          className="rounded-[9px] border border-white/18 bg-white/6 p-3.5 text-[15px] font-medium text-white outline-none focus:border-red-600"
          value={playerId}
          onChange={(e) => izaberiIgraca(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="" className="text-navy-800">
            — izaberi —
          </option>
          {igraci.map((i) => (
            <option key={i.id} value={i.id} className="text-navy-800">
              {i.name}
              {i.capNumber ? ` (kapa ${i.capNumber})` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-body text-[11px] font-semibold uppercase tracking-[.14em] text-white/50">
          PIN
        </span>
        <div
          className="relative flex gap-2.5"
          onClick={() => pinInputRef.current?.focus()}
        >
          {Array.from({ length: brojKucica }).map((_, i) => {
            const popunjena = i < pin.length;
            const aktivna = i === pin.length;
            return (
              <div
                key={i}
                className={`grid h-14 flex-1 place-items-center rounded-[9px] border bg-white/6 font-cond text-[26px] font-bold text-white ${
                  aktivna ? "border-red-600" : "border-white/18"
                }`}
              >
                {popunjena ? "•" : ""}
              </div>
            );
          })}
          <input
            ref={pinInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="absolute inset-0 h-14 w-full cursor-pointer opacity-0"
            aria-label="PIN"
          />
        </div>
      </label>

      {greska && <p className="font-body text-[13px] font-medium text-red-600">{greska}</p>}

      <button
        type="submit"
        disabled={uToku}
        className="mt-1.5 rounded-[9px] bg-red-600 py-[15px] font-cond text-xl font-bold uppercase tracking-[.1em] text-white transition-colors hover:bg-red-500 disabled:opacity-60"
      >
        {uToku ? "Prijavljivanje…" : "Uđi"}
      </button>

      <p className="text-center font-body text-[12.5px] leading-relaxed text-white/45">
        Prvi put biraš svoj PIN od 4 cifre. Ostaješ prijavljen 180 dana — bez mejla i naloga.
      </p>
    </form>
  );
}
