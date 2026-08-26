import Link from "next/link";
import { redirect } from "next/navigation";
import { trenerSesija } from "@/lib/auth";
import OdjaviDugme from "../odjavi-dugme";

export default async function TrenerLayout({ children }: { children: React.ReactNode }) {
  const t = await trenerSesija();
  if (!t) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-3xl items-center justify-between p-4">
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/trener" className="text-slate-700 hover:text-indigo-600">
              Pregled
            </Link>
            <Link href="/trener/statistika" className="text-slate-700 hover:text-indigo-600">
              Statistika
            </Link>
            <Link href="/trener/igraci" className="text-slate-700 hover:text-indigo-600">
              Igrači
            </Link>
          </div>
          <OdjaviDugme />
        </nav>
      </header>
      <main className="mx-auto max-w-3xl p-4">{children}</main>
    </div>
  );
}
