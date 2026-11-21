import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { confirmarJornada, registrarDatos, revisarEntrega } from "@/app/acciones";
import { exigirSesion, type Rol, type Sesion } from "@/lib/sesion";
import { MapaJornadas } from "@/components/MapaJornadas";
import { cargarExpediente, firmarArchivos, quienDebe, resumir, type Entrega, type Jornada, type Requisito } from "@/lib/datos";
import { fechaCorta, fechaHora, fechaLarga, plazo } from "@/lib/fechas";
import { PLANTILLA_CARTA, plantillaDe, type Campo } from "@/lib/plantillas";
import { ENLACES_DEMO } from "@/lib/operaciones";
import { Encabezado, Estado, Semaforo, boton, botonSecundario, campo, tarjeta } from "@/components/ui";
import { SubirArchivos } from "@/components/SubirArchivos";
import { Refrescar } from "@/components/Refrescar";

export async function VistaExpediente({ rol, id }: { rol: Rol; id: string }) {
  const sesion = await exigirSesion(rol);
  const expediente = await cargarExpediente(sesion, id);
  if (!expediente) notFound();
  const { jornada, eventos } = expediente;
  const urls = await firmarArchivos(jornada);
  const resumen = resumir(jornada);
  const esEira = sesion.rol === "eira";

  return (
    <>
      <Encabezado sesion={sesion} />
      <Refrescar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href={`/${rol}`} className="text-sm text-rosa underline">
          ← Todas las jornadas
        </Link>

        <section className={`${tarjeta} mt-3`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold">{jornada.municipio.nombre}</h1>
              <p className="text-lg">
                {jornada.programa} · {fechaLarga(jornada.fecha)}
              </p>
            </div>
            <Semaforo resumen={resumen} />
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <Dato t="Sede" v={`${jornada.sede}${jornada.localidad ? `, ${jornada.localidad}` : ""}`} />
            {jornada.colonia && <Dato t="Colonia o localidad" v={jornada.colonia} />}
            <Dato t="Servicios" v={jornada.servicios.join(", ") || "Por definir"} />
            <Dato t="Responsable de EIRA" v={jornada.responsable_eira} />
            <Dato t="Enlace municipal" v={jornada.municipio.enlace_nombre ?? "Por designar"} />
            {jornada.aliado && <Dato t="Aliado" v={jornada.aliado} />}
            <Dato t="Avance" v={`${resumen.aprobados} de ${resumen.total} requisitos aprobados`} />
          </dl>

          {jornada.estado === "confirmada" ? (
            <p className="mt-4 rounded-lg bg-verde-suave p-3 font-semibold text-verde">
              Jornada confirmada por {jornada.confirmada_por}
              {jornada.confirmada_en ? ` el ${fechaHora(jornada.confirmada_en)}` : ""}
            </p>
          ) : resumen.listaParaConfirmar ? (
            <div className="mt-4 rounded-lg bg-verde-suave p-3">
              <p className="font-semibold text-verde">Todo lo crítico está aprobado.</p>
              {esEira ? (
                <form action={confirmarJornada} className="mt-2">
                  <input type="hidden" name="jornada_id" value={jornada.id} />
                  <button className={boton}>Confirmar jornada</button>
                  <span className="ml-3 text-sm text-tenue">La confirmación final es de EIRA.</span>
                </form>
              ) : (
                <p className="text-sm">Solo falta la confirmación final de EIRA.</p>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-rosa-suave p-3">
              <p className="font-semibold">Qué impide confirmar esta jornada</p>
              <ul className="mt-1 space-y-1 text-sm">
                {resumen.bloqueos.map((b) => (
                  <li key={b.requisito.id}>
                    <span className="font-semibold">
                      {!esEira && b.debe === "Municipio" ? "Le toca a usted" : `${b.debe} debe`} {b.accion}:
                    </span>{" "}
                    {b.requisito.titulo.toLowerCase()}{" "}
                    <span className={b.vencido ? "font-semibold text-rojo" : "text-tenue"}>
                      ({plazo(b.requisito.fecha_limite)})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {jornada.lat !== null && jornada.lng !== null && (
          <div className="no-imprimir mt-4">
            <MapaJornadas
              puntos={[{
                id: jornada.id, lat: jornada.lat, lng: jornada.lng,
                titulo: jornada.colonia ? `${jornada.municipio.nombre} · ${jornada.colonia}` : jornada.municipio.nombre,
                subtitulo: jornada.ubicacion ?? jornada.sede,
                etiqueta: resumen.etiqueta, color: resumen.color, bloqueos: [],
                href: `/${rol}/j/${jornada.id}`,
              }]}
              compacto
            />
          </div>
        )}

        {esEira && jornada.estado !== "confirmada" && <Aviso jornada={jornada} />}

        <h2 className="mt-6 text-2xl font-bold">Requisitos</h2>
        <div className="mt-3 space-y-4">
          {jornada.requisitos.map((r) => (
            <TarjetaRequisito key={r.id} r={r} jornada={jornada} sesion={sesion} urls={urls} />
          ))}
        </div>

        <h2 className="mt-8 text-2xl font-bold">Bitácora</h2>
        <ol className={`${tarjeta} mt-3 space-y-2 text-sm`}>
          {eventos.length === 0 && <li className="text-tenue">Sin movimientos todavía.</li>}
          {eventos.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-x-2">
              <span className="text-tenue">{fechaHora(e.creado_en)}</span>
              <span className="font-semibold">{e.tipo}</span>
              <span>{e.detalle}</span>
              <span className="text-tenue">— {e.actor}</span>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}

function Dato({ t, v }: { t: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-tenue">{t}:</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

// --------------------------------------------------------------------------- aviso

async function Aviso({ jornada }: { jornada: Jornada }) {
  const pendientes = jornada.requisitos.filter((r) => quienDebe(r) === "Municipio");
  if (pendientes.length === 0) return null;
  const h = await headers();
  const origen = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const demo = ENLACES_DEMO.find((e) => e.municipio === jornada.municipio.nombre);
  const lineas = pendientes.map((r) => {
    const motivo = r.estado === "observado" ? r.entregas?.[0]?.motivo : null;
    return `• ${r.titulo} (${motivo ? `observado: ${motivo}` : `pendiente, ${plazo(r.fecha_limite)}`})`;
  });
  const mensaje = [
    `Hola, ${jornada.municipio.enlace_nombre ?? "buen día"}. Le escribe EIRA Movimiento Rosa.`,
    `Para la jornada de ${jornada.programa} del ${fechaLarga(jornada.fecha)} en ${jornada.sede} nos falta de su parte:`,
    ...lineas,
    demo ? `Puede entregarlo desde su celular aquí: ${origen}/m/${demo.token}` : "",
    "Gracias por su apoyo.",
  ]
    .filter(Boolean)
    .join("\n");
  const telefono = (jornada.municipio.enlace_telefono ?? "").replace(/\D/g, "");

  return (
    <details className={`${tarjeta} mt-4`}>
      <summary className="cursor-pointer font-semibold">
        Avisar al enlace municipal ({pendientes.length} {pendientes.length === 1 ? "pendiente" : "pendientes"})
      </summary>
      <p className="mt-2 text-sm text-tenue">
        Un solo mensaje con todo lo que falta y el motivo de cada observación. Usted decide cuándo enviarlo.
      </p>
      <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-gris-suave p-3 font-sans text-sm">{mensaje}</pre>
      <a
        href={`https://wa.me/52${telefono}?text=${encodeURIComponent(mensaje)}`}
        target="_blank"
        rel="noreferrer"
        className={`${botonSecundario} mt-3`}
      >
        Abrir en WhatsApp
      </a>
      <span className="ml-3 text-sm text-tenue">El teléfono de la demo es ficticio.</span>
    </details>
  );
}

// --------------------------------------------------------------------------- requisito

function TarjetaRequisito({
  r,
  jornada,
  sesion,
  urls,
}: {
  r: Requisito;
  jornada: Jornada;
  sesion: Sesion;
  urls: Record<string, string>;
}) {
  const entregas = r.entregas ?? [];
  const ultima = entregas[0];
  const esEira = sesion.rol === "eira";
  const abierta = jornada.estado !== "confirmada";
  const puedeEntregar = !esEira && abierta && (r.estado === "pendiente" || r.estado === "observado");
  const puedeRevisar = esEira && abierta && r.estado === "recibido" && ultima?.revision === "en_revision";
  const debe = quienDebe(r);

  return (
    <section className={tarjeta} id={r.clave}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-xl font-semibold">{r.titulo}</h3>
        <Estado estado={r.estado} />
      </div>
      <p className="mt-1 text-sm text-tenue">
        {r.critico ? <span className="font-semibold text-rosa-fuerte">Crítico para confirmar · </span> : "Puede entregarse después · "}
        Fecha límite: {fechaCorta(r.fecha_limite)}
        {r.estado !== "aprobado" && <> ({plazo(r.fecha_limite)})</>}
        {debe && <> · Le toca a: <span className="font-semibold">{debe}</span></>}
      </p>
      {r.descripcion && <p className="mt-2">{r.descripcion}</p>}

      {r.estado === "observado" && ultima?.motivo && (
        <div className="mt-3 rounded-lg border border-rojo bg-rojo-suave p-3">
          <p className="font-semibold text-rojo">EIRA pidió una corrección</p>
          <p>{ultima.motivo}</p>
          <p className="mt-1 text-sm text-tenue">
            {ultima.revisor}
            {ultima.revisado_en ? `, ${fechaHora(ultima.revisado_en)}` : ""}. La versión {ultima.version} se conserva en el historial.
          </p>
        </div>
      )}

      {ultima && (
        <div className="mt-3">
          <p className="text-sm font-semibold">
            Versión {ultima.version} · {ultima.autor} · {fechaHora(ultima.creado_en)}
          </p>
          <Contenido r={r} e={ultima} base={`/${sesion.rol}/j/${jornada.id}`} urls={urls} />
        </div>
      )}

      {puedeRevisar && ultima && (
        <div className="no-imprimir mt-4 grid gap-3 border-t border-borde pt-4 sm:grid-cols-2">
          <form action={revisarEntrega}>
            <input type="hidden" name="entrega_id" value={ultima.id} />
            <input type="hidden" name="decision" value="aprobar" />
            <p className="text-sm text-tenue">Al aprobar, el requisito queda bloqueado.</p>
            <button className={`${boton} mt-2 w-full bg-verde hover:bg-verde`}>Aprobar</button>
          </form>
          <form action={revisarEntrega}>
            <input type="hidden" name="entrega_id" value={ultima.id} />
            <input type="hidden" name="decision" value="observar" />
            <label className="block text-sm">
              <span className="font-semibold">¿Qué debe corregir el municipio?</span>
              <textarea name="motivo" required minLength={5} maxLength={500} rows={2}
                placeholder="Por ejemplo: falta la fotografía del área de exploración." className={campo} />
            </label>
            <button className={`${botonSecundario} mt-2 w-full`}>Pedir corrección</button>
          </form>
        </div>
      )}

      {puedeEntregar && (
        <div className="no-imprimir mt-4 border-t border-borde pt-4">
          <p className="font-semibold">
            {r.estado === "observado" ? `Enviar la versión ${(ultima?.version ?? 0) + 1} corregida` : "Entregar"}
          </p>
          {r.tipo === "archivos" ? (
            <SubirArchivos requisitoId={r.id} hayVersionAnterior={(ultima?.archivos?.length ?? 0) > 0} />
          ) : (
            <FormularioDatos r={r} previos={ultima?.datos ?? null} />
          )}
        </div>
      )}

      {entregas.length > 1 && (
        <details className="mt-4 border-t border-borde pt-3">
          <summary className="cursor-pointer text-sm font-semibold">
            Historial: {entregas.length} versiones
          </summary>
          <ol className="mt-2 space-y-3">
            {entregas.slice(1).map((e) => (
              <li key={e.id} className="rounded-lg bg-gris-suave p-3 text-sm">
                <p className="font-semibold">
                  Versión {e.version} · {e.autor} · {fechaHora(e.creado_en)} ·{" "}
                  {e.revision === "observada" ? "Observada" : e.revision === "aprobada" ? "Aprobada" : "Sin revisar"}
                </p>
                {e.motivo && <p>Motivo: {e.motivo}</p>}
                <Contenido r={r} e={e} base={`/${sesion.rol}/j/${jornada.id}`} urls={urls} />
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

function Contenido({
  r,
  e,
  base,
  urls,
}: {
  r: Requisito;
  e: Entrega;
  base: string;
  urls: Record<string, string>;
}) {
  const campos: readonly Campo[] = r.tipo === "carta" ? PLANTILLA_CARTA.campos : (plantillaDe(r.clave)?.campos ?? []);
  return (
    <div className="mt-2 space-y-2">
      {e.archivos.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {e.archivos.map((a) => {
            const url = urls[a.ruta];
            const esPdf = a.ruta.endsWith(".pdf");
            return (
              <li key={a.ruta}>
                <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-borde bg-superficie">
                  {esPdf || !url ? (
                    <span className="flex h-24 items-center justify-center p-2 text-center text-sm">📄 {a.nombre}</span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={a.nombre} className="h-24 w-full object-cover" />
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {e.datos && (
        <dl className="text-sm">
          {campos.map((c) => (
            <div key={c.nombre} className="flex flex-wrap gap-x-2">
              <dt className="text-tenue">{c.etiqueta}:</dt>
              <dd className="font-medium">{e.datos?.[c.nombre] ?? "—"}</dd>
            </div>
          ))}
        </dl>
      )}
      {r.tipo === "carta" && (
        <Link href={`${base}/carta?v=${e.version}`} className="inline-block text-sm font-semibold text-rosa underline">
          Ver e imprimir la carta (versión {e.version})
        </Link>
      )}
      {e.nota && <p className="text-sm">Nota: {e.nota}</p>}
    </div>
  );
}

function FormularioDatos({ r, previos }: { r: Requisito; previos: Record<string, string> | null }) {
  const esCarta = r.tipo === "carta";
  const campos: readonly Campo[] = esCarta ? PLANTILLA_CARTA.campos : (plantillaDe(r.clave)?.campos ?? []);
  return (
    <form action={registrarDatos} className="mt-3 space-y-3">
      <input type="hidden" name="requisito_id" value={r.id} />
      {campos.map((c) => (
        <label key={c.nombre} className="block">
          <span className="font-semibold">{c.etiqueta}</span>
          {c.ayuda && <span className="block text-sm text-tenue">{c.ayuda}</span>}
          {c.tipo === "parrafo" ? (
            <textarea name={`campo_${c.nombre}`} required rows={2} maxLength={500} defaultValue={previos?.[c.nombre] ?? ""} className={campo} />
          ) : (
            <input name={`campo_${c.nombre}`} required maxLength={200} inputMode={c.tipo === "telefono" ? "tel" : undefined}
              defaultValue={previos?.[c.nombre] ?? ""} className={campo} />
          )}
        </label>
      ))}
      {esCarta && (
        <div className="rounded-lg bg-gris-suave p-3">
          <p className="font-semibold">🔒 Cláusulas de EIRA (no se pueden modificar)</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm">
            {PLANTILLA_CARTA.clausulas.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
          <p className="mt-2 text-sm text-tenue">Plantilla: {PLANTILLA_CARTA.version}. {PLANTILLA_CARTA.leyenda}</p>
        </div>
      )}
      <button className={`${boton} w-full sm:w-auto`}>{esCarta ? "Generar carta y enviar a EIRA" : "Enviar a EIRA"}</button>
    </form>
  );
}
