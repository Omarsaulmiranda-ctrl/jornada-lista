// Configuración de EIRA: qué se le pide a un municipio para preparar una jornada.
// Cambiar estas listas adapta el sistema a otro programa u otra organización
// sin tocar el resto del código.

export type TipoRequisito = "carta" | "archivos" | "datos";

export type Campo = {
  nombre: string;
  etiqueta: string;
  ayuda?: string;
  tipo?: "texto" | "telefono" | "parrafo";
};

export type PlantillaRequisito = {
  clave: string;
  titulo: string; // Empieza con verbo: es una tarea para el enlace municipal.
  descripcion: string;
  tipo: TipoRequisito;
  critico: boolean; // Si es crítico, impide confirmar la jornada.
  diasAntes: number; // Fecha límite = fecha de la jornada menos estos días.
  campos?: Campo[];
};

export const REQUISITOS_BASE: PlantillaRequisito[] = [
  {
    clave: "carta_compromiso",
    titulo: "Llenar la carta compromiso",
    descripcion:
      "Complete los datos del municipio. Las cláusulas de EIRA no se pueden modificar.",
    tipo: "carta",
    critico: true,
    diasAntes: 14,
  },
  {
    clave: "fotos_espacio",
    titulo: "Subir fotografías del espacio",
    descripcion:
      "Acceso, sala de espera, área de exploración y sanitarios. Sin personas en las fotos.",
    tipo: "archivos",
    critico: true,
    diasAntes: 14,
  },
  {
    clave: "persona_enlace",
    titulo: "Designar a la persona enlace",
    descripcion: "Quién coordinará por parte del municipio el día de la jornada.",
    tipo: "datos",
    critico: true,
    diasAntes: 21,
    campos: [
      { nombre: "nombre", etiqueta: "Nombre completo" },
      { nombre: "cargo", etiqueta: "Cargo" },
      { nombre: "telefono", etiqueta: "Teléfono de contacto", tipo: "telefono" },
    ],
  },
  {
    clave: "logotipo",
    titulo: "Subir el logotipo del municipio",
    descripcion: "Para los materiales de difusión. De preferencia en PNG.",
    tipo: "archivos",
    critico: false,
    diasAntes: 10,
  },
  {
    clave: "apoyo_convocatoria",
    titulo: "Confirmar el apoyo a la convocatoria",
    descripcion: "Cómo invitará el municipio a las mujeres de la comunidad.",
    tipo: "datos",
    critico: false,
    diasAntes: 7,
    campos: [
      {
        nombre: "medios",
        etiqueta: "Medios de difusión",
        ayuda: "Por ejemplo: perifoneo, redes del ayuntamiento, DIF, delegaciones.",
        tipo: "parrafo",
      },
      { nombre: "meta", etiqueta: "Número estimado de asistentes" },
    ],
  },
];

export function plantillaDe(clave: string): PlantillaRequisito | undefined {
  return REQUISITOS_BASE.find((r) => r.clave === clave);
}

export const SERVICIOS = [
  "Papanicolaou",
  "Ultrasonido de mama",
  "Exploración clínica",
  "Valoración nutricional",
] as const;

export const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  recibido: "Recibido",
  observado: "Observado",
  aprobado: "Aprobado",
  no_aplica: "No aplica",
};

// ---------------------------------------------------------------------------
// Carta compromiso
// PLANTILLA DE EJEMPLO. La plantilla oficial de EIRA no estaba entre los materiales
// publicados; el texto de las cláusulas es ficticio y sirve para demostrar el mecanismo.
// ---------------------------------------------------------------------------

export const PLANTILLA_CARTA = {
  version: "Ejemplo v1",
  titulo: "Carta compromiso para la realización de una jornada de salud",
  campos: [
    { nombre: "firmante", etiqueta: "Nombre de quien firma por el municipio" },
    { nombre: "cargo", etiqueta: "Cargo de quien firma" },
    { nombre: "dependencia", etiqueta: "Dependencia responsable", ayuda: "Por ejemplo: DIF Municipal o Dirección de Salud." },
    { nombre: "domicilio_sede", etiqueta: "Domicilio de la sede" },
    { nombre: "horario", etiqueta: "Horario en que estará disponible la sede", ayuda: "Por ejemplo: de 8:00 a 15:00 horas." },
  ] satisfies Campo[],
  // Cláusulas fijas. El municipio no tiene forma de editarlas desde la aplicación.
  clausulas: [
    "El Municipio pondrá a disposición de EIRA, sin costo, un espacio techado, limpio y con privacidad para la atención, con sanitarios, energía eléctrica y agua, durante el horario acordado.",
    "El Municipio designará a una persona enlace que estará presente durante toda la jornada y apoyará la organización de las asistentes.",
    "El Municipio difundirá la convocatoria por sus medios oficiales, usando únicamente los materiales aprobados por EIRA.",
    "Los servicios de la jornada son gratuitos para las asistentes. Ninguna de las partes podrá condicionarlos ni utilizarlos con fines políticos, electorales o de lucro.",
    "EIRA aportará el personal de salud, el equipo y los insumos necesarios para los servicios acordados, y será responsable del resguardo de la información de las pacientes.",
    "Cualquier cambio de fecha o de sede deberá notificarse por escrito a la otra parte con al menos cinco días hábiles de anticipación.",
  ],
  leyenda:
    "Borrador generado desde una plantilla de ejemplo. No equivale a firma ni a aprobación jurídica. La validación institucional final corresponde a EIRA Movimiento Rosa A.C.",
} as const;
