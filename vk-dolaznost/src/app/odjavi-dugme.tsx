"use client";

import { useTransition } from "react";
import { odjaviSe } from "./akcije";

export default function OdjaviDugme() {
  const [uToku, pokreni] = useTransition();
  return (
    <button
      onClick={() => pokreni(() => odjaviSe())}
      disabled={uToku}
      className="rounded-[7px] border border-white/20 px-3.5 py-2.25 font-body text-[12.5px] font-semibold text-white/70 transition-colors hover:bg-white/10"
    >
      Odjava
    </button>
  );
}
