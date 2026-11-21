import Link from "next/link";
import { reiniciarDemo } from "@/app/acciones";
import { exigirEira } from "@/lib/sesion";
import { listarJornadas, resumir } from "@/lib/datos";
import { Encabezado, boton, botonSecundario, tarjeta } from "@/components/ui";
import { TarjetaJornada } from "@/components/TarjetaJornada";
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
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Jornadas por municipio</h1>
            <p className="text-tenue">Qué está completo y qué impide avanzar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/eira/exportar" download className={botonSecundario}>Exportar a CSV</a>
            <Link href="/eira/nueva" className={boton}>
              Crear jornada
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className={tarjeta}>
            <p className="text-3xl font-bold text-rojo">{atrasadas}</p>
            <p className="text-sm text-tenue">Atrasadas</p>
          </div>
          <div className={tarjeta}>
            <p className="text-3xl font-bold text-ambar">{porRevisar}</p>
            <p className="text-sm text-tenue">Entregas por revisar</p>
          </div>
          <div className={tarjeta}>
            <p className="text-3xl font-bold text-verde">{listas}</p>
            <p className="text-sm text-tenue">Listas para confirmar</p>
          </div>
        </div>

        {puntos.length > 0 && (
          <div className="mt-5">
            <MapaJornadas puntos={puntos} />
          </div>
        )}

        <div className="mt-5 space-y-3">
          {conResumen.length === 0 && (
            <p className={tarjeta}>
              Aún no hay jornadas. Cree la primera o cargue los datos de ejemplo con el botón de abajo.
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
