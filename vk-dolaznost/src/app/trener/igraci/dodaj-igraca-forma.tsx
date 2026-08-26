"use client";

import { useState, useTransition } from "react";
import { dodajIgraca } from "@/app/akcije";

export default function DodajIgracaForma() {
  const [ime, setIme] = useState("");
  const [kapa, setKapa] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [uToku, pokreni] = useTransition();

  function posalji(e: React.FormEvent) {
    e.preventDefault();
    setGreska(null);
    pokreni(async () => {
      const rez = await dodajIgraca(ime, kapa ? Number(kapa) : null);
      if (rez?.greska) setGreska(rez.greska);
      else {
        setIme("");
        setKapa("");
      }
    });
  }

  return (
    <form onSubmit={posalji} className="flex gap-2 rounded-xl bg-white p-4 shadow-sm">
      <input
        value={ime}
        onChange={(e) => setIme(e.target.value)}
        placeholder="Ime i prezime"
        className="flex-1 rounded-lg border border-navy-800/16 p-2 text-sm"
      />
      <input
        value={kapa}
        onChange={(e) => setKapa(e.target.value.replace(/\D/g, ""))}
        placeholder="Kapa"
        className="w-20 rounded-lg border border-navy-800/16 p-2 text-sm"
      />
      <button
        disabled={uToku}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        Dodaj
      </button>
      {greska && <p className="self-center text-sm text-red-600">{greska}</p>}
    </form>
  );
}
