import Link from "next/link";
import { salir } from "@/app/acciones";
import type { Sesion } from "@/lib/sesion";
import type { Resumen } from "@/lib/datos";
import { ETIQUETA_ESTADO } from "@/lib/plantillas";

// Triángulo con lazo, redibujado a partir del favicon de eiraac.org.
// Sustituir por el archivo oficial del logo cuando EIRA lo comparta.
export function LogoEira({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none">
      <path d="M24 5 L43 41 H5 Z" stroke="var(--rosa-logo)" strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M14 34 C20 26, 28 26, 34 34 M14 30 C20 38, 28 38, 34 30" stroke="var(--rosa)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoEira />
      <span className="leading-tight">
        <span className="block font-display text-xl font-extrabold tracking-wide text-rosa-logo">EIRA</span>
        <span className={`block text-[11px] font-semibold uppercase tracking-[0.14em] ${claro ? "text-rosa-claro" : "text-vino"}`}>
          Jornada Lista
        </span>
      </span>
    </span>
  );
}

const COLOR_ESTADO: Record<string, string> = {
  pendiente: "bg-gris-suave text-tenue ring-borde",
  recibido: "bg-ambar-suave text-ambar ring-ambar/20",
  observado: "bg-rojo-suave text-rojo ring-rojo/20",
  aprobado: "bg-verde-suave text-verde ring-verde/20",
  no_aplica: "bg-gris-suave text-tenue ring-borde",
};

// El estado siempre se dice con texto, no solo con color.
export function Estado({ estado }: { estado: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${COLOR_ESTADO[estado] ?? ""}`}>
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
export const PUNTO = { verde: "bg-verde-marca", ambar: "bg-[#d9a21b]", rojo: "bg-rojo" };

export function Semaforo({ resumen }: { resumen: Resumen }) {
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold ${COLOR_SEMAFORO[resumen.color]}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${PUNTO[resumen.color]}`} aria-hidden />
      {resumen.etiqueta}
    </span>
  );
}

export function Progreso({ hechos, total, className = "" }: { hechos: number; total: number; className?: string }) {
  const pct = total ? Math.round((hechos / total) * 100) : 0;
  return (
    <div className={className}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-rosa-suave" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-rosa" style={{ width: `${pct}%` }} />
      </div>
      <p className="cifras mt-1 text-xs font-semibold text-tenue">
        {hechos} de {total} aprobados
      </p>
    </div>
  );
}

export function Anillo({ hechos, total }: { hechos: number; total: number }) {
  const pct = total ? hechos / total : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} stroke="var(--rosa-suave)" strokeWidth="7" fill="none" />
        <circle cx="32" cy="32" r={r} stroke="var(--rosa)" strokeWidth="7" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <span className="cifras absolute inset-0 flex items-center justify-center font-display text-sm font-extrabold text-vino">
        {hechos}/{total}
      </span>
    </div>
  );
}

export function Encabezado({ sesion }: { sesion: Sesion }) {
  const inicio = sesion.rol === "eira" ? "/eira" : "/municipio";
  return (
    <header className="no-imprimir sticky top-0 z-[1100] border-b border-borde bg-superficie">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
        <Link href={inicio} aria-label="Ir al inicio">
          <Marca />
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <form action={salir}>
            <input type="hidden" name="rol" value={sesion.rol} />
            <button className="rounded-full border border-borde px-3 py-1.5 font-semibold text-vino hover:bg-rosa-suave">Salir</button>
          </form>
        </div>
      </div>
    </header>
  );
}

// Acceso simulado: se dice en pantalla para que nadie lo confunda con un sistema en producción.
export function ModoDemo() {
  return (
    <span className="whitespace-nowrap rounded-md border border-ambar/40 bg-ambar-suave px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ambar"
      title="Datos ficticios y credenciales de prueba">
      Modo demo
    </span>
  );
}

export const boton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-rosa px-5 py-2.5 font-bold text-white transition-colors hover:bg-vino disabled:opacity-50";
export const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-rosa/40 bg-superficie px-5 py-2.5 font-bold text-vino transition-colors hover:border-rosa hover:bg-rosa-suave";
export const campo =
  "mt-1 w-full rounded-lg border border-[#b9b2b2] bg-superficie px-3.5 py-2.5 text-base outline-none focus:border-rosa focus:ring-3 focus:ring-rosa-claro";
export const tarjeta = "rounded-xl border border-borde bg-superficie p-4 sm:p-5";
export const eyebrow = "text-xs font-bold uppercase tracking-[0.16em] text-rosa";
