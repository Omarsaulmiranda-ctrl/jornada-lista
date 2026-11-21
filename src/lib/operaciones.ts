import "server-only";
import { deflateSync, crc32 } from "node:zlib";
import { BUCKET, db } from "./supabase";
import { hashPlantillaCarta, hashToken } from "./datos";
import { hoy, sumarDias } from "./fechas";
import { PLANTILLA_CARTA, REQUISITOS_BASE } from "./plantillas";

export type NuevaJornada = {
  municipioId: string;
  programa: string;
  localidad: string;
  colonia?: string;
  ubicacion?: string;
  lat?: number | null;
  lng?: number | null;
  sede: string;
  fecha: string;
  servicios: string[];
  responsableEira: string;
  aliado: string;
  requisitos: { clave: string; critico: boolean }[];
};

export async function crearJornadaConRequisitos(n: NuevaJornada): Promise<string> {
  const { data, error } = await db()
    .from("jornadas")
    .insert({
      municipio_id: n.municipioId,
      programa: n.programa,
      localidad: n.localidad || null,
      colonia: n.colonia || null,
      ubicacion: n.ubicacion || null,
      lat: n.lat ?? null,
      lng: n.lng ?? null,
      sede: n.sede,
      fecha: n.fecha,
      servicios: n.servicios,
      responsable_eira: n.responsableEira,
      aliado: n.aliado || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const filas = n.requisitos.flatMap((elegido) => {
    const p = REQUISITOS_BASE.find((r) => r.clave === elegido.clave);
    if (!p) return [];
    return [
      {
        jornada_id: data.id,
        clave: p.clave,
        titulo: p.titulo,
        descripcion: p.descripcion,
        tipo: p.tipo,
        critico: elegido.critico,
        fecha_limite: sumarDias(n.fecha, -p.diasAntes),
        orden: REQUISITOS_BASE.indexOf(p),
      },
    ];
  });
  const { error: e2 } = await db().from("requisitos").insert(filas);
  if (e2) throw new Error(e2.message);
  return data.id as string;
}

// ---------------------------------------------------------------------------
// Datos de demostración. Todo es ficticio.
// ---------------------------------------------------------------------------

export const ENLACES_DEMO = [
  { token: "demo-villa-ejemplo", municipio: "Villa Ejemplo" },
  { token: "demo-san-ficticio", municipio: "San Ficticio del Valle" },
  { token: "demo-gomez-farias", municipio: "Gómez Farías" },
  { token: "demo-tapalpa", municipio: "Tapalpa" },
];

const EIRA = "Coordinación EIRA (demo)";

/** Imagen PNG lisa, para que los expedientes de ejemplo tengan un archivo que abrir. */
function pngLiso(ancho: number, alto: number, [r, g, b]: [number, number, number]): Buffer {
  const fila = Buffer.alloc(1 + ancho * 3);
  for (let x = 0; x < ancho; x++) fila.set([r, g, b], 1 + x * 3);
  const crudo = Buffer.concat(Array.from({ length: alto }, () => fila));
  const trozo = (tipo: string, datos: Buffer) => {
    const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
    const largo = Buffer.alloc(4);
    largo.writeUInt32BE(datos.length);
    const suma = Buffer.alloc(4);
    suma.writeUInt32BE(crc32(cuerpo) >>> 0);
    return Buffer.concat([largo, cuerpo, suma]);
  };
  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(ancho, 0);
  cabecera.writeUInt32BE(alto, 4);
  cabecera.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo("IHDR", cabecera),
    trozo("IDAT", deflateSync(crudo)),
    trozo("IEND", Buffer.alloc(0)),
  ]);
}

async function vaciarBucket(): Promise<void> {
  const almacen = db().storage.from(BUCKET);
  const { data: jornadas } = await almacen.list("", { limit: 1000 });
  for (const j of jornadas ?? []) {
    const { data: reqs } = await almacen.list(j.name, { limit: 1000 });
    for (const r of reqs ?? []) {
      const { data: archivos } = await almacen.list(`${j.name}/${r.name}`, { limit: 1000 });
      const rutas = (archivos ?? []).map((a) => `${j.name}/${r.name}/${a.name}`);
      if (rutas.length) await almacen.remove(rutas);
    }
  }
}

export async function reiniciarDatosDemo(): Promise<void> {
  const base = db();
  await vaciarBucket();
  // Borrar municipios elimina en cascada jornadas, requisitos, entregas y eventos.
  const { error: eBorrar } = await base
    .from("municipios")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (eBorrar) throw new Error(eBorrar.message);

  const { data: municipios, error } = await base
    .from("municipios")
    .insert([
      { nombre: "Villa Ejemplo", enlace_nombre: "Laura Ejemplo Ruiz", enlace_cargo: "Enlace de Salud Municipal", enlace_telefono: "3410000001", token_hash: hashToken("demo-villa-ejemplo") },
      { nombre: "San Ficticio del Valle", enlace_nombre: "Mario Prueba Soto", enlace_cargo: "Director del DIF Municipal", enlace_telefono: "3410000002", token_hash: hashToken("demo-san-ficticio") },
      { nombre: "Gómez Farías", enlace_nombre: "Elena Demo Castillo", enlace_cargo: "Regidora de Salud", enlace_telefono: "3410000003", token_hash: hashToken("demo-gomez-farias") },
      { nombre: "Tapalpa", enlace_nombre: "Rosa Modelo Vega", enlace_cargo: "Coordinadora de Salud", enlace_telefono: "3410000004", token_hash: hashToken("demo-tapalpa") },
    ])
    .select("id,nombre,enlace_nombre");
  if (error) throw new Error(error.message);
  const m = (nombre: string) => municipios!.find((x) => x.nombre === nombre)!;

  const dia = hoy();
  const todos = REQUISITOS_BASE.map((r) => ({ clave: r.clave, critico: r.critico }));
  const comun = { programa: "Tamizaje Rosa", servicios: ["Papanicolaou", "Ultrasonido de mama", "Valoración nutricional"], responsableEira: "Coordinación EIRA", requisitos: todos };

  const sanFicticio = await crearJornadaConRequisitos({ ...comun, municipioId: m("San Ficticio del Valle").id, localidad: "Cabecera municipal", colonia: "Ubicación de ejemplo", ubicacion: "Punto de ejemplo en la región Sur de Jalisco", lat: 19.95, lng: -103.42, sede: "Casa de la Cultura", fecha: sumarDias(dia, 12), aliado: "Agrícola Ficticia S.A." });
  const puerto = await crearJornadaConRequisitos({ ...comun, municipioId: m("Gómez Farías").id, localidad: "San Sebastián del Sur", colonia: "San Sebastián del Sur", ubicacion: "San Sebastián del Sur, Gómez Farías, Región Sur, Jalisco, México", lat: 19.7935613, lng: -103.4749503, sede: "Auditorio Municipal", fecha: sumarDias(dia, 25), aliado: "" });
  const valle = await crearJornadaConRequisitos({ ...comun, municipioId: m("Tapalpa").id, localidad: "Juanacatlán", colonia: "Juanacatlán", ubicacion: "Juanacatlán, Tapalpa, Región Sur, Jalisco, México", lat: 20.033651, lng: -103.6871914, sede: "Salón Ejidal", fecha: sumarDias(dia, 40), aliado: "Fundación Demo" });

  const requisitosDe = async (jornadaId: string) => {
    const { data } = await base.from("requisitos").select("id,clave").eq("jornada_id", jornadaId);
    return (clave: string) => data!.find((r) => r.clave === clave)!.id as string;
  };

  const entregar = async (o: {
    jornadaId: string;
    requisitoId: string;
    autor: string;
    estado: "recibido" | "observado" | "aprobado";
    datos?: Record<string, string>;
    foto?: [number, number, number];
    motivo?: string;
  }) => {
    const archivos = [];
    if (o.foto) {
      const ruta = `${o.jornadaId}/${o.requisitoId}/v1-ejemplo.png`;
      await base.storage.from(BUCKET).upload(ruta, pngLiso(480, 320, o.foto), { contentType: "image/png", upsert: true });
      archivos.push({ ruta, nombre: "foto-de-ejemplo.png" });
    }
    const revisada = o.estado !== "recibido";
    await base.from("entregas").insert({
      requisito_id: o.requisitoId,
      version: 1,
      archivos,
      datos: o.datos ?? null,
      autor: o.autor,
      revision: o.estado === "aprobado" ? "aprobada" : o.estado === "observado" ? "observada" : "en_revision",
      motivo: o.motivo ?? null,
      revisor: revisada ? EIRA : null,
      revisado_en: revisada ? new Date().toISOString() : null,
    });
    await base.from("requisitos").update({ estado: o.estado }).eq("id", o.requisitoId);
  };

  const datosCarta = (firmante: string, sede: string) => ({
    firmante, cargo: "Presidencia Municipal", dependencia: "DIF Municipal", domicilio_sede: `${sede}, calle Ficticia 100`, horario: "de 8:00 a 15:00 horas",
    plantilla_version: PLANTILLA_CARTA.version, plantilla_hash: hashPlantillaCarta(),
  });
  const enlace = (nombre: string) => ({ nombre, cargo: "Enlace municipal", telefono: "3410000000" });

  // San Ficticio: atrasada. La carta venció y las fotos tienen una observación.
  {
    const r = await requisitosDe(sanFicticio);
    const autor = m("San Ficticio del Valle").enlace_nombre!;
    await entregar({ jornadaId: sanFicticio, requisitoId: r("persona_enlace"), autor, estado: "aprobado", datos: enlace(autor) });
    await entregar({ jornadaId: sanFicticio, requisitoId: r("fotos_espacio"), autor, estado: "observado", foto: [214, 196, 178], motivo: "Falta la fotografía de los sanitarios." });
  }
  // Gómez Farías (jornada ficticia en un lugar real): todo lo crítico aprobado.
  {
    const r = await requisitosDe(puerto);
    const autor = m("Gómez Farías").enlace_nombre!;
    await entregar({ jornadaId: puerto, requisitoId: r("carta_compromiso"), autor, estado: "aprobado", datos: datosCarta("Lic. Persona Ficticia", "Auditorio Municipal") });
    await entregar({ jornadaId: puerto, requisitoId: r("fotos_espacio"), autor, estado: "aprobado", foto: [186, 204, 196] });
    await entregar({ jornadaId: puerto, requisitoId: r("persona_enlace"), autor, estado: "aprobado", datos: enlace(autor) });
    await entregar({ jornadaId: puerto, requisitoId: r("logotipo"), autor, estado: "recibido", foto: [184, 51, 106] });
  }
  // Tapalpa (jornada ficticia en un lugar real): en preparación; EIRA tiene algo por revisar.
  {
    const r = await requisitosDe(valle);
    const autor = m("Tapalpa").enlace_nombre!;
    await entregar({ jornadaId: valle, requisitoId: r("persona_enlace"), autor, estado: "recibido", datos: enlace(autor) });
  }

  await base.from("eventos").insert(
    [sanFicticio, puerto, valle].map((jornada_id) => ({
      jornada_id, actor: "Sistema", rol: "sistema", tipo: "Datos de ejemplo", detalle: "Expediente cargado con datos ficticios de demostración.",
    })),
  );
}
