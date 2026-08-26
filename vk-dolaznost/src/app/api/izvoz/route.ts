import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { trenerSesija } from "@/lib/auth";
import { kljucPar, presek } from "@/lib/statistika";
import { formatDatum } from "@/lib/vreme";

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
  listSirovi.addRow(["Igrač", "Kapa", "Datum", "Vrsta", "Lokacija", "Najava", "Prisustvo"]);
  const treniniMapa = new Map(termini.map((t2) => [t2.id, t2]));
  const igraciMapa = new Map(igraci.map((i) => [i.id, i]));
  for (const u of ucesca) {
    const termin = treniniMapa.get(u.trainingId);
    const igrac = igraciMapa.get(u.playerId);
    if (!termin || !igrac) continue;
    listSirovi.addRow([
      igrac.name,
      igrac.capNumber ?? "",
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

  const bafer = await radnaSveska.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(bafer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="dolaznost-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
