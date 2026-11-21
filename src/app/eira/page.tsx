import Link from "next/link";
import { reiniciarDemo } from "@/app/acciones";
import { exigirEira } from "@/lib/sesion";
import { actividadReciente, listarJornadas, resumir } from "@/lib/datos";
import { fechaLarga } from "@/lib/fechas";
import { Encabezado, boton, botonSecundario } from "@/components/ui";
import { TarjetaJornada } from "@/components/TarjetaJornada";
import { Refrescar } from "@/components/Refrescar";
import { Monitor, type ActividadVista } from "@/components/Monitor";
import type { PuntoMapa } from "@/components/MapaJornadas";

export const dynamic = "force-dynamic";

const ORDEN = { rojo: 0, ambar: 1, verde: 2 };

function saludo(): string {
  const hora = Number(
    new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", hour: "numeric", hour12: false }).format(new Date()),
  );
  return hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
}

function hace(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return `hace ${Math.round(s / 86400)} d`;
}

export default async function Tablero({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await searchParams;
  const sesion = await exigirEira();
  const [jornadas, eventos] = await Promise.all([listarJornadas(sesion), actividadReciente(8)]);
  const conResumen = jornadas
    .map((j) => ({ j, r: resumir(j) }))
    .sort((a, b) => ORDEN[a.r.color] - ORDEN[b.r.color] || a.j.fecha.localeCompare(b.j.fecha));

  const porRevisar = jornadas.flatMap((j) => j.requisitos.filter((x) => x.estado === "recibido")).length;
  const atrasadas = conResumen.filter((x) => x.r.color === "rojo").length;
  const listas = conResumen.filter((x) => x.r.listaParaConfirmar).length;
  const confirmadas = jornadas.filter((j) => j.estado === "confirmada").length;

  const puntos: PuntoMapa[] = conResumen
    .filter(({ j }) => j.lat !== null && j.lng !== null)
    .map(({ j, r }) => ({
      id: j.id,
      lat: j.lat!,
      lng: j.lng!,
      titulo: j.colonia && j.colonia !== j.municipio.nombre ? `${j.municipio.nombre} · ${j.colonia}` : j.municipio.nombre,
      subtitulo: `${j.sede} · ${fechaLarga(j.fecha)}`,
      etiqueta: r.etiqueta,
      color: r.color,
      bloqueos: r.bloqueos.map((b) => `${b.debe} debe ${b.accion}: ${b.requisito.titulo.toLowerCase()}`),
      href: `/eira/j/${j.id}`,
    }));

  const actividad: ActividadVista[] = eventos.map((e) => ({
    id: e.id,
    titulo: `${e.municipio} · ${e.tipo}`,
    detalle: e.detalle ?? "",
    hace: hace(e.creado_en),
    rol: e.rol,
  }));

  const cifras = [
    { n: jornadas.length, t: "Jornadas en seguimiento", c: "" },
    { n: atrasadas, t: "Atrasadas", c: "text-rojo" },
    { n: porRevisar, t: "Entregas por revisar", c: "text-ambar" },
    { n: listas, t: "Listas para confirmar", c: "text-verde" },
    { n: confirmadas, t: "Confirmadas", c: "text-verde" },
  ];

  return (
    <>
      <Encabezado sesion={sesion} />
      <Refrescar segundos={5} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tenue">
              {saludo()} · <span className="text-texto">Coordinación EIRA</span>
            </p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Monitoreo de jornadas</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/eira/exportar" download className={botonSecundario}>Exportar a CSV</a>
            <Link href="/eira/nueva" className={boton}>Crear jornada</Link>
          </div>
        </div>

        <div className="vidrio mt-5 grid grid-cols-2 gap-y-4 rounded-2xl border border-borde bg-superficie p-5 sm:grid-cols-5">
          {cifras.map((x, i) => (
            <div key={x.t} className={i > 0 ? "sm:border-l sm:border-borde sm:pl-5" : ""}>
              <p className="text-sm text-tenue">{x.t}</p>
              <p className={`mt-1 text-4xl font-bold tabular-nums ${x.c}`}>{x.n}</p>
            </div>
          ))}
        </div>
      </div>

      {puntos.length > 0 ? (
        <Monitor puntos={puntos} actividad={actividad} />
      ) : (
        <div className="h-8" />
      )}

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-10">
        <div className="vidrio inline-block rounded-xl border border-borde bg-superficie px-4 py-2">
          <h2 className="text-xl font-semibold">Todas las jornadas</h2>
          <p className="text-sm text-tenue">Lugares reales; jornadas, personas y teléfonos ficticios de demostración.</p>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {conResumen.length === 0 && (
            <p className="vidrio rounded-xl border border-borde bg-superficie p-5">
              Aún no hay jornadas. Cree la primera o cargue los ejemplos con el botón de abajo.
            </p>
          )}
          {conResumen.map(({ j }) => (
            <TarjetaJornada key={j.id} jornada={j} vista="eira" />
          ))}
        </div>

        <details className="mt-10 border-t border-borde pt-4" open={aviso === "clave"}>
          <summary className="cursor-pointer text-sm text-tenue">Reiniciar datos de demostración</summary>
          <form action={reiniciarDemo} className="mt-2 flex flex-wrap items-center gap-2">
            <input type="password" name="clave" placeholder="Clave del equipo" autoComplete="off"
              className="rounded-lg border border-borde bg-superficie px-3 py-2 text-sm" />
            <button className="rounded-lg border border-borde px-3 py-2 text-sm hover:bg-rosa-suave">
              Borrar todo y recargar los ejemplos
            </button>
          </form>
          {aviso === "clave" && (
            <p role="alert" className="mt-2 text-sm text-rojo">La clave no es correcta. No se borró nada.</p>
          )}
        </details>
      </main>
    </>
  );
}
