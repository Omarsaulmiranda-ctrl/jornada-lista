import Link from "next/link";
import { reiniciarDemo } from "@/app/acciones";
import { exigirEira } from "@/lib/sesion";
import { listarJornadas, resumir } from "@/lib/datos";
import { Encabezado, boton, botonSecundario, eyebrow } from "@/components/ui";
import { FilaJornada } from "@/components/TarjetaJornada";
import { Refrescar } from "@/components/Refrescar";
import { MapaJornadas, type PuntoMapa } from "@/components/MapaJornadas";
import { fechaLarga } from "@/lib/fechas";

export const dynamic = "force-dynamic";

const ORDEN = { rojo: 0, ambar: 1, verde: 2 };

export default async function Tablero({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await searchParams;
  const sesion = await exigirEira();
  const jornadas = await listarJornadas(sesion);
  const conResumen = jornadas
    .map((j) => ({ j, r: resumir(j) }))
    .sort((a, b) => ORDEN[a.r.color] - ORDEN[b.r.color] || a.j.fecha.localeCompare(b.j.fecha));

  const porRevisar = jornadas.flatMap((j) => j.requisitos.filter((x) => x.estado === "recibido")).length;
  const atrasadas = conResumen.filter((x) => x.r.color === "rojo").length;
  const listas = conResumen.filter((x) => x.r.listaParaConfirmar).length;

  const puntos: PuntoMapa[] = conResumen
    .filter(({ j }) => j.lat !== null && j.lng !== null)
    .map(({ j, r }) => ({
      id: j.id,
      lat: j.lat!,
      lng: j.lng!,
      titulo: j.colonia ? `${j.municipio.nombre} · ${j.colonia}` : j.municipio.nombre,
      subtitulo: `${j.sede} · ${fechaLarga(j.fecha)}`,
      etiqueta: r.etiqueta,
      color: r.color,
      bloqueos: r.bloqueos.map((b) => `${b.debe} debe ${b.accion}: ${b.requisito.titulo.toLowerCase()}`),
      href: `/eira/j/${j.id}`,
    }));

  return (
    <>
      <Encabezado sesion={sesion} />
      <Refrescar segundos={5} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={eyebrow}>Tablero de coordinación</p>
            <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Jornadas por municipio</h1>
            <p className="text-tenue">Qué está completo y qué impide avanzar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/eira/exportar" download className={botonSecundario}>Exportar a CSV</a>
            <Link href="/eira/nueva" className={boton}>
              + Crear jornada
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-xl border border-borde bg-superficie">
          <Kpi valor={atrasadas} texto="Atrasadas" color="text-rojo" />
          <Kpi valor={porRevisar} texto="Entregas por revisar" color="text-ambar" />
          <Kpi valor={listas} texto="Listas para confirmar" color="text-verde" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="overflow-hidden rounded-xl border border-borde bg-superficie">
            <div className="hidden grid-cols-[minmax(0,1.3fr)_9rem_minmax(0,2fr)_6rem] gap-3 border-b border-borde bg-rosa-suave px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-vino md:grid">
              <span>Municipio</span>
              <span>Avance</span>
              <span>Qué impide confirmar</span>
              <span className="text-right">Fecha</span>
            </div>
            {conResumen.length === 0 && (
              <p className="p-5 text-tenue">
                Aún no hay jornadas. Cree la primera o cargue los datos de ejemplo con el botón de abajo.
              </p>
            )}
            {conResumen.map(({ j }) => (
              <FilaJornada key={j.id} jornada={j} />
            ))}
          </section>

          {puntos.length > 0 && (
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <MapaJornadas puntos={puntos} />
            </aside>
          )}
        </div>

        <details className="mt-10 border-t border-borde pt-4" open={aviso === "clave"}>
          <summary className="cursor-pointer text-sm text-tenue">Reiniciar datos de demostración</summary>
          <form action={reiniciarDemo} className="mt-2 flex flex-wrap items-center gap-2">
            <input type="password" name="clave" placeholder="Clave del equipo" autoComplete="off"
              className="rounded-full border border-borde bg-superficie px-4 py-2 text-sm" />
            <button className="rounded-full border border-borde px-4 py-2 text-sm hover:bg-rosa-suave">
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

function Kpi({ valor, texto, color }: { valor: number; texto: string; color: string }) {
  return (
    <div className="border-r border-borde px-4 py-4 last:border-r-0 sm:px-6">
      <p className={`cifras font-display text-4xl font-extrabold ${color}`}>{valor}</p>
      <p className="text-sm font-semibold text-tenue">{texto}</p>
    </div>
  );
}
