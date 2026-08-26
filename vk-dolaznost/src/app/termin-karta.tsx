"use client";

import { useEffect, useState, useTransition } from "react";
import { cekirajSe, postaviRsvp } from "./akcije";
import { formatDatumVreme, prozorJosNijeOtvoren, prozorOtvoren } from "@/lib/vreme";

type Rsvp = "dolazim" | "ne_dolazim" | "mozda" | null;

interface Termin {
  id: number;
  startsAt: string;
  durationMin: number;
  location: string;
  kind: "trening" | "utakmica" | "teretana";
  checkinOpensMin: number;
  checkinClosesMin: number;
}

const NAZIV_VRSTE: Record<Termin["kind"], string> = {
  trening: "Trening",
  utakmica: "Utakmica",
  teretana: "Teretana",
};

export default function TerminKarta({
  termin,
  rsvp: pocetniRsvp,
  present: pocetniPresent,
}: {
  termin: Termin;
  rsvp: Rsvp;
  present: boolean | null;
}) {
  const [rsvp, setRsvp] = useState<Rsvp>(pocetniRsvp);
  const [present, setPresent] = useState<boolean | null>(pocetniPresent);
  const [greska, setGreska] = useState<string | null>(null);
  const [uToku, pokreni] = useTransition();
  const [sada, setSada] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setSada(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const startsAt = new Date(termin.startsAt);
  const otvoren = prozorOtvoren(
    { startsAt, checkinOpensMin: termin.checkinOpensMin, checkinClosesMin: termin.checkinClosesMin, canceled: false },
    sada,
  );
  const josNije = prozorJosNijeOtvoren({ startsAt, checkinOpensMin: termin.checkinOpensMin }, sada);

  function biraj(vrednost: NonNullable<Rsvp>) {
    setGreska(null);
    setRsvp(vrednost);
    pokreni(async () => {
      const rez = await postaviRsvp(termin.id, vrednost);
      if (rez?.greska) setGreska(rez.greska);
    });
  }

  function cekirajKlik() {
    setGreska(null);
    pokreni(async () => {
      const rez = await cekirajSe(termin.id);
      if (rez?.greska) setGreska(rez.greska);
      else setPresent(true);
    });
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{formatDatumVreme(startsAt)}</p>
          <p className="text-sm text-slate-500">
            {NAZIV_VRSTE[termin.kind]} · {termin.location}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {(
          [
            ["dolazim", "Dolazim"],
            ["mozda", "Možda"],
            ["ne_dolazim", "Ne dolazim"],
          ] as const
        ).map(([vred, tekst]) => (
          <button
            key={vred}
            onClick={() => biraj(vred)}
            disabled={uToku}
            className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
              rsvp === vred
                ? vred === "dolazim"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : vred === "mozda"
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-slate-500 bg-slate-500 text-white"
                : "border-slate-200 text-slate-600"
            }`}
          >
            {tekst}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {present ? (
          <div className="rounded-lg bg-emerald-50 py-2 text-center text-sm font-medium text-emerald-700">
            ✓ Čekiran/a
          </div>
        ) : (
          <button
            onClick={cekirajKlik}
            disabled={!otvoren || uToku}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white disabled:bg-slate-200 disabled:text-slate-400"
          >
            {otvoren
              ? "Tu sam"
              : josNije
                ? "Čekiranje se otvara 60 min pre početka"
                : "Prozor za čekiranje je zatvoren"}
          </button>
        )}
      </div>

      {greska && <p className="mt-2 text-sm text-red-600">{greska}</p>}
    </div>
  );
}
