"use client";

import { useTransition } from "react";
import { odjaviSe } from "./akcije";

export default function OdjaviDugme() {
  const [uToku, pokreni] = useTransition();
  return (
    <button
      onClick={() => pokreni(() => odjaviSe())}
      disabled={uToku}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600"
    >
      Odjava
    </button>
  );
}
