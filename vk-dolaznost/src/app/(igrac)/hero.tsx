"use client";

import { useEffect, useState, useTransition } from "react";
import { cekirajSe, postaviRsvp } from "@/app/akcije";
import {
  formatVreme,
  prozorJosNijeOtvoren,
  prozorOtvoren,
  prozorVecZatvoren,
  relativniDan,
} from "@/lib/vreme";

type Rsvp = "dolazim" | "ne_dolazim" | "mozda" | null;

const NAZIV_VRSTE: Record<string, string> = { trening: "Trening", utakmica: "Utakmica", teretana: "Teretana" };

interface GlavniTermin {
  id: number;
  startsAt: string;
  durationMin: number;
  location: string;
  kind: "trening" | "utakmica" | "teretana";
  checkinOpensMin: number;
  checkinClosesMin: number;
}

interface Cip {
  ime: string;
  stanje: "dolazi" | "mozda" | "ostalo";
}

interface SledeciStavka {
  id: number;
  startsAt: string;
  location: string;
  kind: string;
  rsvp: Rsvp;
}

export default function Hero({
  termin,
  present: pocetniPresent,
  cipovi,
  ukupnoIgraca,
  mojProcenat,
  mojaOdigranih,
  mojaPrisutan,
  prag,
  sledeci,
}: {
  termin: GlavniTermin;
  present: boolean | null;
  cipovi: Cip[];
  ukupnoIgraca: number;
  mojProcenat: number;
  mojaOdigranih: number;
  mojaPrisutan: number;
  prag: number;
  sledeci: SledeciStavka[];
}) {
  const [present, setPresent] = useState(pocetniPresent);
  const [sada, setSada] = useState(new Date());
  const [greska, setGreska] = useState<string | null>(null);
  const [uToku, pokreni] = useTransition();

  useEffect(() => {
    const id = setInterval(() => setSada(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const startsAt = new Date(termin.startsAt);
  const otvoren = prozorOtvoren(
    { startsAt, checkinOpensMin: termin.checkinOpensMin, checkinClosesMin: termin.checkinClosesMin, canceled: false },
    sada,
  );
  const josNije = prozorJosNijeOtvoren({ startsAt, checkinOpensMin: termin.checkinOpensMin }, sada);
  const zatvoren = prozorVecZatvoren({ startsAt, checkinClosesMin: termin.checkinClosesMin }, sada);

  const ostaloMs = Math.max(0, startsAt.getTime() - sada.getTime());
  const ostaloSek = Math.floor(ostaloMs / 1000);
  const brojac =
    ostaloSek < 3600
      ? `${String(Math.floor(ostaloSek / 60)).padStart(2, "0")}:${String(ostaloSek % 60).padStart(2, "0")}`
      : `${String(Math.floor(ostaloSek / 3600)).padStart(2, "0")}:${String(Math.floor((ostaloSek % 3600) / 60)).padStart(2, "0")}`;

  const dolaziBroj = cipovi.filter((c) => c.stanje === "dolazi").length;

  function cekirajKlik() {
    setGreska(null);
    pokreni(async () => {
      const rez = await cekirajSe(termin.id);
      if (rez?.greska) setGreska(rez.greska);
      else setPresent(true);
    });
  }

  const stanjeOznaka = present
    ? "Čekiran/a — vidimo se u vodi"
    : otvoren
      ? "Prozor za čekiranje je otvoren"
      : josNije
        ? "Čekiranje se otvara uskoro"
        : "Prozor za čekiranje je zatvoren";

  const otvaraSe = new Date(startsAt.getTime() - termin.checkinOpensMin * 60_000);
  const zatvaraSe = new Date(startsAt.getTime() + termin.checkinClosesMin * 60_000);

  return (
    <div className="relative overflow-hidden">
      <div className="staze-tamne pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(218,31,46,.32), transparent 65%)" }}
      />
      <div className="relative grid grid-cols-1 gap-11 px-6 pb-11 pt-11 md:grid-cols-[1.35fr_1fr] md:px-10">
        <div>
          <div
            className={`inline-flex items-center gap-2 rounded-[30px] border px-3 py-1.5 ${
              present ? "border-green-700/50 bg-green-700/15" : "border-red-600/40 bg-red-600/16"
            }`}
          >
            <span className={`h-[7px] w-[7px] rounded-full ${present ? "bg-green-300" : "bg-red-500"}`} />
            <span
              className={`font-body text-[11px] font-semibold uppercase tracking-[.16em] ${
                present ? "text-green-300" : "text-red-300"
              }`}
            >
              {stanjeOznaka}
            </span>
          </div>

          <h1 className="mt-4 font-cond text-[56px] font-bold uppercase leading-[.95] tracking-[-.01em] text-white md:text-[84px] md:leading-[.9]">
            {NAZIV_VRSTE[termin.kind]}
            <br />
            {relativniDan(startsAt, sada)} {formatVreme(startsAt)}
          </h1>
          <p className="mt-3.5 max-w-[460px] font-body text-[17px] leading-relaxed text-white/60">
            {termin.location} · {termin.durationMin} minuta · Prozor za čekiranje: {formatVreme(otvaraSe)}–
            {formatVreme(zatvaraSe)}.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4.5">
            <button
              onClick={cekirajKlik}
              disabled={!otvoren || uToku || !!present}
              className={`rounded-xl px-9 py-5 font-cond text-2xl font-bold uppercase tracking-[.06em] transition-colors md:text-[30px] ${
                present
                  ? "bg-green-700 text-white"
                  : otvoren
                    ? "bg-red-600 text-white shadow-[0_12px_34px_rgba(218,31,46,.36)] hover:bg-red-500"
                    : "bg-white/12 text-white/35"
              }`}
            >
              {present ? "✓ Čekiran" : "Tu sam"}
            </button>
            <div>
              <div className="font-body text-[11px] font-medium uppercase tracking-[.14em] text-white/40">
                Do početka
              </div>
              <div className="tabular-nums font-cond text-[28px] font-bold text-white md:text-[34px]">{brojac}</div>
            </div>
          </div>
          {greska && <p className="mt-3 font-body text-sm text-red-300">{greska}</p>}

          <div className="mt-8 border-t border-white/9 pt-5.5">
            <div className="font-body text-[11px] font-medium uppercase tracking-[.14em] text-white/40">
              Ko je najavio dolazak · {dolaziBroj} od {ukupnoIgraca}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.75">
              {cipovi.map((c, i) => (
                <span
                  key={i}
                  className={`rounded-[20px] border px-2.75 py-1.25 font-body text-xs font-semibold ${
                    c.stanje === "dolazi"
                      ? "border-green-700/55 bg-green-700/22 text-green-300"
                      : c.stanje === "mozda"
                        ? "border-amber-600/50 bg-amber-600/16 text-amber-300"
                        : "border-white/16 bg-white/4 text-white/45"
                  }`}
                >
                  {c.ime}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[14px] border border-white/10 bg-white/4 p-5.5 backdrop-blur-md">
          <div className="flex items-baseline justify-between">
            <span className="font-body text-[11px] font-semibold uppercase tracking-[.16em] text-white/45">
              Moja sezona
            </span>
            <span className="font-cond text-[40px] font-bold text-white">{mojProcenat}%</span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-[3px] bg-white/12">
            <div
              className="h-full"
              style={{ width: `${mojProcenat}%`, background: "linear-gradient(90deg, #DA1F2E, #F0303F)" }}
            />
          </div>
          <div className="mt-2 font-body text-[12.5px] text-white/50">
            {mojaPrisutan} od {mojaOdigranih} odigranih termina · prag za utakmice je {prag}%
          </div>

          <div className="mt-5.5 flex flex-col gap-2.5">
            {sledeci.length === 0 && (
              <p className="font-body text-[12.5px] text-white/45">Nema drugih zakazanih termina.</p>
            )}
            {sledeci.map((s) => (
              <SledeciRed key={s.id} stavka={s} />
            ))}
          </div>

          <div className="mt-4.5 rounded-[9px] border border-dashed border-white/20 p-3.25 font-body text-[12.5px] leading-relaxed text-white/55">
            Push podsetnici stižu uskoro. Za sada, obaveštenja od trenera vidiš u kartici „Obaveštenja".
          </div>
        </div>
      </div>
    </div>
  );
}

function SledeciRed({ stavka }: { stavka: SledeciStavka }) {
  const [rsvp, setRsvp] = useState<Rsvp>(stavka.rsvp);
  const [uToku, pokreni] = useTransition();
  const startsAt = new Date(stavka.startsAt);
  const aktivan = rsvp === "dolazim";

  function klik() {
    const novo = aktivan ? "ne_dolazim" : "dolazim";
    setRsvp(novo);
    pokreni(async () => {
      await postaviRsvp(stavka.id, novo);
    });
  }

  return (
    <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-[9px] bg-white/5 p-3">
      <div>
        <div className="font-body text-[10px] font-medium uppercase tracking-[.1em] text-white/40">
          {relativniDan(startsAt)}
        </div>
        <div className="font-cond text-[19px] font-bold text-white">
          {startsAt.getDate()}.{startsAt.getMonth() + 1}
        </div>
      </div>
      <div>
        <div className="font-body text-[13.5px] font-semibold text-white">{NAZIV_VRSTE[stavka.kind] ?? stavka.kind}</div>
        <div className="font-body text-[11.5px] text-white/45">
          {formatVreme(startsAt)} · {stavka.location}
        </div>
      </div>
      <button
        onClick={klik}
        disabled={uToku}
        className={`rounded-[20px] border px-3.25 py-1.75 font-body text-[11.5px] font-semibold ${
          aktivan ? "border-green-700 bg-green-700 text-white" : "border-white/20 bg-white/6 text-white/70"
        }`}
      >
        {rsvp === "dolazim" ? "Dolazim" : rsvp === "ne_dolazim" ? "Ne dolazim" : "Izjasni se"}
      </button>
    </div>
  );
}
