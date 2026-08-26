import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const IME_KOLACICA = "vk_sesija";
const TRAJANJE_SEK = 180 * 24 * 3600; // 180 dana

function tajna() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET nije podešen (proveri .env).");
  return new TextEncoder().encode(s);
}

export interface Sesija {
  playerId: number;
  role: "igrac" | "trener";
}

export async function hesirajPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function proveriPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function napraviSesiju(podaci: Sesija): Promise<void> {
  const token = await new SignJWT({ ...podaci })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TRAJANJE_SEK}s`)
    .sign(tajna());

  const kolacici = await cookies();
  kolacici.set(IME_KOLACICA, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TRAJANJE_SEK,
    path: "/",
  });
}

export async function obrisiSesiju(): Promise<void> {
  const kolacici = await cookies();
  kolacici.delete(IME_KOLACICA);
}

export async function sesija(): Promise<Sesija | null> {
  const kolacici = await cookies();
  const token = kolacici.get(IME_KOLACICA)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, tajna());
    if (typeof payload.playerId !== "number" || typeof payload.role !== "string") return null;
    return { playerId: payload.playerId, role: payload.role as Sesija["role"] };
  } catch {
    return null;
  }
}

export async function trenerSesija(): Promise<Sesija | null> {
  const s = await sesija();
  return s?.role === "trener" ? s : null;
}
