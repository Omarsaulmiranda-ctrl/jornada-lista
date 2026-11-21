import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

export type Sesion =
  | { rol: "eira"; nombre: string }
  | { rol: "municipio"; nombre: string; municipioId: string; municipio: string };

export type Rol = Sesion["rol"];

// Una cookie por papel: así EIRA y un municipio pueden estar abiertos a la vez en el mismo navegador.
const COOKIE: Record<Rol, string> = { eira: "jl_eira", municipio: "jl_municipio" };

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("Falta SESSION_SECRET.");
  return s;
}

function firmar(valor: string): string {
  return createHmac("sha256", secreto()).update(valor).digest("base64url");
}

export async function leerSesion(rol: Rol): Promise<Sesion | null> {
  const cruda = (await cookies()).get(COOKIE[rol])?.value;
  if (!cruda) return null;
  const [cuerpo, firma] = cruda.split(".");
  if (!cuerpo || !firma) return null;
  const esperada = firmar(cuerpo);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const sesion = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")) as Sesion;
    return sesion.rol === rol ? sesion : null;
  } catch {
    return null;
  }
}

export async function guardarSesion(sesion: Sesion): Promise<void> {
  const cuerpo = Buffer.from(JSON.stringify(sesion), "utf8").toString("base64url");
  (await cookies()).set(COOKIE[sesion.rol], `${cuerpo}.${firmar(cuerpo)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function cerrarSesion(rol: Rol): Promise<void> {
  (await cookies()).delete(COOKIE[rol]);
}

export async function exigirSesion(rol: Rol): Promise<Sesion> {
  const sesion = await leerSesion(rol);
  if (!sesion) redirect("/");
  return sesion;
}

export async function exigirEira(): Promise<Extract<Sesion, { rol: "eira" }>> {
  return (await exigirSesion("eira")) as Extract<Sesion, { rol: "eira" }>;
}

export async function exigirMunicipio(): Promise<Extract<Sesion, { rol: "municipio" }>> {
  return (await exigirSesion("municipio")) as Extract<Sesion, { rol: "municipio" }>;
}
