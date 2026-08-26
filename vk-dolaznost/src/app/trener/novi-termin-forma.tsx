"use client";

import { useState, useTransition } from "react";
import { dodajNedeljniRaspored, dodajTermin } from "@/app/akcije";
import type { DanKod } from "@/lib/vreme";
import { beogradskoUTC } from "@/lib/vreme";

const DANI: { kod: DanKod; naziv: string }[] = [
  { kod: "pon", naziv: "Pon" },
  { kod: "uto", naziv: "Uto" },
  { kod: "sre", naziv: "Sre" },
  { kod: "cet", naziv: "Čet" },
  { kod: "pet", naziv: "Pet" },
  { kod: "sub", naziv: "Sub" },
  { kod: "ned", naziv: "Ned" },
];

export default function NoviTerminForma() {
  const [otvoreno, setOtvoreno] = useState<"jedan" | "nedeljni" | null>(null);
  const [greska, setGreska] = useState<string | null>(null);
  const [uToku, pokreni] = useTransition();

  const [datum, setDatum] = useState("");
  const [vreme, setVreme] = useState("19:00");
  const [lokacija, setLokacija] = useState("Bazen Beograd");
  const [vrsta, setVrsta] = useState<"trening" | "utakmica" | "teretana">("trening");
  const [trajanje, setTrajanje] = useState(90);

  const [odDatuma, setOdDatuma] = useState("");
  const [doDatuma, setDoDatuma] = useState("");
  const [dani, setDani] = useState<Set<DanKod>>(new Set());

  function posaljiJedan(e: React.FormEvent) {
    e.preventDefault();
    if (!datum) return setGreska("Izaberi datum.");
    const [god, mes, dan] = datum.split("-").map(Number);
    const [sat, minut] = vreme.split(":").map(Number);
    const startsAt = beogradskoUTC(god, mes, dan, sat, minut);
    setGreska(null);
    pokreni(async () => {
      const rez = await dodajTermin({ startsAt, durationMin: trajanje, location: lokacija, kind: vrsta });
      if (rez?.greska) setGreska(rez.greska);
      else setOtvoreno(null);
    });
  }

  function posaljiNedeljni(e: React.FormEvent) {
    e.preventDefault();
    if (!odDatuma || !doDatuma) return setGreska("Popuni opseg datuma.");
    if (dani.size === 0) return setGreska("Izaberi bar jedan dan u nedelji.");
    const [sat, minut] = vreme.split(":").map(Number);
    setGreska(null);
    pokreni(async () => {
      const rez = await dodajNedeljniRaspored({
        odDatuma,
        doDatuma,
        dani: Array.from(dani),
        sat,
        minut,
        trajanjeMin: trajanje,
        lokacija,
        vrsta,
      });
      if (rez?.greska) setGreska(rez.greska);
      else setOtvoreno(null);
    });
  }

  function prekidacDan(kod: DanKod) {
    setDani((prethodno) => {
      const novo = new Set(prethodno);
      if (novo.has(kod)) novo.delete(kod);
      else novo.add(kod);
      return novo;
    });
  }

  if (!otvoreno) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setOtvoreno("jedan")}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
        >
          + Jedan termin
        </button>
        <button
          onClick={() => setOtvoreno("nedeljni")}
          className="rounded-lg border border-indigo-600 px-3 py-2 text-sm font-medium text-indigo-600"
        >
          + Nedeljni raspored
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={otvoreno === "jedan" ? posaljiJedan : posaljiNedeljni}
      className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm"
    >
      <p className="text-sm font-semibold text-slate-700">
        {otvoreno === "jedan" ? "Novi termin" : "Nedeljni raspored"}
      </p>

      {otvoreno === "jedan" ? (
        <label className="flex flex-col gap-1 text-sm">
          Datum
          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className="rounded-lg border border-slate-300 p-2"
          />
        </label>
      ) : (
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Od
            <input
              type="date"
              value={odDatuma}
              onChange={(e) => setOdDatuma(e.target.value)}
              className="rounded-lg border border-slate-300 p-2"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Do
            <input
              type="date"
              value={doDatuma}
              onChange={(e) => setDoDatuma(e.target.value)}
              className="rounded-lg border border-slate-300 p-2"
            />
          </label>
        </div>
      )}

      {otvoreno === "nedeljni" && (
        <div className="flex flex-wrap gap-1.5">
          {DANI.map((d) => (
            <button
              type="button"
              key={d.kod}
              onClick={() => prekidacDan(d.kod)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                dani.has(d.kod) ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-slate-600"
              }`}
            >
              {d.naziv}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Vreme
          <input
            type="time"
            value={vreme}
            onChange={(e) => setVreme(e.target.value)}
            className="rounded-lg border border-slate-300 p-2"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Trajanje (min)
          <input
            type="number"
            value={trajanje}
            onChange={(e) => setTrajanje(Number(e.target.value))}
            className="rounded-lg border border-slate-300 p-2"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Lokacija
          <input
            value={lokacija}
            onChange={(e) => setLokacija(e.target.value)}
            className="rounded-lg border border-slate-300 p-2"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Vrsta
          <select
            value={vrsta}
            onChange={(e) => setVrsta(e.target.value as typeof vrsta)}
            className="rounded-lg border border-slate-300 p-2"
          >
            <option value="trening">Trening</option>
            <option value="utakmica">Utakmica</option>
            <option value="teretana">Teretana</option>
          </select>
        </label>
      </div>

      {greska && <p className="text-sm text-red-600">{greska}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={uToku}
          className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {uToku ? "Snimanje…" : "Sačuvaj"}
        </button>
        <button
          type="button"
          onClick={() => setOtvoreno(null)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
          Otkaži
        </button>
      </div>
    </form>
  );
}
