"use client";

import { useTransition } from "react";
import { otkaziTermin } from "@/app/akcije";

export default function OtkaziDugme({ trainingId }: { trainingId: number }) {
  const [uToku, pokreni] = useTransition();
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Otkazati ovaj termin?")) return;
        pokreni(async () => {
          await otkaziTermin(trainingId);
        });
      }}
      disabled={uToku}
      className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600"
    >
      Otkaži
    </button>
  );
}
