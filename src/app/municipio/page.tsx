import { redirect } from "next/navigation";
import { exigirSesion } from "@/lib/sesion";
import { listarJornadas } from "@/lib/datos";
import { Encabezado, tarjeta } from "@/components/ui";
import { TarjetaJornada } from "@/components/TarjetaJornada";
import { Refrescar } from "@/components/Refrescar";

export const dynamic = "force-dynamic";

export default async function InicioMunicipio() {
  const sesion = await exigirSesion();
  if (sesion.rol !== "municipio") redirect("/eira");
  const jornadas = await listarJornadas(sesion);

  return (
    <>
      <Encabezado sesion={sesion} />
      <Refrescar segundos={5} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-3xl font-bold">Jornadas en {sesion.municipio}</h1>
        <p className="text-tenue">Toque una jornada para ver qué le falta entregar.</p>
        <div className="mt-5 space-y-3">
          {jornadas.length === 0 && (
            <p className={tarjeta}>
              Todavía no hay jornadas programadas en su municipio. Cuando EIRA proponga una, aparecerá aquí.
            </p>
          )}
          {jornadas.map((j) => (
            <TarjetaJornada key={j.id} jornada={j} vista="municipio" />
          ))}
        </div>
      </main>
    </>
  );
}
