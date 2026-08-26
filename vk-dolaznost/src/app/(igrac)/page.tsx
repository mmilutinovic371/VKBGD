import { and, asc, eq, gt, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { participation, players, trainings } from "@/db/schema";
import { sesija } from "@/lib/auth";
import { PRAG_DOLAZNOSTI, presek } from "@/lib/statistika";
import Hero from "./hero";

function inicijalIme(ime: string): string {
  const delovi = ime.trim().split(/\s+/);
  if (delovi.length < 2) return delovi[0];
  return `${delovi[0]} ${delovi[1][0]}.`;
}

export default async function EkranDanas() {
  const s = await sesija();
  if (!s) return null; // layout već preusmerava

  const baza = db();
  const sada = new Date();
  const odGranica = new Date(sada.getTime() - 2 * 3600_000);

  const [glavni] = await baza
    .select()
    .from(trainings)
    .where(and(eq(trainings.canceled, false), gte(trainings.startsAt, odGranica)))
    .orderBy(asc(trainings.startsAt))
    .limit(1);

  if (!glavni) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-10 py-16">
        <p className="font-body text-lg text-white/60">Nema zakazanih termina. Javi se treneru.</p>
      </div>
    );
  }

  const igraci = await baza
    .select({ id: players.id, name: players.name })
    .from(players)
    .where(and(eq(players.role, "igrac"), eq(players.active, true)));

  const ucesceGlavni = await baza
    .select()
    .from(participation)
    .where(eq(participation.trainingId, glavni.id));
  const ucesceMapa = new Map(ucesceGlavni.map((u) => [u.playerId, u]));

  const cipovi = igraci.map((i) => {
    const rsvp = ucesceMapa.get(i.id)?.rsvp ?? null;
    return {
      ime: inicijalIme(i.name),
      stanje: (rsvp === "dolazim" ? "dolazi" : rsvp === "mozda" ? "mozda" : "ostalo") as
        | "dolazi"
        | "mozda"
        | "ostalo",
    };
  });

  const { statistika } = await presek(new Date(0), sada);
  const mojaStatistika = statistika.find((r) => r.player.id === s.playerId);

  const naredni = await baza
    .select()
    .from(trainings)
    .where(and(eq(trainings.canceled, false), gt(trainings.startsAt, glavni.startsAt)))
    .orderBy(asc(trainings.startsAt))
    .limit(3);

  const idNarednih = naredni.map((t) => t.id);
  const ucesceNaredni = idNarednih.length
    ? await baza
        .select()
        .from(participation)
        .where(and(inArray(participation.trainingId, idNarednih), eq(participation.playerId, s.playerId)))
    : [];
  const ucesceNarednihMapa = new Map(ucesceNaredni.map((u) => [u.trainingId, u]));

  return (
    <Hero
      termin={{
        id: glavni.id,
        startsAt: glavni.startsAt.toISOString(),
        durationMin: glavni.durationMin,
        location: glavni.location,
        kind: glavni.kind,
        checkinOpensMin: glavni.checkinOpensMin,
        checkinClosesMin: glavni.checkinClosesMin,
      }}
      present={ucesceMapa.get(s.playerId)?.present ?? null}
      cipovi={cipovi}
      ukupnoIgraca={igraci.length}
      mojProcenat={mojaStatistika?.procenat ?? 0}
      mojaOdigranih={mojaStatistika?.brojOdrzanih ?? 0}
      mojaPrisutan={mojaStatistika?.brojPrisutan ?? 0}
      prag={PRAG_DOLAZNOSTI}
      sledeci={naredni.map((t) => ({
        id: t.id,
        startsAt: t.startsAt.toISOString(),
        location: t.location,
        kind: t.kind,
        rsvp: ucesceNarednihMapa.get(t.id)?.rsvp ?? null,
      }))}
    />
  );
}
