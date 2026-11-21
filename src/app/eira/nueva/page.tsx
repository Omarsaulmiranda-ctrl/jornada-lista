import Link from "next/link";
import { crearJornada } from "@/app/acciones";
import { exigirEira } from "@/lib/sesion";
import { db } from "@/lib/supabase";
import { hoy, sumarDias } from "@/lib/fechas";
import { REQUISITOS_BASE, SERVICIOS } from "@/lib/plantillas";
import { Encabezado, boton, botonSecundario, campo, tarjeta } from "@/components/ui";
import { ElegirUbicacion } from "@/components/ElegirUbicacion";

export const dynamic = "force-dynamic";

export default async function NuevaJornada() {
  const sesion = await exigirEira();
  const { data: municipios } = await db().from("municipios").select("id,nombre").order("nombre");
  const inicial = municipios?.find((m) => m.nombre === "Zapotlán el Grande");

  return (
    <>
      <Encabezado sesion={sesion} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-3xl font-bold">Crear jornada</h1>
        <p className="text-tenue">El municipio recibirá su lista de requisitos en cuanto la guarde.</p>

        <form action={crearJornada} className="mt-5 space-y-5">
          <section className={`${tarjeta} space-y-4`}>
            <label className="block">
              <span className="font-semibold">Municipio</span>
              <select name="municipio_id" required defaultValue={inicial?.id} className={campo}>
                {(municipios ?? []).map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-semibold">Programa</span>
                <input name="programa" defaultValue="Tamizaje Rosa" required className={campo} />
              </label>
              <label className="block">
                <span className="font-semibold">Fecha propuesta</span>
                <input type="date" name="fecha" required min={sumarDias(hoy(), 1)} defaultValue={sumarDias(hoy(), 30)} className={campo} />
              </label>
              <label className="block">
                <span className="font-semibold">Sede</span>
                <input name="sede" required defaultValue="Casa de Salud Municipal" className={campo} />
              </label>
              <label className="block">
                <span className="font-semibold">Localidad</span>
                <input name="localidad" defaultValue="Cabecera municipal" className={campo} />
              </label>
              <label className="block">
                <span className="font-semibold">Responsable de EIRA</span>
                <input name="responsable" defaultValue="Coordinación EIRA" required className={campo} />
              </label>
              <label className="block">
                <span className="font-semibold">Aliado o patrocinador (opcional)</span>
                <input name="aliado" className={campo} />
              </label>
            </div>
            <fieldset>
              <legend className="font-semibold">Servicios</legend>
              <div className="mt-1 grid gap-1 sm:grid-cols-2">
                {SERVICIOS.map((s, i) => (
                  <label key={s} className="flex items-center gap-2">
                    <input type="checkbox" name="servicios" value={s} defaultChecked={i !== 2} className="h-4 w-4" />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className={tarjeta}>
            <h2 className="text-xl font-semibold">Dónde será la jornada</h2>
            <p className="mb-3 text-sm text-tenue">Lugares reales de OpenStreetMap. Sirve para ver todas las jornadas en el mapa.</p>
            <ElegirUbicacion />
          </section>

          <section className={tarjeta}>
            <h2 className="text-xl font-semibold">Requisitos para este municipio</h2>
            <p className="text-sm text-tenue">
              Los requisitos críticos impiden confirmar la jornada. La fecha límite se calcula a partir de la fecha de la jornada.
            </p>
            <div className="mt-3 divide-y divide-borde">
              {REQUISITOS_BASE.map((r) => (
                <div key={r.clave} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" name={`req_${r.clave}`} defaultChecked className="mt-1.5 h-4 w-4" />
                    <span>
                      <span className="font-semibold">{r.titulo}</span>
                      <span className="block text-sm text-tenue">Límite: {r.diasAntes} días antes de la jornada</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name={`crit_${r.clave}`} defaultChecked={r.critico} className="h-4 w-4" />
                    Crítico
                  </label>
                </div>
              ))}
            </div>
          </section>

          <div className="flex gap-3">
            <button className={boton}>Crear jornada</button>
            <Link href="/eira" className={botonSecundario}>Cancelar</Link>
          </div>
        </form>
      </main>
    </>
  );
}
