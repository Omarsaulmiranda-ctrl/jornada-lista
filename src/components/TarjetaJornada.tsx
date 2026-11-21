import Link from "next/link";
import { resumir, type Jornada, type Resumen } from "@/lib/datos";
import { fechaCorta, fechaLarga, plazo } from "@/lib/fechas";
import { Anillo, PUNTO, Progreso, Semaforo, tarjeta } from "./ui";

function Bloqueos({ r, vista }: { r: Resumen; vista: "eira" | "municipio" }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {r.bloqueos.map((b) => {
        const mio = vista === "municipio" && b.debe === "Municipio";
        return (
          <li key={b.requisito.id} className="flex flex-wrap items-baseline gap-x-2">
            <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
              b.debe === "EIRA" ? "bg-ambar-suave text-ambar" : "bg-rosa-suave text-rosa"}`}>
              {mio ? "Le toca a usted" : b.debe}
            </span>
            <span>
              <span className="font-semibold">{mio ? "" : "debe "}{b.accion}:</span> {b.requisito.titulo.toLowerCase()}
            </span>
            <span className={`cifras ${b.vencido ? "font-bold text-rojo" : "text-tenue"}`}>
              {fechaCorta(b.requisito.fecha_limite)} · {plazo(b.requisito.fecha_limite)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function SinBloqueos({ jornada, vista }: { jornada: Jornada; vista: "eira" | "municipio" }) {
  if (jornada.estado === "confirmada") return <p className="text-sm font-semibold text-verde">Confirmada ✓</p>;
  return (
    <p className="text-sm font-semibold text-verde">
      Todo lo obligatorio está aprobado.{vista === "eira" ? " Falta la confirmación final de EIRA." : ""}
    </p>
  );
}

// Fila del tablero de EIRA: densa, pensada para escritorio y para muchos municipios.
export function FilaJornada({ jornada }: { jornada: Jornada }) {
  const r = resumir(jornada);
  const dias = r.diasParaJornada;
  return (
    <Link
      href={`/eira/j/${jornada.id}`}
      className="group grid gap-3 border-b border-borde px-4 py-4 transition last:border-b-0 hover:bg-rosa-suave/50 md:grid-cols-[minmax(0,1.3fr)_9rem_minmax(0,2fr)_6rem] md:items-start"
    >
      <div className="flex gap-3">
        <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${PUNTO[r.color]}`} aria-hidden />
        <div className="min-w-0">
          <p className="font-display text-lg font-extrabold text-vino group-hover:text-rosa">{jornada.municipio.nombre}</p>
          <p className="text-sm text-tenue">
            {jornada.programa} · {jornada.sede}{jornada.colonia ? `, ${jornada.colonia}` : ""}
          </p>
          <div className="mt-1.5"><Semaforo resumen={r} /></div>
        </div>
      </div>
      <Progreso hechos={r.aprobados} total={r.total} className="md:pt-2" />
      <div className="md:pt-1">
        {r.bloqueos.length > 0 ? <Bloqueos r={r} vista="eira" /> : <SinBloqueos jornada={jornada} vista="eira" />}
      </div>
      <div className="cifras text-sm md:text-right">
        <p className="font-bold text-vino">{fechaCorta(jornada.fecha)}</p>
        <p className="text-tenue">{dias >= 0 ? `en ${dias} días` : "ya pasó"}</p>
      </div>
    </Link>
  );
}

// Tarjeta del enlace municipal: grande, táctil, con el avance como anillo.
export function TarjetaJornada({ jornada, vista }: { jornada: Jornada; vista: "eira" | "municipio" }) {
  const r = resumir(jornada);
  const dias = r.diasParaJornada;
  const mios = r.bloqueos.filter((b) => b.debe === "Municipio").length;
  return (
    <Link href={`/${vista}/j/${jornada.id}`} className={`${tarjeta} block hover:border-rosa`}>
      <div className="flex items-center gap-4">
        <Anillo hechos={r.aprobados} total={r.total} />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-extrabold">
            {vista === "eira" ? jornada.municipio.nombre : jornada.programa}
          </h3>
          <p className="text-sm text-tenue">
            {jornada.sede}{jornada.colonia ? `, ${jornada.colonia}` : ""}
          </p>
          <p className="cifras text-sm font-semibold text-vino">
            {fechaLarga(jornada.fecha)}{dias >= 0 ? ` · faltan ${dias} días` : ""}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Semaforo resumen={r} />
        {vista === "municipio" && mios > 0 && (
          <span className="rounded-lg bg-rosa px-3 py-1 text-sm font-bold text-white">
            {mios} {mios === 1 ? "pendiente suyo" : "pendientes suyos"} →
          </span>
        )}
      </div>
      <div className="mt-3 border-t border-borde pt-3">
        {r.bloqueos.length > 0 ? <Bloqueos r={r} vista={vista} /> : <SinBloqueos jornada={jornada} vista={vista} />}
      </div>
    </Link>
  );
}
