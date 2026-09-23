"use client";

import { useState, useTransition } from "react";
import { posaljiObavestenje } from "@/app/akcije";

const SABLONI = [
  {
    id: "a",
    ime: "Otkazan termin",
    tekst: "Večerašnji trening na Banjici je otkazan — bazen je zatvoren zbog servisa. Vidimo se u petak u 20:00.",
  },
  {
    id: "b",
    ime: "Podsetnik",
    tekst: "Podsetnik: sutra u 20:00 trening na Banjici. Izjasnite se u aplikaciji do 18:00.",
  },
  {
    id: "c",
    ime: "Utakmica",
    tekst:
      "Subota 18:00, Bazen 25. maj — 3. kolo protiv Crvene zvezde. Sastav objavljujem u petak posle treninga. Kape i bele majice obavezno.",
  },
  {
    id: "d",
    ime: "Prag 70%",
    tekst: "Ko je ispod 70% dolaznosti ne ulazi u sastav za subotu. Stanje možete videti na svom profilu.",
  },
];

export default function NovoObavestenjeForma({ primalaca }: { primalaca: number }) {
  const [sablon, setSablon] = useState<string | null>(null);
  const [tekst, setTekst] = useState("");
  const [poslato, setPoslato] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [uToku, pokreni] = useTransition();

  function posalji() {
    setGreska(null);
    setPoslato(false);
    pokreni(async () => {
      const rez = await posaljiObavestenje(tekst);
      if (rez?.greska) setGreska(rez.greska);
      else {
        setPoslato(true);
        setTekst("");
        setSablon(null);
      }
    });
  }

  return (
    <div className="rounded-[10px] border border-navy-800/9 bg-white p-5">
      <div className="font-cond text-xl font-bold uppercase tracking-[.03em] text-navy-800">Novo obaveštenje</div>

      <div className="mt-3.5 flex flex-wrap gap-1.75">
        {SABLONI.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSablon(s.id);
              setTekst(s.tekst);
              setPoslato(false);
            }}
            className={`rounded-[20px] border px-3.25 py-1.75 font-body text-xs font-semibold transition-colors ${
              sablon === s.id ? "border-navy-800 bg-navy-800 text-white" : "border-navy-800/16 text-navy-800/60"
            }`}
          >
            {s.ime}
          </button>
        ))}
      </div>

      <textarea
        value={tekst}
        onChange={(e) => {
          setTekst(e.target.value);
          setPoslato(false);
        }}
        placeholder="Napiši obaveštenje ili izaberi šablon iznad…"
        className="mt-3.5 min-h-[104px] w-full resize-y rounded-[9px] border border-navy-800/14 p-4 font-body text-[15px] leading-relaxed text-navy-800 outline-none focus:border-red-600"
      />

      {greska && <p className="mt-2 font-body text-sm text-red-600">{greska}</p>}

      <div className="mt-3.5 flex items-center justify-between">
        <span className="font-body text-[12.5px] font-medium text-navy-800/50">
          Prima {primalaca} igrača · u aplikaciji
        </span>
        <button
          onClick={posalji}
          disabled={uToku || !tekst.trim()}
          className="rounded-[8px] bg-red-600 px-5.5 py-2.75 font-cond text-[15px] font-bold uppercase tracking-[.08em] text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          {poslato ? "Poslato ✓" : "Pošalji svima"}
        </button>
      </div>
    </div>
  );
}
