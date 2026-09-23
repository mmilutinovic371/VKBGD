import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { and, asc, eq, gte, inArray, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { participation, trainings } from "@/db/schema";
import { trenerSesija } from "@/lib/auth";
import { kljucPar, presek } from "@/lib/statistika";
import { formatDatum } from "@/lib/vreme";

const SEDAM_DANA_MS = 7 * 24 * 3600_000;

export async function GET() {
  const t = await trenerSesija();
  if (!t) {
    return NextResponse.json({ greska: "Samo trener može ovo da radi." }, { status: 403 });
  }

  const { termini, igraci, prisustvo, ucesca, statistika } = await presek(new Date(0), new Date());

  const radnaSveska = new ExcelJS.Workbook();

  const listMatrica = radnaSveska.addWorksheet("Dolaznost");
  listMatrica.addRow(["Igrač", ...termini.map((termin) => formatDatum(termin.startsAt)), "Procenat"]);
  for (const red of statistika) {
    const vrednosti = termini.map((termin) => {
      const p = prisustvo.get(kljucPar(termin.id, red.player.id));
      if (p === true) return "DA";
      if (p === false) return "NE";
      return "";
    });
    listMatrica.addRow([red.player.name, ...vrednosti, `${red.procenat}%`]);
  }
  listMatrica.getRow(1).font = { bold: true };
  listMatrica.columns.forEach((kolona, i) => {
    kolona.width = i === 0 ? 24 : 12;
  });

  const listSirovi = radnaSveska.addWorksheet("Sirovi podaci");
  listSirovi.addRow(["Igrač", "Datum", "Vrsta", "Lokacija", "Najava", "Prisustvo"]);
  const treniniMapa = new Map(termini.map((t2) => [t2.id, t2]));
  const igraciMapa = new Map(igraci.map((i) => [i.id, i]));
  for (const u of ucesca) {
    const termin = treniniMapa.get(u.trainingId);
    const igrac = igraciMapa.get(u.playerId);
    if (!termin || !igrac) continue;
    listSirovi.addRow([
      igrac.name,
      formatDatum(termin.startsAt),
      termin.kind,
      termin.location,
      u.rsvp ?? "",
      u.present === true ? "DA" : u.present === false ? "NE" : "",
    ]);
  }
  listSirovi.getRow(1).font = { bold: true };
  listSirovi.columns.forEach((kolona) => {
    kolona.width = 16;
  });

  const baza = db();
  const sveUtakmice = await baza
    .select()
    .from(trainings)
    .where(and(eq(trainings.kind, "utakmica"), eq(trainings.canceled, false)))
    .orderBy(asc(trainings.startsAt));

  const listNedelja = radnaSveska.addWorksheet("Nedelja pred utakmicu");
  listNedelja.addRow(["Dolaznost na treninzima/teretani u 7 dana pre svake utakmice (bez same utakmice)."]);
  listNedelja.addRow([]);

  if (sveUtakmice.length === 0) {
    listNedelja.addRow(["Nema unetih utakmica u sezoni."]);
  }

  for (const utakmica of sveUtakmice) {
    const sedamDanaPre = new Date(utakmica.startsAt.getTime() - SEDAM_DANA_MS);

    const terminiPreUtakmice = await baza
      .select()
      .from(trainings)
      .where(
        and(
          eq(trainings.canceled, false),
          ne(trainings.kind, "utakmica"),
          gte(trainings.startsAt, sedamDanaPre),
          lt(trainings.startsAt, utakmica.startsAt),
        ),
      )
      .orderBy(asc(trainings.startsAt));

    const naslovRed = listNedelja.addRow([
      `Utakmica ${formatDatum(utakmica.startsAt)} — nedelja pre: ${formatDatum(sedamDanaPre)}–${formatDatum(utakmica.startsAt)}`,
    ]);
    naslovRed.font = { bold: true };

    if (terminiPreUtakmice.length === 0) {
      listNedelja.addRow(["Nema treninga/teretane u ovom periodu."]);
      listNedelja.addRow([]);
      continue;
    }

    const idTermina = terminiPreUtakmice.map((t) => t.id);
    const ucesceNedelje = await baza
      .select()
      .from(participation)
      .where(inArray(participation.trainingId, idTermina));
    const prisustvoNedelje = new Map<string, boolean | null>();
    for (const u of ucesceNedelje) prisustvoNedelje.set(kljucPar(u.trainingId, u.playerId), u.present ?? null);

    listNedelja.addRow(["Igrač", ...terminiPreUtakmice.map((t) => formatDatum(t.startsAt)), "Procenat"]).font = {
      bold: true,
    };

    const proceniPoIgracu: number[] = [];
    for (const igrac of igraci) {
      const celije = terminiPreUtakmice.map((t) => {
        const p = prisustvoNedelje.get(kljucPar(t.id, igrac.id));
        if (p === true) return "DA";
        if (p === false) return "NE";
        return "";
      });
      const brojPrisutan = celije.filter((c) => c === "DA").length;
      const procenat = Math.round((100 * brojPrisutan) / terminiPreUtakmice.length);
      proceniPoIgracu.push(procenat);
      listNedelja.addRow([igrac.name, ...celije, `${procenat}%`]);
    }

    const ukupnaDolaznost = proceniPoIgracu.length
      ? Math.round(proceniPoIgracu.reduce((zbir, p) => zbir + p, 0) / proceniPoIgracu.length)
      : 0;
    const ukupnoRed = listNedelja.addRow([
      "UKUPNA DOLAZNOST",
      ...terminiPreUtakmice.map(() => ""),
      `${ukupnaDolaznost}%`,
    ]);
    ukupnoRed.font = { bold: true };
    ukupnoRed.eachCell((celija) => {
      celija.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F3EF" } };
    });

    listNedelja.addRow([]);
  }

  listNedelja.columns.forEach((kolona, i) => {
    kolona.width = i === 0 ? 30 : 12;
  });

  const bafer = await radnaSveska.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(bafer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="dolaznost-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
