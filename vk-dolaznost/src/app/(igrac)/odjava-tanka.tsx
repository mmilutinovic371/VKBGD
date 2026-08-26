"use client";

import { useTransition } from "react";
import { odjaviSe } from "@/app/akcije";

export default function OdjavaTanka() {
  const [uToku, pokreni] = useTransition();
  return (
    <button
      onClick={() =>
        pokreni(async () => {
          await odjaviSe();
        })
      }
      disabled={uToku}
      className="font-body text-[11px] font-medium text-white/30 transition-colors hover:text-white/60"
    >
      Odjava
    </button>
  );
}
