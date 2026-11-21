"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BUCKET, db } from "@/lib/supabase";
import { cerrarSesion, exigirEira, exigirMunicipio, guardarSesion, type Sesion } from "@/lib/sesion";
import { hashPlantillaCarta, hashToken, registrarEvento, resumir, type Archivo, type Jornada } from "@/lib/datos";
import { crearJornadaConRequisitos, reiniciarDatosDemo } from "@/lib/operaciones";
import { PLANTILLA_CARTA, REQUISITOS_BASE, SERVICIOS, plantillaDe } from "@/lib/plantillas";
import { hoy } from "@/lib/fechas";

// Todas las acciones verifican la sesión y el permiso sobre el recurso.
// Los estados nunca se aceptan del navegador: se calculan aquí.

const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const MAX_ARCHIVOS = 8;

function texto(fd: FormData, campo: string, max = 300): string {
  return String(fd.get(campo) ?? "").trim().slice(0, max);
}

function enMexico(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 14 && lat <= 33 && lng >= -119 && lng <= -86;
}

// --------------------------------------------------------------------------- lugares reales

export type Lugar = { nombre: string; detalle: string; lat: number; lng: number };

const AGENTE = "jornada-lista-demo/1.0 (prototipo educativo)";

/** Busca una localidad o colonia real en OpenStreetMap (Nominatim). */
export async function buscarLugar(consulta: string): Promise<Lugar[]> {
  await exigirEira();
  const q = consulta.trim().slice(0, 120);
  if (q.length < 3) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({ q, format: "jsonv2", countrycodes: "mx", limit: "6", "accept-language": "es" }).toString();
  try {
    const r = await fetch(url, { headers: { "User-Agent": AGENTE }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const datos = (await r.json()) as { name?: string; display_name: string; lat: string; lon: string }[];
    return datos
      .map((d) => ({
        nombre: d.name || d.display_name.split(",")[0],
        detalle: d.display_name,
        lat: Number(d.lat),
        lng: Number(d.lon),
      }))
      .filter((l) => enMexico(l.lat, l.lng));
  } catch {
    return [];
  }
}

/** Colonias y asentamientos reales de un código postal (datos públicos de GeoNames). */
export async function coloniasPorCP(cp: string): Promise<string[]> {
  await exigirEira();
  if (!/^\d{5}$/.test(cp)) return [];
  try {
    const r = await fetch(`https://api.zippopotam.us/mx/${cp}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const datos = (await r.json()) as { places?: { "place name": string }[] };
    return [...new Set((datos.places ?? []).map((p) => p["place name"]))].sort((a, b) => a.localeCompare(b, "es"));
  } catch {
    return [];
  }
}

// --------------------------------------------------------------------------- acceso

export async function entrarComoEira(): Promise<void> {
  // Simulado: en el piloto, la coordinación de EIRA entra con su cuenta institucional.
  await guardarSesion({ rol: "eira", nombre: "Coordinación EIRA (demo)" });
  redirect("/eira");
}

export async function iniciarSesionMunicipio(token: string): Promise<boolean> {
  const { data } = await db()
    .from("municipios")
    .select("id,nombre,enlace_nombre")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!data) return false;
  await guardarSesion({
    rol: "municipio",
    municipioId: data.id,
    municipio: data.nombre,
    nombre: data.enlace_nombre ?? `Enlace de ${data.nombre}`,
  });
  return true;
}

export async function entrarComoMunicipio(fd: FormData): Promise<void> {
  const ok = await iniciarSesionMunicipio(texto(fd, "token", 100));
  redirect(ok ? "/municipio" : "/?error=enlace");
}

export async function salir(fd: FormData): Promise<void> {
  await cerrarSesion(fd.get("rol") === "municipio" ? "municipio" : "eira");
  redirect("/");
}

export async function reiniciarDemo(fd: FormData): Promise<void> {
  await exigirEira();
  // Borra todo: en un despliegue público se protege con una clave que solo conoce el equipo.
  const clave = process.env.CLAVE_REINICIO;
  if (clave && texto(fd, "clave", 100) !== clave) redirect("/eira?aviso=clave");
  await reiniciarDatosDemo();
  revalidatePath("/", "layout");
  redirect("/eira");
}

// --------------------------------------------------------------------------- jornadas

export async function crearJornada(fd: FormData): Promise<void> {
  const sesion = await exigirEira();
  const fecha = texto(fd, "fecha", 10);
  const sede = texto(fd, "sede");
  const municipioId = texto(fd, "municipio_id", 36);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha <= hoy()) throw new Error("La fecha debe ser posterior a hoy.");
  if (!sede || !municipioId) throw new Error("Faltan el municipio o la sede.");

  const servicios = SERVICIOS.filter((s) => fd.getAll("servicios").includes(s));
  const requisitos = REQUISITOS_BASE.filter((r) => fd.get(`req_${r.clave}`) === "on").map((r) => ({
    clave: r.clave,
    critico: fd.get(`crit_${r.clave}`) === "on",
  }));
  if (requisitos.length === 0) throw new Error("Elija al menos un requisito.");

  const lat = Number(fd.get("lat"));
  const lng = Number(fd.get("lng"));
  const ubicada = fd.get("lat") !== "" && fd.get("lat") !== null && enMexico(lat, lng);

  const id = await crearJornadaConRequisitos({
    municipioId,
    colonia: texto(fd, "colonia", 120),
    ubicacion: ubicada ? texto(fd, "ubicacion", 300) : "",
    lat: ubicada ? lat : null,
    lng: ubicada ? lng : null,
    programa: texto(fd, "programa") || "Tamizaje Rosa",
    localidad: texto(fd, "localidad"),
    sede,
    fecha,
    servicios: [...servicios],
    responsableEira: texto(fd, "responsable") || sesion.nombre,
    aliado: texto(fd, "aliado"),
    requisitos,
  });
  await registrarEvento({
    jornadaId: id,
    sesion,
    tipo: "Jornada creada",
    detalle: `${requisitos.length} requisitos, ${requisitos.filter((r) => r.critico).length} críticos.`,
  });
  redirect(`/eira/j/${id}`);
}

export async function confirmarJornada(fd: FormData): Promise<void> {
  const sesion = await exigirEira();
  const id = texto(fd, "jornada_id", 36);
  const { data } = await db().from("jornadas").select("*, requisitos(*)").eq("id", id).maybeSingle();
  if (!data) throw new Error("La jornada no existe.");
  const resumen = resumir({ ...(data as Jornada), municipio: {} as Jornada["municipio"] });
  if (!resumen.listaParaConfirmar) throw new Error("Aún hay requisitos críticos sin aprobar.");
  await db()
    .from("jornadas")
    .update({ estado: "confirmada", confirmada_en: new Date().toISOString(), confirmada_por: sesion.nombre })
    .eq("id", id);
  await registrarEvento({ jornadaId: id, sesion, tipo: "Jornada confirmada", detalle: "Validación final de EIRA." });
  revalidatePath("/", "layout");
}

// --------------------------------------------------------------------------- entregas

type RequisitoConJornada = {
  id: string;
  jornada_id: string;
  clave: string;
  titulo: string;
  tipo: string;
  estado: string;
  jornada: { id: string; municipio_id: string; estado: string };
};

/** Carga el requisito solo si la sesión tiene permiso sobre su jornada. */
async function requisitoPermitido(sesion: Sesion, requisitoId: string): Promise<RequisitoConJornada> {
  const { data } = await db()
    .from("requisitos")
    .select("id,jornada_id,clave,titulo,tipo,estado, jornada:jornadas(id,municipio_id,estado)")
    .eq("id", requisitoId)
    .maybeSingle();
  const r = data as unknown as RequisitoConJornada | null;
  if (!r) throw new Error("El requisito no existe.");
  if (sesion.rol === "municipio" && r.jornada.municipio_id !== sesion.municipioId)
    throw new Error("No tiene permiso sobre este expediente.");
  return r;
}

function puedeEntregar(sesion: Sesion, r: RequisitoConJornada): void {
  if (sesion.rol !== "municipio") throw new Error("Solo el enlace municipal puede entregar.");
  if (r.jornada.estado === "confirmada") throw new Error("La jornada ya está confirmada.");
  if (r.estado !== "pendiente" && r.estado !== "observado")
    throw new Error("Este requisito ya fue entregado y está en revisión o aprobado.");
}

async function siguienteVersion(requisitoId: string): Promise<{ version: number; anteriores: Archivo[] }> {
  const { data } = await db()
    .from("entregas")
    .select("version,archivos")
    .eq("requisito_id", requisitoId)
    .order("version", { ascending: false })
    .limit(1);
  const ultima = data?.[0];
  return { version: (ultima?.version ?? 0) + 1, anteriores: (ultima?.archivos ?? []) as Archivo[] };
}

async function guardarEntrega(
  sesion: Sesion,
  r: RequisitoConJornada,
  contenido: { archivos?: Archivo[]; datos?: Record<string, string>; nota?: string },
  version: number,
): Promise<void> {
  // La restricción única (requisito, versión) impide sobrescribir una versión existente.
  const { error } = await db().from("entregas").insert({
    requisito_id: r.id,
    version,
    archivos: contenido.archivos ?? [],
    datos: contenido.datos ?? null,
    nota: contenido.nota || null,
    autor: sesion.nombre,
  });
  if (error) throw new Error(error.message);
  await db().from("requisitos").update({ estado: "recibido" }).eq("id", r.id);
  await registrarEvento({
    jornadaId: r.jornada_id,
    requisitoId: r.id,
    sesion,
    tipo: `Entrega recibida (versión ${version})`,
    detalle: r.titulo,
  });
  revalidatePath("/", "layout");
}

export type CargaPreparada =
  | { ok: true; cargas: { ruta: string; url: string; nombre: string }[] }
  | { ok: false; error: string };

/** Paso 1 de una carga: el servidor emite enlaces firmados; el archivo va directo al almacén privado. */
export async function prepararCarga(
  requisitoId: string,
  archivos: { nombre: string; tipo: string; tamano: number }[],
): Promise<CargaPreparada> {
  try {
    const sesion = await exigirMunicipio();
    const r = await requisitoPermitido(sesion, requisitoId);
    puedeEntregar(sesion, r);
    if (r.tipo !== "archivos") throw new Error("Este requisito no recibe archivos.");
    if (archivos.length === 0 || archivos.length > MAX_ARCHIVOS)
      throw new Error(`Suba entre 1 y ${MAX_ARCHIVOS} archivos.`);
    const { version } = await siguienteVersion(r.id);
    const cargas = [];
    for (const a of archivos) {
      const ext = TIPOS_PERMITIDOS[a.tipo];
      if (!ext) throw new Error(`«${a.nombre}» no es una imagen ni un PDF.`);
      if (a.tamano > 10 * 1024 * 1024) throw new Error(`«${a.nombre}» pesa más de 10 MB.`);
      const ruta = `${r.jornada_id}/${r.id}/v${version}-${randomUUID()}.${ext}`;
      const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(ruta);
      if (error) throw new Error(error.message);
      cargas.push({ ruta, url: data.signedUrl, nombre: a.nombre.slice(0, 120) });
    }
    return { ok: true, cargas };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo preparar la carga." };
  }
}

/** Paso 2: registrar la versión. El servidor comprueba que cada archivo exista donde debe. */
export async function registrarArchivos(
  requisitoId: string,
  subidos: Archivo[],
  conservarAnteriores: boolean,
  nota: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sesion = await exigirMunicipio();
    const r = await requisitoPermitido(sesion, requisitoId);
    puedeEntregar(sesion, r);
    const carpeta = `${r.jornada_id}/${r.id}`;
    const { data: existentes } = await db().storage.from(BUCKET).list(carpeta, { limit: 1000 });
    const nombres = new Set((existentes ?? []).map((x) => `${carpeta}/${x.name}`));
    const nuevos = subidos
      .filter((a) => nombres.has(a.ruta))
      .map((a) => ({ ruta: a.ruta, nombre: String(a.nombre).slice(0, 120) }));
    if (nuevos.length === 0) throw new Error("No se recibió ningún archivo. Intente de nuevo.");
    const { version, anteriores } = await siguienteVersion(r.id);
    const archivos = conservarAnteriores ? [...anteriores, ...nuevos] : nuevos;
    await guardarEntrega(sesion, r, { archivos, nota: nota.trim().slice(0, 500) }, version);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo registrar la entrega." };
  }
}

/** Requisitos que se entregan llenando un formulario: datos y carta compromiso. */
export async function registrarDatos(fd: FormData): Promise<void> {
  const sesion = await exigirMunicipio();
  const r = await requisitoPermitido(sesion, texto(fd, "requisito_id", 36));
  puedeEntregar(sesion, r);
  const campos = r.tipo === "carta" ? PLANTILLA_CARTA.campos : (plantillaDe(r.clave)?.campos ?? []);
  if (r.tipo === "archivos" || campos.length === 0) throw new Error("Este requisito no se llena con un formulario.");

  const datos: Record<string, string> = {};
  for (const c of campos) {
    const valor = texto(fd, `campo_${c.nombre}`, 500);
    if (!valor) throw new Error(`Falta: ${c.etiqueta}.`);
    datos[c.nombre] = valor;
  }
  if (r.tipo === "carta") {
    // Las cláusulas no viajan desde el navegador: se toman de la plantilla y se sella su huella.
    datos.plantilla_version = PLANTILLA_CARTA.version;
    datos.plantilla_hash = hashPlantillaCarta();
  }
  const { version } = await siguienteVersion(r.id);
  await guardarEntrega(sesion, r, { datos }, version);
}

// --------------------------------------------------------------------------- revisión

export async function revisarEntrega(fd: FormData): Promise<void> {
  const sesion = await exigirEira();
  const entregaId = texto(fd, "entrega_id", 36);
  const decision = texto(fd, "decision", 10);
  const motivo = texto(fd, "motivo", 500);
  if (decision !== "aprobar" && decision !== "observar") throw new Error("Decisión no válida.");
  if (decision === "observar" && motivo.length < 5)
    throw new Error("Explique el motivo de la observación para que el municipio sepa qué corregir.");

  const { data: entrega } = await db()
    .from("entregas")
    .select("id,requisito_id,version,revision")
    .eq("id", entregaId)
    .maybeSingle();
  if (!entrega) throw new Error("La entrega no existe.");
  const r = await requisitoPermitido(sesion, entrega.requisito_id);
  const { version } = await siguienteVersion(r.id);
  if (entrega.version !== version - 1 || entrega.revision !== "en_revision" || r.estado !== "recibido")
    throw new Error("Solo se puede revisar la última versión mientras está en revisión.");

  const aprobada = decision === "aprobar";
  const { error } = await db()
    .from("entregas")
    .update({
      revision: aprobada ? "aprobada" : "observada",
      motivo: aprobada ? null : motivo,
      revisor: sesion.nombre,
      revisado_en: new Date().toISOString(),
    })
    .eq("id", entrega.id);
  if (error) throw new Error(error.message);
  await db().from("requisitos").update({ estado: aprobada ? "aprobado" : "observado" }).eq("id", r.id);
  await registrarEvento({
    jornadaId: r.jornada_id,
    requisitoId: r.id,
    sesion,
    tipo: aprobada ? `Aprobado (versión ${entrega.version})` : `Observado (versión ${entrega.version})`,
    detalle: aprobada ? r.titulo : `${r.titulo}. Motivo: ${motivo}`,
  });
  revalidatePath("/", "layout");
}
