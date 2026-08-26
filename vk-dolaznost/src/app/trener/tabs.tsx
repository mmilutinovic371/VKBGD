"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABOVI = [
  { href: "/trener", naziv: "Prisustvo" },
  { href: "/trener/statistika", naziv: "Statistika" },
  { href: "/trener/obavestenja", naziv: "Obaveštenja" },
] as const;

export default function TrenerTabs() {
  const putanja = usePathname();

  return (
    <div className="flex">
      {TABOVI.map((tab) => {
        const aktivan =
          tab.href === "/trener" ? putanja === "/trener" || /^\/trener\/\d+$/.test(putanja) : putanja === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 border-b-[3px] px-2 py-2.5 text-center font-body text-[12px] font-semibold tracking-[.02em] transition-colors sm:flex-none sm:px-4.5 sm:py-2.75 sm:text-[13px] sm:tracking-[.04em] ${
              aktivan ? "border-red-600 text-white" : "border-transparent text-white/55 hover:text-white/80"
            }`}
          >
            {tab.naziv}
          </Link>
        );
      })}
    </div>
  );
}
