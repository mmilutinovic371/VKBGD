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
    <div className="flex gap-1">
      {TABOVI.map((tab) => {
        const aktivan =
          tab.href === "/trener" ? putanja === "/trener" || /^\/trener\/\d+$/.test(putanja) : putanja === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-[3px] px-4.5 py-2.75 font-body text-[13px] font-semibold tracking-[.04em] transition-colors ${
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
