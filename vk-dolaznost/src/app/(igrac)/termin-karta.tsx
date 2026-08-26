"use client";

import { useEffect, useState, useTransition } from "react";
import { cekirajSe, postaviRsvp } from "@/app/akcije";
import { formatVreme, prozorJosNijeOtvoren, prozorOtvoren, relativniDan } from "@/lib/vreme";

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

const AKCENT: Record<Termin["kind"], string> = {
  trening: "#0F1D35",
  utakmica: "rgba(218,165,32,.5)",
  teretana: "#2A4A7A",
};

// Puna (ne prigušena) boja za tekst oznake tipa — čitljivost, dok bordura ide na 50%.
const AKCENT_TEKST: Record<Termin["kind"], string> = {
  trening: "#0F1D35",
  utakmica: "#B8860B",
  teretana: "#2A4A7A",
};

export default function TerminKarta({
  termin,
  rsvp: pocetniRsvp,
  present: pocetniPresent,
  najave,
}: {
  termin: Termin;
  rsvp: Rsvp;
  present: boolean | null;
  najave: number;
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
  const zatvaraSe = new Date(startsAt.getTime() + termin.checkinClosesMin * 60_000);

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
    <div
      className="flex flex-col gap-3.5 rounded-[9px] border border-navy-800/9 bg-white p-4 sm:grid sm:grid-cols-[76px_1fr_auto] sm:items-center sm:gap-5 sm:p-4.5"
      style={{ borderLeft: `4px solid ${AKCENT[termin.kind]}` }}
    >
      {/* Datum — kompaktan red na mobilnom, tri reda centrirano na širem ekranu */}
      <div className="flex items-baseline gap-2 sm:hidden">
        <span className="font-body text-[11px] font-medium uppercase tracking-[.1em] text-navy-800/45">
          {relativniDan(startsAt, sada)}
        </span>
        <span className="font-cond text-lg font-bold text-navy-800">
          {startsAt.getDate()}.{startsAt.getMonth() + 1}
        </span>
        <span className="font-body text-[13px] font-semibold text-red-600">{formatVreme(startsAt)}</span>
      </div>
      <div className="hidden text-center sm:block">
        <div className="font-body text-[11px] font-medium uppercase tracking-[.12em] text-navy-800/45">
          {relativniDan(startsAt, sada)}
        </div>
        <div className="font-cond text-[27px] font-bold leading-[1.05] text-navy-800">
          {startsAt.getDate()}.{startsAt.getMonth() + 1}
        </div>
        <div className="font-body text-[13px] font-semibold text-red-600">{formatVreme(startsAt)}</div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span
            className="font-body text-[11px] font-semibold uppercase tracking-[.1em]"
            style={{ color: AKCENT[termin.kind] }}
          >
            {NAZIV_VRSTE[termin.kind]}
          </span>
          <span className="h-[3px] w-[3px] rounded-full bg-navy-800/25" />
          <span className="font-body text-[13px] font-medium text-navy-800/60">{termin.location}</span>
        </div>
        <div className="mt-1 font-body text-base font-semibold text-navy-800">{NAZIV_VRSTE[termin.kind]}</div>
        <div className="mt-1.5 font-body text-xs font-medium text-navy-800/50">{najave} najavilo dolazak</div>
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <div className="flex gap-1.5">
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
              className={`flex-1 rounded-[7px] border px-2.5 py-2 font-body text-[12px] font-semibold transition-colors sm:flex-none sm:px-3.5 sm:text-[12.5px] ${
                rsvp === vred
                  ? vred === "dolazim"
                    ? "border-green-700 bg-green-700 text-white"
                    : vred === "mozda"
                      ? "border-amber-600 bg-amber-600 text-white"
                      : "border-navy-800/55 bg-navy-800/55 text-white"
                  : "border-navy-800/16 bg-white text-navy-800/60"
              }`}
            >
              {tekst}
            </button>
          ))}
        </div>
        <div className="font-body text-[11.5px] font-medium text-navy-800/42 sm:text-right">
          {present ? (
            "✓ Čekiran/a"
          ) : otvoren ? (
            <button onClick={cekirajKlik} disabled={uToku} className="font-semibold text-red-600 underline">
              Tu sam · čekiranje otvoreno do {formatVreme(zatvaraSe)}
            </button>
          ) : josNije ? (
            "Čekiranje se otvara 60 min pre"
          ) : (
            "Prozor za čekiranje je zatvoren"
          )}
        </div>
        {greska && <p className="text-[11px] text-red-600">{greska}</p>}
      </div>
    </div>
  );
}
