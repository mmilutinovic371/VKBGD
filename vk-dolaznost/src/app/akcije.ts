"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { participation, players, trainings } from "@/db/schema";
import { hesirajPin, napraviSesiju, obrisiSesiju, proveriPin, sesija, trenerSesija } from "@/lib/auth";
import { prozorOtvoren, generisiTermine, type GenerisiTermineOpcije } from "@/lib/vreme";

export interface RezultatAkcije {
  greska?: string;
}

// ---------- Igrač: prijava ----------

export async function prijaviSe(playerId: number, pin: string): Promise<RezultatAkcije> {
  const baza = db();
  const [igrac] = await baza.select().from(players).where(eq(players.id, playerId)).limit(1);
  if (!igrac || !igrac.active) {
    return { greska: "Igrač nije pronađen." };
  }

  if (!/^\d{4,6}$/.test(pin)) {
    return { greska: "PIN mora imati 4 do 6 cifara." };
  }

  if (!igrac.pinHash) {
    // Prvo prijavljivanje — ovaj PIN postaje njegov za sezonu.
    const hash = await hesirajPin(pin);
    await baza.update(players).set({ pinHash: hash }).where(eq(players.id, igrac.id));
  } else {
    const tacan = await proveriPin(pin, igrac.pinHash);
    if (!tacan) {
      return { greska: "Pogrešan PIN." };
    }
  }

  await napraviSesiju({ playerId: igrac.id, role: igrac.role as "igrac" | "trener" });
  redirect(igrac.role === "trener" ? "/trener" : "/");
}

export async function odjaviSe(): Promise<void> {
  await obrisiSesiju();
  redirect("/login");
}

// ---------- Igrač: najava i čekiranje ----------

export async function postaviRsvp(
  trainingId: number,
  rsvp: "dolazim" | "ne_dolazim" | "mozda",
): Promise<RezultatAkcije> {
  const s = await sesija();
  if (!s) return { greska: "Nisi prijavljen." };

  const baza = db();
  await baza
    .insert(participation)
    .values({ trainingId, playerId: s.playerId, rsvp, rsvpAt: new Date() })
    .onConflictDoUpdate({
      target: [participation.trainingId, participation.playerId],
      set: { rsvp, rsvpAt: new Date() },
    });

  revalidatePath("/");
  return {};
}

export async function cekirajSe(trainingId: number): Promise<RezultatAkcije> {
  const s = await sesija();
  if (!s) return { greska: "Nisi prijavljen." };

  const baza = db();
  const [termin] = await baza.select().from(trainings).where(eq(trainings.id, trainingId)).limit(1);
  if (!termin) return { greska: "Termin ne postoji." };
  if (!prozorOtvoren(termin)) {
    return { greska: "Čekiranje je moguće samo od 60 min pre do 30 min posle početka." };
  }

  await baza
    .insert(participation)
    .values({
      trainingId,
      playerId: s.playerId,
      present: true,
      checkedInAt: new Date(),
      markedBy: "igrac",
    })
    .onConflictDoUpdate({
      target: [participation.trainingId, participation.playerId],
      set: { present: true, checkedInAt: new Date(), markedBy: "igrac" },
    });

  revalidatePath("/");
  return {};
}

// ---------- Trener: termini ----------

export async function dodajTermin(input: {
  startsAt: Date;
  durationMin: number;
  location: string;
  kind: "trening" | "utakmica" | "teretana";
}): Promise<RezultatAkcije> {
  const t = await trenerSesija();
  if (!t) return { greska: "Samo trener može ovo da radi." };

  const baza = db();
  await baza.insert(trainings).values(input);
  revalidatePath("/trener");
  return {};
}

export async function dodajNedeljniRaspored(opcije: GenerisiTermineOpcije): Promise<RezultatAkcije> {
  const t = await trenerSesija();
  if (!t) return { greska: "Samo trener može ovo da radi." };

  const novi = generisiTermine(opcije);
  if (novi.length === 0) return { greska: "Nijedan termin nije generisan — proveri dane i datume." };

  const baza = db();
  await baza.insert(trainings).values(novi);
  revalidatePath("/trener");
  return {};
}

export async function otkaziTermin(trainingId: number): Promise<RezultatAkcije> {
  const t = await trenerSesija();
  if (!t) return { greska: "Samo trener može ovo da radi." };

  const baza = db();
  await baza.update(trainings).set({ canceled: true }).where(eq(trainings.id, trainingId));
  revalidatePath("/trener");
  return {};
}

// ---------- Trener: prisustvo ----------

export async function postaviPrisustvo(
  trainingId: number,
  playerId: number,
  present: boolean | null,
): Promise<RezultatAkcije> {
  const t = await trenerSesija();
  if (!t) return { greska: "Samo trener može ovo da radi." };

  const baza = db();
  await baza
    .insert(participation)
    .values({
      trainingId,
      playerId,
      present,
      checkedInAt: present ? new Date() : null,
      markedBy: "trener",
    })
    .onConflictDoUpdate({
      target: [participation.trainingId, participation.playerId],
      set: {
        present,
        checkedInAt: present ? new Date() : null,
        markedBy: "trener",
      },
    });

  revalidatePath(`/trener/${trainingId}`);
  return {};
}

// ---------- Trener: spisak igrača ----------

export async function dodajIgraca(name: string, capNumber: number | null): Promise<RezultatAkcije> {
  const t = await trenerSesija();
  if (!t) return { greska: "Samo trener može ovo da radi." };
  if (!name.trim()) return { greska: "Ime je obavezno." };

  const baza = db();
  await baza.insert(players).values({ name: name.trim(), capNumber, role: "igrac" });
  revalidatePath("/trener/igraci");
  return {};
}

export async function izmeniIgraca(
  playerId: number,
  izmene: { name?: string; capNumber?: number | null; active?: boolean },
): Promise<RezultatAkcije> {
  const t = await trenerSesija();
  if (!t) return { greska: "Samo trener može ovo da radi." };

  const baza = db();
  await baza.update(players).set(izmene).where(eq(players.id, playerId));
  revalidatePath("/trener/igraci");
  return {};
}

export async function resetujPin(playerId: number): Promise<RezultatAkcije> {
  const t = await trenerSesija();
  if (!t) return { greska: "Samo trener može ovo da radi." };

  const baza = db();
  await baza.update(players).set({ pinHash: null }).where(eq(players.id, playerId));
  revalidatePath("/trener/igraci");
  return {};
}
