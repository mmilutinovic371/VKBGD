"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { odjaviSe } from "@/app/akcije";

const TABOVI = [
  { href: "/", naziv: "Danas" },
  { href: "/raspored", naziv: "Raspored" },
  { href: "/statistika", naziv: "Statistika" },
  { href: "/obavestenja", naziv: "Obaveštenja" },
] as const;

export default function NavTabs({ neprocitano }: { neprocitano: number }) {
  const putanja = usePathname();
  const [uToku, pokreni] = useTransition();

  return (
    <div className="flex items-center gap-7">
      <nav className="flex gap-6">
        {TABOVI.map((tab) => {
          const aktivan = tab.href === "/" ? putanja === "/" : putanja.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 pb-[3px] font-body text-[12.5px] font-medium uppercase tracking-[.06em] transition-colors ${
                aktivan ? "border-b-2 border-red-600 text-white" : "text-white/45 hover:text-white/70"
              }`}
            >
              {tab.naziv}
              {tab.href === "/obavestenja" && neprocitano > 0 && (
                <span className="rounded-full bg-red-600 px-[6px] py-[1px] font-body text-[10.5px] font-semibold text-white">
                  {neprocitano}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => pokreni(async () => { await odjaviSe(); })}
        disabled={uToku}
        className="font-body text-[11.5px] font-medium text-white/30 transition-colors hover:text-white/60"
      >
        Odjava
      </button>
    </div>
  );
}
