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
// Datos de demostración. Los lugares son reales; las jornadas, las personas y los teléfonos son ficticios.
// ---------------------------------------------------------------------------

type EstadoEjemplo = "recibido" | "observado" | "aprobado";

type Ejemplo = {
  token: string;
  municipio: string;
  localidad: string;
  lat: number;
  lng: number;
  sede: string;
  dias: number; // días que faltan para la jornada
  aliado?: string;
  enlace: string;
  cargo: string;
  estados: Partial<Record<string, EstadoEjemplo>>;
  motivo?: string;
  confirmada?: boolean;
};

const EJEMPLOS: Ejemplo[] = [
  { token: "demo-sayula", municipio: "Sayula", localidad: "Usmajac", lat: 19.8736833, lng: -103.5415196, sede: "Casa de la Cultura", dias: 12, aliado: "Agrícola Ficticia S.A.", enlace: "Mario Prueba Soto", cargo: "Director del DIF Municipal",
    estados: { persona_enlace: "aprobado", fotos_espacio: "observado" }, motivo: "Falta la fotografía de los sanitarios." },
  { token: "demo-atemajac", municipio: "Atemajac de Brizuela", localidad: "Cabecera municipal", lat: 20.1411118, lng: -103.7284429, sede: "Salón de Usos Múltiples", dias: 10, enlace: "Julia Ensayo Mora", cargo: "Regidora de Salud",
    estados: { carta_compromiso: "recibido" } },
  { token: "demo-tapalpa", municipio: "Tapalpa", localidad: "Juanacatlán", lat: 20.033651, lng: -103.6871914, sede: "Salón Ejidal", dias: 40, aliado: "Fundación Demo", enlace: "Rosa Modelo Vega", cargo: "Coordinadora de Salud",
    estados: { persona_enlace: "recibido" } },
  { token: "demo-tuxpan", municipio: "Tuxpan", localidad: "Cabecera municipal", lat: 19.5563523, lng: -103.3759867, sede: "Auditorio del DIF", dias: 33, enlace: "Pedro Simulado Ríos", cargo: "Director de Salud Municipal",
    estados: { carta_compromiso: "aprobado", persona_enlace: "aprobado", fotos_espacio: "observado" }, motivo: "Las fotografías no muestran el área de exploración." },
  { token: "demo-zapotiltic", municipio: "Zapotiltic", localidad: "Cabecera municipal", lat: 19.6260743, lng: -103.4164682, sede: "Casa de Salud", dias: 28, enlace: "Ana Muestra León", cargo: "Enlace de Salud Municipal",
    estados: { carta_compromiso: "recibido", fotos_espacio: "recibido", persona_enlace: "aprobado" } },
  { token: "demo-gomez-farias", municipio: "Gómez Farías", localidad: "San Sebastián del Sur", lat: 19.7935613, lng: -103.4749503, sede: "Auditorio Municipal", dias: 25, enlace: "Elena Demo Castillo", cargo: "Regidora de Salud",
    estados: { carta_compromiso: "aprobado", fotos_espacio: "aprobado", persona_enlace: "aprobado", logotipo: "recibido" } },
  { token: "demo-tamazula", municipio: "Tamazula de Gordiano", localidad: "Cabecera municipal", lat: 19.6750778, lng: -103.2540002, sede: "Centro Comunitario", dias: 20, aliado: "Ingenio de Ejemplo", enlace: "Luis Ficción Campos", cargo: "Director del DIF Municipal",
    estados: { carta_compromiso: "aprobado", fotos_espacio: "aprobado", persona_enlace: "aprobado", logotipo: "aprobado", apoyo_convocatoria: "aprobado" }, confirmada: true },
  { token: "demo-amacueca", municipio: "Amacueca", localidad: "Cabecera municipal", lat: 20.0113787, lng: -103.5999442, sede: "Casa Ejidal", dias: 45, enlace: "Sofía Prototipo Luna", cargo: "Enlace municipal",
    estados: {} },
];

// Zapotlán el Grande queda sin jornada: es el municipio donde se crea una en vivo durante la demostración.
const MUNICIPIO_EN_VIVO = { token: "demo-zapotlan", municipio: "Zapotlán el Grande", enlace: "Laura Ejemplo Ruiz", cargo: "Enlace de Salud Municipal" };

export const ENLACES_DEMO = [MUNICIPIO_EN_VIVO, ...EJEMPLOS].map((e) => ({ token: e.token, municipio: e.municipio }));

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
  await Promise.all(
    (jornadas ?? []).map(async (j) => {
      const { data: reqs } = await almacen.list(j.name, { limit: 1000 });
      for (const r of reqs ?? []) {
        const { data: archivos } = await almacen.list(`${j.name}/${r.name}`, { limit: 1000 });
        const rutas = (archivos ?? []).map((a) => `${j.name}/${r.name}/${a.name}`);
        if (rutas.length) await almacen.remove(rutas);
      }
    }),
  );
}

const FOTO = pngLiso(480, 320, [214, 170, 190]);

async function cargarEjemplo(e: Ejemplo, municipioId: string, dia: string): Promise<void> {
  const base = db();
  const jornadaId = await crearJornadaConRequisitos({
    municipioId,
    programa: "Tamizaje Rosa",
    localidad: e.localidad,
    colonia: e.localidad === "Cabecera municipal" ? e.municipio : e.localidad,
    ubicacion: `${e.localidad === "Cabecera municipal" ? e.municipio : `${e.localidad}, ${e.municipio}`}, Jalisco, México`,
    lat: e.lat,
    lng: e.lng,
    sede: e.sede,
    fecha: sumarDias(dia, e.dias),
    servicios: ["Papanicolaou", "Ultrasonido de mama", "Valoración nutricional"],
    responsableEira: "Coordinación EIRA",
    aliado: e.aliado ?? "",
    requisitos: REQUISITOS_BASE.map((r) => ({ clave: r.clave, critico: r.critico })),
  });
  const { data: requisitos } = await base.from("requisitos").select("id,clave,titulo,tipo").eq("jornada_id", jornadaId);
  const eventos: { jornada_id: string; requisito_id?: string; actor: string; rol: string; tipo: string; detalle: string }[] = [
    { jornada_id: jornadaId, actor: EIRA, rol: "eira", tipo: "Jornada creada", detalle: `${e.municipio}, ${e.sede}` },
  ];

  for (const r of requisitos ?? []) {
    const estado = e.estados[r.clave];
    if (!estado) continue;
    const archivos = [];
    let datos: Record<string, string> | null = null;
    if (r.tipo === "archivos") {
      const ruta = `${jornadaId}/${r.id}/v1-ejemplo.png`;
      await base.storage.from(BUCKET).upload(ruta, FOTO, { contentType: "image/png", upsert: true });
      archivos.push({ ruta, nombre: "foto-de-ejemplo.png" });
    } else if (r.tipo === "carta") {
      datos = {
        firmante: "Lic. Persona Ficticia", cargo: "Presidencia Municipal", dependencia: "DIF Municipal",
        domicilio_sede: "Calle Ficticia 100, Centro", horario: "de 8:00 a 15:00 horas",
        plantilla_version: PLANTILLA_CARTA.version, plantilla_hash: hashPlantillaCarta(),
      };
    } else if (r.clave === "persona_enlace") {
      datos = { nombre: e.enlace, cargo: e.cargo, telefono: "3410000000" };
    } else {
      datos = { medios: "Perifoneo y redes del ayuntamiento", meta: "120" };
    }
    const revisada = estado !== "recibido";
    await base.from("entregas").insert({
      requisito_id: r.id, version: 1, archivos, datos, autor: e.enlace,
      revision: estado === "aprobado" ? "aprobada" : estado === "observado" ? "observada" : "en_revision",
      motivo: estado === "observado" ? (e.motivo ?? "Falta información.") : null,
      revisor: revisada ? EIRA : null,
      revisado_en: revisada ? new Date().toISOString() : null,
    });
    await base.from("requisitos").update({ estado }).eq("id", r.id);
    eventos.push({ jornada_id: jornadaId, requisito_id: r.id, actor: e.enlace, rol: "municipio", tipo: "Entrega recibida (versión 1)", detalle: r.titulo });
    if (estado === "aprobado") eventos.push({ jornada_id: jornadaId, requisito_id: r.id, actor: EIRA, rol: "eira", tipo: "Aprobado (versión 1)", detalle: r.titulo });
    if (estado === "observado") eventos.push({ jornada_id: jornadaId, requisito_id: r.id, actor: EIRA, rol: "eira", tipo: "Observado (versión 1)", detalle: `${r.titulo}. Motivo: ${e.motivo ?? ""}` });
  }

  if (e.confirmada) {
    await base.from("jornadas").update({ estado: "confirmada", confirmada_en: new Date().toISOString(), confirmada_por: EIRA }).eq("id", jornadaId);
    eventos.push({ jornada_id: jornadaId, actor: EIRA, rol: "eira", tipo: "Jornada confirmada", detalle: "Validación final de EIRA." });
  }
  await base.from("eventos").insert(eventos);
}

export async function reiniciarDatosDemo(): Promise<void> {
  const base = db();
  await vaciarBucket();
  // Borrar municipios elimina en cascada jornadas, requisitos, entregas y eventos.
  const { error: eBorrar } = await base.from("municipios").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (eBorrar) throw new Error(eBorrar.message);

  const { data: municipios, error } = await base
    .from("municipios")
    .insert(
      [MUNICIPIO_EN_VIVO, ...EJEMPLOS].map((e, i) => ({
        nombre: e.municipio,
        enlace_nombre: e.enlace,
        enlace_cargo: e.cargo,
        enlace_telefono: `34100000${String(i + 1).padStart(2, "0")}`,
        token_hash: hashToken(e.token),
      })),
    )
    .select("id,nombre");
  if (error) throw new Error(error.message);

  const dia = hoy();
  await Promise.all(EJEMPLOS.map((e) => cargarEjemplo(e, municipios!.find((m) => m.nombre === e.municipio)!.id, dia)));
}
