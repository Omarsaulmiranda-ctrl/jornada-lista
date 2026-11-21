import { exigirMunicipio } from "@/lib/sesion";
import { listarJornadas, resumir } from "@/lib/datos";
import { fechaLarga } from "@/lib/fechas";
import { MapaJornadas, type PuntoMapa } from "@/components/MapaJornadas";
import { Encabezado, tarjeta } from "@/components/ui";
import { TarjetaJornada } from "@/components/TarjetaJornada";
import { Refrescar } from "@/components/Refrescar";

export const dynamic = "force-dynamic";

export default async function InicioMunicipio() {
  const sesion = await exigirMunicipio();
  const jornadas = await listarJornadas(sesion);

  const puntos: PuntoMapa[] = jornadas
    .filter((j) => j.lat !== null && j.lng !== null)
    .map((j) => {
      const r = resumir(j);
      return {
        id: j.id, lat: j.lat!, lng: j.lng!,
        titulo: j.colonia ? `${j.programa} · ${j.colonia}` : j.programa,
        subtitulo: `${j.sede} · ${fechaLarga(j.fecha)}`,
        etiqueta: r.etiqueta, color: r.color,
        bloqueos: r.bloqueos.map((b) => `${b.debe === "Municipio" ? "Le toca a usted" : "EIRA debe"} ${b.accion}: ${b.requisito.titulo.toLowerCase()}`),
        href: `/municipio/j/${j.id}`,
      };
    });

  return (
    <>
      <Encabezado sesion={sesion} />
      <Refrescar segundos={5} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rosa">Enlace municipal</p>
        <h1 className="mt-1 text-3xl font-extrabold">Jornadas en {sesion.municipio}</h1>
        <p className="mt-1 text-tenue">Toque una jornada para ver qué le falta entregar.</p>
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
        {puntos.length > 0 && (
          <div className="mt-6">
            <MapaJornadas puntos={puntos} />
          </div>
        )}
      </main>
    </>
  );
}
