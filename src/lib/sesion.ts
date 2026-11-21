import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

export type Sesion =
  | { rol: "eira"; nombre: string }
  | { rol: "municipio"; nombre: string; municipioId: string; municipio: string };

const COOKIE = "jl_sesion";

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("Falta SESSION_SECRET.");
  return s;
}

function firmar(valor: string): string {
  return createHmac("sha256", secreto()).update(valor).digest("base64url");
}

export async function leerSesion(): Promise<Sesion | null> {
  const cruda = (await cookies()).get(COOKIE)?.value;
  if (!cruda) return null;
  const [cuerpo, firma] = cruda.split(".");
  if (!cuerpo || !firma) return null;
  const esperada = firmar(cuerpo);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")) as Sesion;
  } catch {
    return null;
  }
}

export async function guardarSesion(sesion: Sesion): Promise<void> {
  const cuerpo = Buffer.from(JSON.stringify(sesion), "utf8").toString("base64url");
  (await cookies()).set(COOKIE, `${cuerpo}.${firmar(cuerpo)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function exigirSesion(): Promise<Sesion> {
  const sesion = await leerSesion();
  if (!sesion) redirect("/");
  return sesion;
}

export async function exigirEira(): Promise<Extract<Sesion, { rol: "eira" }>> {
  const sesion = await exigirSesion();
  if (sesion.rol !== "eira") redirect("/municipio");
  return sesion;
}
