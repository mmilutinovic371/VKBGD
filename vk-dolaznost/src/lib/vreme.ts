import type { Training } from "@/db/schema";

export const BEOGRAD_ZONA = "Europe/Belgrade";

const DANI_KOD = ["ned", "pon", "uto", "sre", "cet", "pet", "sub"] as const;
export type DanKod = (typeof DANI_KOD)[number];

function delovi(datum: Date, zona: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  const rec: Record<string, string> = {};
  for (const p of dtf.formatToParts(datum)) rec[p.type] = p.value;
  return rec;
}

/** Razlika (u minutima) između lokalnog "zidnog" vremena zone i UTC, za dati trenutak. */
function offsetMinuta(datumUTC: Date, zona: string): number {
  const d = delovi(datumUTC, zona);
  const kaoUTC = Date.UTC(
    Number(d.year),
    Number(d.month) - 1,
    Number(d.day),
    Number(d.hour),
    Number(d.minute),
    Number(d.second),
  );
  return (kaoUTC - datumUTC.getTime()) / 60000;
}

/** Napravi Date iz beogradskog kalendarskog datuma/vremena (DST-svesno). */
export function beogradskoUTC(
  godina: number,
  mesec1: number, // 1-12
  dan: number,
  sat: number,
  minut: number,
): Date {
  const naivno = new Date(Date.UTC(godina, mesec1 - 1, dan, sat, minut));
  const offset = offsetMinuta(naivno, BEOGRAD_ZONA);
  return new Date(naivno.getTime() - offset * 60000);
}

export function danUNedeljiBeograd(datum: Date): DanKod {
  const d = delovi(datum, BEOGRAD_ZONA);
  const mapa: Record<string, DanKod> = {
    Sun: "ned",
    Mon: "pon",
    Tue: "uto",
    Wed: "sre",
    Thu: "cet",
    Fri: "pet",
    Sat: "sub",
  };
  return mapa[d.weekday] ?? "pon";
}

export function formatDatumVreme(datum: Date): string {
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    timeZone: BEOGRAD_ZONA,
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(datum);
}

export function formatDatum(datum: Date): string {
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    timeZone: BEOGRAD_ZONA,
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(datum);
}

export function formatVreme(datum: Date): string {
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    timeZone: BEOGRAD_ZONA,
    hour: "2-digit",
    minute: "2-digit",
  }).format(datum);
}

/** Da li je "Tu sam" dugme aktivno za dati termin, u trenutku `sada`. */
export function prozorOtvoren(
  termin: Pick<Training, "startsAt" | "checkinOpensMin" | "checkinClosesMin" | "canceled">,
  sada: Date = new Date(),
): boolean {
  if (termin.canceled) return false;
  const otvara = termin.startsAt.getTime() - termin.checkinOpensMin * 60_000;
  const zatvara = termin.startsAt.getTime() + termin.checkinClosesMin * 60_000;
  const t = sada.getTime();
  return t >= otvara && t <= zatvara;
}

export function prozorJosNijeOtvoren(
  termin: Pick<Training, "startsAt" | "checkinOpensMin">,
  sada: Date = new Date(),
): boolean {
  const otvara = termin.startsAt.getTime() - termin.checkinOpensMin * 60_000;
  return sada.getTime() < otvara;
}

export function prozorVecZatvoren(
  termin: Pick<Training, "startsAt" | "checkinClosesMin">,
  sada: Date = new Date(),
): boolean {
  const zatvara = termin.startsAt.getTime() + termin.checkinClosesMin * 60_000;
  return sada.getTime() > zatvara;
}

export interface GenerisiTermineOpcije {
  odDatuma: string; // "YYYY-MM-DD", beogradski kalendarski datum
  doDatuma: string; // "YYYY-MM-DD", uključno
  dani: DanKod[];
  sat: number;
  minut: number;
  trajanjeMin?: number;
  lokacija?: string;
  vrsta?: "trening" | "utakmica" | "teretana";
}

export interface NoviTermin {
  startsAt: Date;
  durationMin: number;
  location: string;
  kind: "trening" | "utakmica" | "teretana";
}

/** Generiše termine za sve izabrane dane u nedelji, u opsegu datuma (uključno). */
export function generisiTermine(opcije: GenerisiTermineOpcije): NoviTermin[] {
  const {
    odDatuma,
    doDatuma,
    dani,
    sat,
    minut,
    trajanjeMin = 90,
    lokacija = "Bazen Beograd",
    vrsta = "trening",
  } = opcije;

  const [godO, mesO, danO] = odDatuma.split("-").map(Number);
  const [godD, mesD, danD] = doDatuma.split("-").map(Number);

  const pocetak = beogradskoUTC(godO, mesO, danO, 0, 0);
  const kraj = beogradskoUTC(godD, mesD, danD, 23, 59);

  const skup = new Set(dani);
  const rezultat: NoviTermin[] = [];

  for (
    let dan = new Date(pocetak);
    dan.getTime() <= kraj.getTime();
    dan = new Date(dan.getTime() + 24 * 3600_000)
  ) {
    const d = delovi(dan, BEOGRAD_ZONA);
    const kod = danUNedeljiBeograd(dan);
    if (!skup.has(kod)) continue;
    const startsAt = beogradskoUTC(Number(d.year), Number(d.month), Number(d.day), sat, minut);
    rezultat.push({
      startsAt,
      durationMin: trajanjeMin,
      location: lokacija,
      kind: vrsta,
    });
  }

  return rezultat;
}
