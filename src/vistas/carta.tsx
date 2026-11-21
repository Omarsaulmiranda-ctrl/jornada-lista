import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirSesion, type Rol } from "@/lib/sesion";
import { cargarExpediente, hashPlantillaCarta } from "@/lib/datos";
import { fechaHora, fechaLarga } from "@/lib/fechas";
import { PLANTILLA_CARTA } from "@/lib/plantillas";
import { BotonImprimir } from "@/components/BotonImprimir";

/** Dato proporcionado por el municipio: se subraya para distinguirlo del texto fijo. */
function B({ children }: { children: React.ReactNode }) {
  return <strong className="underline decoration-rosa decoration-2 underline-offset-2">{children}</strong>;
}

export async function VistaCarta({ rol, id, v }: { rol: Rol; id: string; v?: string }) {
  const sesion = await exigirSesion(rol);
  const expediente = await cargarExpediente(sesion, id);
  if (!expediente) notFound();
  const { jornada } = expediente;
  const requisito = jornada.requisitos.find((r) => r.tipo === "carta");
  const entregas = requisito?.entregas ?? [];
  const entrega = entregas.find((e) => String(e.version) === String(v)) ?? entregas[0];
  if (!requisito || !entrega?.datos) notFound();
  const d = entrega.datos;

  // Sello de integridad: la huella guardada al generar debe coincidir con la plantilla vigente.
  const huellaActual = hashPlantillaCarta();
  const integra = d.plantilla_hash === huellaActual;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="no-imprimir mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/${rol}/j/${jornada.id}#carta_compromiso`} className="text-sm text-rosa underline">
          ← Volver al expediente
        </Link>
        <BotonImprimir />
      </div>

      <article className="rounded-xl border border-borde bg-white p-6 text-[15px] leading-relaxed text-black sm:p-10 print:border-0 print:p-0">
        <header className="border-b-2 border-rosa pb-3">
          <p className="text-lg font-bold text-rosa-fuerte">EIRA Movimiento Rosa A.C.</p>
          <p className="text-sm">Membrete de ejemplo para el prototipo · Ciudad Guzmán, Jalisco</p>
        </header>

        <p className="mt-4 rounded border border-ambar bg-ambar-suave p-2 text-sm font-semibold text-ambar">
          {PLANTILLA_CARTA.leyenda}
        </p>

        <h1 className="mt-6 text-center text-xl font-bold uppercase">{PLANTILLA_CARTA.titulo}</h1>

        <p className="mt-6">
          Por medio de la presente, el Municipio de <B>{jornada.municipio.nombre}</B>, {jornada.municipio.estado},
          a través de <B>{d.dependencia}</B> y representado por <B>{d.firmante}</B>, en su carácter de{" "}
          <B>{d.cargo}</B>, manifiesta su compromiso de colaborar con EIRA Movimiento Rosa A.C. en la jornada del
          programa <B>{jornada.programa}</B>, que se llevará a cabo el <B>{fechaLarga(jornada.fecha)}</B> en{" "}
          <B>{jornada.sede}</B>{jornada.colonia ? <>, <B>{jornada.colonia}</B></> : null}, con domicilio en <B>{d.domicilio_sede}</B>, en un horario <B>{d.horario}</B>.
        </p>
        <p className="mt-3">
          Servicios previstos: <B>{jornada.servicios.join(", ") || "por definir"}</B>.
        </p>

        <h2 className="mt-6 font-bold">Cláusulas 🔒</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-6">
          {PLANTILLA_CARTA.clausulas.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>

        <div className="mt-12 grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <div className="border-t border-black pt-1">{d.firmante}</div>
            <div>{d.cargo}</div>
            <div>Municipio de {jornada.municipio.nombre}</div>
          </div>
          <div>
            <div className="border-t border-black pt-1">Representante de EIRA</div>
            <div>EIRA Movimiento Rosa A.C.</div>
          </div>
        </div>

        <footer className="mt-10 border-t border-borde pt-3 text-xs text-tenue">
          <p>
            Versión {entrega.version} de la carta · generada por {entrega.autor} el {fechaHora(entrega.creado_en)} ·
            plantilla «{d.plantilla_version}».
          </p>
          <p className="break-all">Huella de las cláusulas (SHA-256): {d.plantilla_hash}</p>
          <p className={`mt-1 font-semibold ${integra ? "text-verde" : "text-rojo"}`}>
            {integra
              ? "✔ Las cláusulas coinciden con la plantilla vigente de EIRA."
              : "✘ Esta carta se generó con una plantilla distinta a la vigente. Debe generarse de nuevo."}
          </p>
          <p className="mt-1">Los datos subrayados los proporcionó el municipio. El resto del texto es fijo.</p>
        </footer>
      </article>
    </main>
  );
}
