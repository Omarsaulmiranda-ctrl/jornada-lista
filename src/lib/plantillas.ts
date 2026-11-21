// Configuración de EIRA: qué se le pide a un municipio para preparar una jornada.
// Cambiar esta lista (o cargarla desde la base) adapta el sistema a otro programa
// u otra organización sin tocar el resto del código.

export type TipoRequisito = "carta" | "archivos" | "datos";

export type PlantillaRequisito = {
  clave: string;
  titulo: string; // Empieza con verbo: es una tarea para el enlace municipal.
  descripcion: string;
  tipo: TipoRequisito;
  critico: boolean; // Si es crítico, impide confirmar la jornada.
  diasAntes: number; // Fecha límite = fecha de la jornada menos estos días.
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
    descripcion: "Nombre, cargo y teléfono de quien coordinará el día de la jornada.",
    tipo: "datos",
    critico: true,
    diasAntes: 21,
  },
  {
    clave: "logotipo",
    titulo: "Subir el logotipo del municipio",
    descripcion: "Para los materiales de difusión. De preferencia PNG.",
    tipo: "archivos",
    critico: false,
    diasAntes: 10,
  },
  {
    clave: "apoyo_convocatoria",
    titulo: "Confirmar el apoyo a la convocatoria",
    descripcion: "Cómo y por qué medios el municipio invitará a las mujeres de la comunidad.",
    tipo: "datos",
    critico: false,
    diasAntes: 7,
  },
];

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
