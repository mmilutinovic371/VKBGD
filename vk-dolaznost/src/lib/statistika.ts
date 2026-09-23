import "server-only";
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { participation, players, trainings } from "@/db/schema";
import type { Participation, Player, Training } from "@/db/schema";

/** Ispod ovog procenta igrač ne ulazi u sastav za utakmicu. Jedna konstanta, ne rasuto po ekranima. */
export const PRAG_DOLAZNOSTI = 70;

export function kljucPar(trainingId: number, playerId: number): string {
  return `${trainingId}:${playerId}`;
}

export interface RedIgraca {
  player: Player;
  brojOdrzanih: number;
  brojPrisutan: number;
  procenat: number;
}

export interface PresekRezultat {
  termini: Training[];
  igraci: Player[];
  /** `training_id:player_id` -> present (true/false) ili null ako nije evidentirano */
  prisustvo: Map<string, boolean | null>;
  ucesca: Participation[];
  statistika: RedIgraca[];
}

/**
 * Presek dolaznosti u periodu [od, doDatuma]. Ne broji termine koji tek dolaze —
 * ako je `doDatuma` u budućnosti, seče se na "sada". Isti kod hrani i ekran
 * (trener/statistika) i Excel izvoz — procenat se nigde ne čuva u bazi.
 */
export async function presek(od: Date, doDatuma: Date): Promise<PresekRezultat> {
  const baza = db();
  const sada = new Date();
  const krajStvarni = doDatuma.getTime() < sada.getTime() ? doDatuma : sada;

  const termini = await baza
    .select()
    .from(trainings)
    .where(
      and(
        gte(trainings.startsAt, od),
        lte(trainings.startsAt, krajStvarni),
        eq(trainings.canceled, false),
      ),
    )
    .orderBy(asc(trainings.startsAt));

  const igraci = await baza
    .select()
    .from(players)
    .where(and(eq(players.role, "igrac"), eq(players.active, true)))
    .orderBy(asc(players.name));

  const idTermina = termini.map((t) => t.id);
  const ucesca = idTermina.length
    ? await baza.select().from(participation).where(inArray(participation.trainingId, idTermina))
    : [];

  const prisustvo = new Map<string, boolean | null>();
  for (const red of ucesca) {
    prisustvo.set(kljucPar(red.trainingId, red.playerId), red.present ?? null);
  }

  const statistika: RedIgraca[] = igraci.map((igrac) => {
    let brojPrisutan = 0;
    for (const termin of termini) {
      if (prisustvo.get(kljucPar(termin.id, igrac.id)) === true) brojPrisutan++;
    }
    const brojOdrzanih = termini.length;
    return {
      player: igrac,
      brojOdrzanih,
      brojPrisutan,
      procenat: brojOdrzanih > 0 ? Math.round((100 * brojPrisutan) / brojOdrzanih) : 0,
    };
  });

  return { termini, igraci, prisustvo, ucesca, statistika };
}
