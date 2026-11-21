import Link from "next/link";
import { salir } from "@/app/acciones";
import type { Sesion } from "@/lib/sesion";
import type { Resumen } from "@/lib/datos";
import { ETIQUETA_ESTADO } from "@/lib/plantillas";

const COLOR_ESTADO: Record<string, string> = {
  pendiente: "bg-gris-suave text-tenue",
  recibido: "bg-ambar-suave text-ambar",
  observado: "bg-rojo-suave text-rojo",
  aprobado: "bg-verde-suave text-verde",
  no_aplica: "bg-gris-suave text-tenue",
};

// El estado siempre se dice con texto, no solo con color.
export function Estado({ estado }: { estado: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold ${COLOR_ESTADO[estado] ?? ""}`}>
      {estado === "aprobado" ? "🔒 " : ""}
      {ETIQUETA_ESTADO[estado] ?? estado}
    </span>
  );
}

const COLOR_SEMAFORO = {
  verde: "bg-verde-suave text-verde",
  ambar: "bg-ambar-suave text-ambar",
  rojo: "bg-rojo-suave text-rojo",
};
const PUNTO = { verde: "bg-verde", ambar: "bg-ambar", rojo: "bg-rojo" };

export function Semaforo({ resumen }: { resumen: Resumen }) {
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${COLOR_SEMAFORO[resumen.color]}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${PUNTO[resumen.color]}`} aria-hidden />
      {resumen.etiqueta}
    </span>
  );
}

export function Encabezado({ sesion }: { sesion: Sesion }) {
  const inicio = sesion.rol === "eira" ? "/eira" : "/municipio";
  return (
    <header className="no-imprimir border-b border-borde bg-superficie">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href={inicio} className="text-lg font-bold text-rosa-fuerte">
          Jornada Lista
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-tenue">
            {sesion.rol === "eira" ? sesion.nombre : `${sesion.nombre} · ${sesion.municipio}`}
          </span>
          <form action={salir}>
            <button className="rounded-lg border border-borde px-3 py-1.5 hover:bg-rosa-suave">Salir</button>
          </form>
        </div>
      </div>
    </header>
  );
}

export const boton =
  "inline-flex items-center justify-center rounded-lg bg-rosa px-4 py-2.5 font-semibold text-white hover:bg-rosa-fuerte disabled:opacity-50";
export const botonSecundario =
  "inline-flex items-center justify-center rounded-lg border border-borde bg-superficie px-4 py-2.5 font-semibold hover:bg-rosa-suave";
export const campo =
  "mt-1 w-full rounded-lg border border-borde bg-superficie px-3 py-2.5 text-base outline-none focus:border-rosa focus:ring-2 focus:ring-rosa-suave";
export const tarjeta = "rounded-xl border border-borde bg-superficie p-4 sm:p-5";
