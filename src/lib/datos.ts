import "server-only";
import { createHash } from "node:crypto";
import { BUCKET, db } from "./supabase";
import { diasEntre, hoy } from "./fechas";
import { PLANTILLA_CARTA } from "./plantillas";
import type { Sesion } from "./sesion";

export type Archivo = { ruta: string; nombre: string };

export type Entrega = {
  id: string;
  requisito_id: string;
  version: number;
  archivos: Archivo[];
  datos: Record<string, string> | null;
  nota: string | null;
  autor: string;
  creado_en: string;
  revision: "en_revision" | "observada" | "aprobada";
  motivo: string | null;
  revisor: string | null;
  revisado_en: string | null;
};

export type Requisito = {
  id: string;
  jornada_id: string;
  clave: string;
  titulo: string;
  descripcion: string | null;
  tipo: "carta" | "archivos" | "datos";
  critico: boolean;
  responsable: string;
  fecha_limite: string;
  estado: "pendiente" | "recibido" | "observado" | "aprobado" | "no_aplica";
  orden: number;
  entregas?: Entrega[];
};

export type Municipio = {
  id: string;
  nombre: string;
  estado: string;
  enlace_nombre: string | null;
  enlace_cargo: string | null;
  enlace_telefono: string | null;
};

export type Jornada = {
  id: string;
  municipio_id: string;
  programa: string;
  localidad: string | null;
  colonia: string | null;
  ubicacion: string | null;
  lat: number | null;
  lng: number | null;
  sede: string;
  fecha: string;
  servicios: string[];
  responsable_eira: string;
  aliado: string | null;
  estado: "en_preparacion" | "confirmada";
  confirmada_en: string | null;
  confirmada_por: string | null;
  municipio: Municipio;
  requisitos: Requisito[];
};

export type Evento = {
  id: number;
  actor: string;
  rol: string;
  tipo: string;
  detalle: string | null;
  creado_en: string;
};

const MUNICIPIO = "municipio:municipios(id,nombre,estado,enlace_nombre,enlace_cargo,enlace_telefono)";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPlantillaCarta(): string {
  return createHash("sha256")
    .update(JSON.stringify([PLANTILLA_CARTA.version, PLANTILLA_CARTA.titulo, PLANTILLA_CARTA.clausulas]))
    .digest("hex");
}

/** Jornadas visibles para la sesión: EIRA ve todas; un municipio, solo las suyas. */
export async function listarJornadas(sesion: Sesion): Promise<Jornada[]> {
  let consulta = db()
    .from("jornadas")
    .select(`*, ${MUNICIPIO}, requisitos(*)`)
    .order("fecha", { ascending: true });
  if (sesion.rol === "municipio") consulta = consulta.eq("municipio_id", sesion.municipioId);
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return (data as Jornada[]).map(ordenar);
}

/** Devuelve null si la jornada no existe o la sesión no tiene permiso de verla. */
export async function cargarExpediente(
  sesion: Sesion,
  jornadaId: string,
): Promise<{ jornada: Jornada; eventos: Evento[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(jornadaId)) return null;
  const { data, error } = await db()
    .from("jornadas")
    .select(`*, ${MUNICIPIO}, requisitos(*, entregas(*))`)
    .eq("id", jornadaId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const jornada = ordenar(data as Jornada);
  if (sesion.rol === "municipio" && jornada.municipio_id !== sesion.municipioId) return null;

  const { data: eventos } = await db()
    .from("eventos")
    .select("id,actor,rol,tipo,detalle,creado_en")
    .eq("jornada_id", jornadaId)
    .order("id", { ascending: false })
    .limit(60);
  return { jornada, eventos: (eventos ?? []) as Evento[] };
}

function ordenar(j: Jornada): Jornada {
  j.requisitos = [...(j.requisitos ?? [])].sort((a, b) => a.orden - b.orden);
  for (const r of j.requisitos) {
    if (r.entregas) r.entregas = [...r.entregas].sort((a, b) => b.version - a.version);
  }
  return j;
}

/** Enlaces temporales (10 minutos) para ver archivos del bucket privado. */
export async function firmarArchivos(jornada: Jornada): Promise<Record<string, string>> {
  const rutas = new Set<string>();
  for (const r of jornada.requisitos)
    for (const e of r.entregas ?? []) for (const a of e.archivos ?? []) rutas.add(a.ruta);
  if (rutas.size === 0) return {};
  const { data, error } = await db().storage.from(BUCKET).createSignedUrls([...rutas], 600);
  if (error) throw new Error(error.message);
  const mapa: Record<string, string> = {};
  for (const d of data ?? []) if (d.path && d.signedUrl) mapa[d.path] = d.signedUrl;
  return mapa;
}

// ---------------------------------------------------------------------------
// Semáforo: se calcula con los requisitos críticos, no con el porcentaje general.
// ---------------------------------------------------------------------------

export type Bloqueo = {
  requisito: Requisito;
  debe: "Municipio" | "EIRA";
  accion: string;
  vencido: boolean;
};

export type Resumen = {
  color: "verde" | "ambar" | "rojo";
  etiqueta: string;
  listaParaConfirmar: boolean;
  bloqueos: Bloqueo[];
  aprobados: number;
  total: number;
  diasParaJornada: number;
};

export function quienDebe(r: Requisito): Bloqueo["debe"] | null {
  if (r.estado === "pendiente" || r.estado === "observado") return "Municipio";
  if (r.estado === "recibido") return "EIRA";
  return null;
}

export function resumir(j: Jornada): Resumen {
  const dia = hoy();
  const vigentes = j.requisitos.filter((r) => r.estado !== "no_aplica");
  const aprobados = vigentes.filter((r) => r.estado === "aprobado").length;
  const bloqueos: Bloqueo[] = vigentes
    .filter((r) => r.critico && r.estado !== "aprobado")
    .map((r) => ({
      requisito: r,
      debe: quienDebe(r) ?? "Municipio",
      accion:
        r.estado === "recibido"
          ? "revisar lo recibido"
          : r.estado === "observado"
            ? "corregir lo observado"
            : "entregar",
      vencido: r.fecha_limite < dia,
    }));
  const base = { bloqueos, aprobados, total: vigentes.length, diasParaJornada: diasEntre(dia, j.fecha) };

  if (j.estado === "confirmada")
    return { ...base, color: "verde", etiqueta: "Confirmada", listaParaConfirmar: false };
  if (bloqueos.length === 0)
    return { ...base, color: "verde", etiqueta: "Lista para confirmar", listaParaConfirmar: true };
  if (bloqueos.some((b) => b.vencido))
    return { ...base, color: "rojo", etiqueta: "Atrasada", listaParaConfirmar: false };
  if (bloqueos.some((b) => b.requisito.estado === "observado"))
    return { ...base, color: "ambar", etiqueta: "Con observaciones", listaParaConfirmar: false };
  return { ...base, color: "ambar", etiqueta: "En preparación", listaParaConfirmar: false };
}

export async function registrarEvento(e: {
  jornadaId: string;
  requisitoId?: string;
  sesion: Sesion | { rol: "sistema"; nombre: string };
  tipo: string;
  detalle?: string;
}): Promise<void> {
  await db().from("eventos").insert({
    jornada_id: e.jornadaId,
    requisito_id: e.requisitoId ?? null,
    actor: e.sesion.nombre,
    rol: e.sesion.rol,
    tipo: e.tipo,
    detalle: e.detalle ?? null,
  });
}

export type Actividad = { id: number; tipo: string; detalle: string | null; municipio: string; rol: string; creado_en: string };

/** Últimos movimientos de todas las jornadas, para el monitor de EIRA. */
export async function actividadReciente(limite = 12): Promise<Actividad[]> {
  const { data } = await db()
    .from("eventos")
    .select("id,tipo,detalle,rol,creado_en, jornada:jornadas(municipio:municipios(nombre))")
    .order("id", { ascending: false })
    .limit(limite);
  return ((data ?? []) as unknown as (Omit<Actividad, "municipio"> & { jornada: { municipio: { nombre: string } } | null })[]).map((e) => ({
    id: e.id, tipo: e.tipo, detalle: e.detalle, rol: e.rol, creado_en: e.creado_en,
    municipio: e.jornada?.municipio?.nombre ?? "",
  }));
}

/** Solo posición y color de cada jornada: es lo único que se muestra en la portada, sin sesión. */
export async function puntosPublicos(): Promise<{ id: string; lat: number; lng: number; color: Resumen["color"] }[]> {
  const { data } = await db().from("jornadas").select("*, requisitos(*)").not("lat", "is", null);
  return ((data ?? []) as Jornada[]).map((j) => ({ id: j.id, lat: j.lat!, lng: j.lng!, color: resumir(j).color }));
}
