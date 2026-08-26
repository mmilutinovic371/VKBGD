"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABOVI = [
  { href: "/", naziv: "Danas" },
  { href: "/raspored", naziv: "Raspored" },
  { href: "/statistika", naziv: "Statistika" },
  { href: "/obavestenja", naziv: "Obaveštenja" },
] as const;

export default function NavTabs({ neprocitano }: { neprocitano: number }) {
  const putanja = usePathname();

  return (
    <nav className="flex border-y border-white/9">
      {TABOVI.map((tab) => {
        const aktivan = tab.href === "/" ? putanja === "/" : putanja.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 items-center justify-center gap-1.25 border-b-2 py-3 font-body text-[10.5px] font-medium uppercase tracking-[.04em] transition-colors sm:gap-1.5 sm:py-3.5 sm:text-[12.5px] sm:tracking-[.06em] ${
              aktivan ? "border-red-600 text-white" : "border-transparent text-white/45 hover:text-white/70"
            }`}
          >
            {tab.naziv}
            {tab.href === "/obavestenja" && neprocitano > 0 && (
              <span className="rounded-full bg-red-600 px-[6px] py-[1px] font-body text-[10px] font-semibold text-white">
                {neprocitano}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
