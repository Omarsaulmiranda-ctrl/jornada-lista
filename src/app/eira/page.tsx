import Link from "next/link";
import { reiniciarDemo } from "@/app/acciones";
import { exigirEira } from "@/lib/sesion";
import { listarJornadas, resumir } from "@/lib/datos";
import { Encabezado, boton, tarjeta } from "@/components/ui";
import { TarjetaJornada } from "@/components/TarjetaJornada";
import { Refrescar } from "@/components/Refrescar";

export const dynamic = "force-dynamic";

const ORDEN = { rojo: 0, ambar: 1, verde: 2 };

export default async function Tablero() {
  const sesion = await exigirEira();
  const jornadas = await listarJornadas(sesion);
  const conResumen = jornadas
    .map((j) => ({ j, r: resumir(j) }))
    .sort((a, b) => ORDEN[a.r.color] - ORDEN[b.r.color] || a.j.fecha.localeCompare(b.j.fecha));

  const porRevisar = jornadas.flatMap((j) => j.requisitos.filter((x) => x.estado === "recibido")).length;
  const atrasadas = conResumen.filter((x) => x.r.color === "rojo").length;
  const listas = conResumen.filter((x) => x.r.listaParaConfirmar).length;

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
          <Link href="/eira/nueva" className={boton}>
            Crear jornada
          </Link>
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

        <form action={reiniciarDemo} className="mt-10 border-t border-borde pt-4">
          <button className="text-sm text-tenue underline hover:text-rosa">
            Reiniciar datos de demostración
          </button>
          <span className="ml-2 text-sm text-tenue">
            (borra todo y vuelve a cargar los municipios ficticios)
          </span>
        </form>
      </main>
    </>
  );
}
