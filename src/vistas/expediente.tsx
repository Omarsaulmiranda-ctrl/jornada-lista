import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { confirmarJornada, registrarDatos, revisarEntrega } from "@/app/acciones";
import { exigirSesion, type Rol, type Sesion } from "@/lib/sesion";
import { MapaJornadas } from "@/components/MapaJornadas";
import { enlaceMaps } from "@/lib/mapas";
import { cargarExpediente, firmarArchivos, quienDebe, resumir, type Entrega, type Jornada, type Requisito } from "@/lib/datos";
import { fechaCorta, fechaHora, fechaLarga, plazo } from "@/lib/fechas";
import { PLANTILLA_CARTA, plantillaDe, type Campo } from "@/lib/plantillas";
import { ENLACES_DEMO } from "@/lib/operaciones";
import { Encabezado, Estado, Semaforo, boton, botonSecundario, campo, eyebrow, tarjeta } from "@/components/ui";
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
  const dias = resumen.diasParaJornada;
  const enlace = jornada.municipio.enlace_nombre ?? "Enlace por designar";
  const quien = (d: "Municipio" | "EIRA") => (d === "EIRA" ? `EIRA · ${jornada.responsable_eira}` : `Municipio · ${enlace}`);
  const accion = accionPrincipal(jornada, esEira);

  return (
    <>
      <Encabezado sesion={sesion} />
      <Refrescar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href={`/${rol}`} className="text-sm font-semibold text-rosa underline-offset-2 hover:underline">
          ← Todas las jornadas
        </Link>

        <header className="mt-3 border-b border-borde pb-4">
          <p className={eyebrow}>{jornada.programa}</p>
          <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-extrabold sm:text-4xl">{jornada.municipio.nombre}</h1>
            <Semaforo resumen={resumen} />
          </div>
          <p className="cifras mt-1 text-lg">
            <span className="font-semibold">{jornada.sede}</span>
            {jornada.colonia ? `, ${jornada.colonia}` : ""} · {fechaLarga(jornada.fecha)}
            <span className="text-tenue">{dias >= 0 ? ` · faltan ${dias} días` : " · ya pasó"}</span>
          </p>
          {jornada.lat !== null && jornada.lng !== null && (
            <a href={enlaceMaps(jornada.lat, jornada.lng)} target="_blank" rel="noopener noreferrer"
              className="no-imprimir mt-1 inline-block text-sm font-semibold text-rosa underline underline-offset-2 hover:text-vino">
              Abrir la sede en Google Maps
            </a>
          )}
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <Dato t="Responsable de EIRA" v={jornada.responsable_eira} />
            <Dato t="Responsable del municipio" v={enlace} />
            <Dato t="Servicios" v={jornada.servicios.join(", ") || "Por definir"} />
          </dl>
        </header>

        {/* ------------------------------------------------ Qué falta */}
        <section aria-labelledby="que-falta" className="mt-5 rounded-xl border border-borde bg-superficie p-4 sm:p-5">
          <h2 id="que-falta" className="text-xl font-extrabold">Qué falta</h2>

          {jornada.estado === "confirmada" ? (
            <p className="mt-2 font-semibold text-verde">
              Nada. Jornada confirmada por {jornada.confirmada_por}
              {jornada.confirmada_en ? ` el ${fechaHora(jornada.confirmada_en)}` : ""}.
            </p>
          ) : resumen.listaParaConfirmar ? (
            <div className="mt-2">
              <p className="font-semibold text-verde">
                Lista para confirmar: todos los requisitos obligatorios están aprobados.
              </p>
              {esEira ? (
                <form action={confirmarJornada} className="mt-3">
                  <input type="hidden" name="jornada_id" value={jornada.id} />
                  <button className={boton}>Confirmar jornada</button>
                </form>
              ) : (
                <p className="mt-1 text-sm">Solo falta la confirmación final de EIRA.</p>
              )}
              <p className="mt-3 text-sm text-tenue">
                <strong>Regla propuesta, pendiente de validar con EIRA:</strong> el sistema nunca confirma solo.
                Aunque todo lo obligatorio esté aprobado, una persona de EIRA da la confirmación final.
              </p>
            </div>
          ) : (
            <>
              <ul className="mt-2 divide-y divide-borde">
                {resumen.bloqueos.map((b) => (
                  <li key={b.requisito.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                    <a href={`#${b.requisito.clave}`} className="font-semibold underline-offset-2 hover:underline">
                      {b.requisito.titulo}
                    </a>
                    <span className="text-sm">
                      <span className="font-semibold">{!esEira && b.debe === "Municipio" ? "Le toca a usted" : quien(b.debe)}</span>
                      {" · "}{b.accion}{" · "}
                      <span className={`cifras ${b.vencido ? "font-bold text-rojo" : "text-tenue"}`}>{plazo(b.requisito.fecha_limite)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-borde pt-3">
                {accion ? (
                  <a href={`#${accion.clave}`} className={`${boton} w-full sm:w-auto`}>{accion.texto}</a>
                ) : (
                  <p className="text-sm text-tenue">
                    {esEira
                      ? "No tiene documentos por revisar. Lo que falta le toca al municipio."
                      : "No le toca nada obligatorio por ahora. EIRA está revisando lo que envió. Puede adelantar los opcionales en la lista de abajo."}
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        <div className="no-imprimir mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link href={`/${rol}/j/${jornada.id}/borrador`} className="font-semibold text-rosa underline underline-offset-2">
            Borrador de la carta compromiso (ejemplo, sin firma)
          </Link>
        </div>

        {esEira && jornada.estado !== "confirmada" && <Aviso jornada={jornada} />}

        {/* ------------------------------------------------ Requisitos */}
        <h2 className="mt-8 text-2xl font-extrabold">Requisitos</h2>
        <p className="text-sm text-tenue">Los obligatorios impiden confirmar la jornada; los opcionales pueden llegar después.</p>
        <ol className="mt-3 divide-y divide-borde rounded-xl border border-borde bg-superficie">
          {jornada.requisitos.map((r) => (
            <FilaRequisito key={r.id} r={r} jornada={jornada} sesion={sesion} urls={urls} quien={quien}
              principal={accion?.clave === r.clave} />
          ))}
        </ol>

        {/* ------------------------------------------------ Bitácora */}
        <h2 className="mt-8 text-2xl font-extrabold">Bitácora</h2>
        <p className="text-sm text-tenue">Quién hizo qué y cuándo. No se puede editar ni borrar.</p>
        <ol className="mt-3 divide-y divide-borde rounded-xl border border-borde bg-superficie px-4 text-sm">
          {eventos.length === 0 && <li className="py-3 text-tenue">Sin movimientos todavía.</li>}
          {eventos.map((e) => (
            <li key={e.id} className="grid gap-x-3 py-2.5 sm:grid-cols-[9.5rem_1fr]">
              <span className="cifras text-tenue">{fechaHora(e.creado_en)}</span>
              <span>
                <span className="font-bold">{e.tipo}</span> {e.detalle}{" "}
                <span className="text-tenue">— {e.actor}</span>
              </span>
            </li>
          ))}
        </ol>

        {jornada.lat !== null && jornada.lng !== null && (
          <details className="no-imprimir mt-6">
            <summary className="cursor-pointer text-sm font-semibold text-vino">Ver la sede en el mapa</summary>
            <div className="mt-2">
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
          </details>
        )}
      </main>
    </>
  );
}

/** Una sola acción principal según el rol: lo más urgente que le toca a quien está viendo. */
function accionPrincipal(j: Jornada, esEira: boolean): { clave: string; texto: string } | null {
  if (j.estado === "confirmada") return null;
  const orden = [...j.requisitos].sort((a, b) => Number(b.critico) - Number(a.critico) || a.orden - b.orden);
  if (esEira) {
    const r = orden.find((x) => x.estado === "recibido");
    return r ? { clave: r.clave, texto: `Revisar documento: ${r.titulo.toLowerCase()}` } : null;
  }
  // Al municipio solo se le empuja a lo obligatorio; lo opcional queda en la lista.
  const obs = orden.find((x) => x.critico && x.estado === "observado");
  if (obs) return { clave: obs.clave, texto: `Subir corrección: ${obs.titulo.toLowerCase()}` };
  const pend = orden.find((x) => x.critico && x.estado === "pendiente");
  return pend ? { clave: pend.clave, texto: pend.titulo } : null;
}

function Dato({ t, v }: { t: string; v: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-tenue">{t}</dt>
      <dd className="font-semibold">{v}</dd>
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
      <summary className="cursor-pointer font-semibold text-vino">
        Preparar aviso al enlace municipal ({pendientes.length} {pendientes.length === 1 ? "pendiente" : "pendientes"})
      </summary>
      <p className="mt-2 text-sm text-tenue">
        Un solo mensaje con todo lo que falta y el motivo de cada observación. Usted decide cuándo enviarlo.
      </p>
      <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-gris-suave p-3 font-sans text-sm">{mensaje}</pre>
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

function FilaRequisito({
  r,
  jornada,
  sesion,
  urls,
  quien,
  principal,
}: {
  r: Requisito;
  jornada: Jornada;
  sesion: Sesion;
  urls: Record<string, string>;
  quien: (d: "Municipio" | "EIRA") => string;
  principal: boolean;
}) {
  const entregas = r.entregas ?? [];
  const ultima = entregas[0];
  const esEira = sesion.rol === "eira";
  const abierta = jornada.estado !== "confirmada";
  const puedeEntregar = !esEira && abierta && (r.estado === "pendiente" || r.estado === "observado");
  const puedeRevisar = esEira && abierta && r.estado === "recibido" && ultima?.revision === "en_revision";
  const debe = quienDebe(r);
  const meToca = puedeEntregar || puedeRevisar;

  return (
    <li id={r.clave} className="scroll-mt-24 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <h3 className="text-lg font-extrabold">{r.titulo}</h3>
        <Estado estado={r.estado} />
      </div>
      <p className="mt-0.5 text-sm text-tenue">
        <span className={r.critico ? "font-bold text-rosa" : ""}>{r.critico ? "Obligatorio" : "Opcional"}</span>
        {" · "}Límite {fechaCorta(r.fecha_limite)}
        {r.estado !== "aprobado" && <> ({plazo(r.fecha_limite)})</>}
        {debe && (
          <> · Le toca a: <span className="font-semibold text-texto">{!esEira && debe === "Municipio" ? "usted" : quien(debe)}</span></>
        )}
      </p>

      {r.estado === "observado" && ultima?.motivo && (
        <div className="mt-3 rounded-lg bg-rojo-suave p-3">
          <p className="font-bold text-rojo">Observado: qué corregir</p>
          <p>{ultima.motivo}</p>
          <p className="mt-1 text-sm text-tenue">
            {ultima.revisor}
            {ultima.revisado_en ? `, ${fechaHora(ultima.revisado_en)}` : ""}. La versión {ultima.version} se conserva en el historial.
          </p>
        </div>
      )}

      <details className="group mt-2" open={principal || puedeRevisar || r.estado === "observado"}>
        <summary className="cursor-pointer text-sm font-semibold text-vino">
          {meToca ? (esEira ? "Revisar documento" : r.estado === "observado" ? "Subir corrección" : "Entregar") : "Ver detalle"}
          {entregas.length > 0 ? ` · ${entregas.length} ${entregas.length === 1 ? "versión" : "versiones"}` : ""}
        </summary>

        {r.descripcion && <p className="mt-2 text-sm">{r.descripcion}</p>}

        {ultima && (
          <div className="mt-3">
            <p className="text-sm font-semibold">
              Versión {ultima.version} (la más reciente) · {ultima.autor} · {fechaHora(ultima.creado_en)}
            </p>
            <Contenido r={r} e={ultima} base={`/${sesion.rol}/j/${jornada.id}`} urls={urls} />
          </div>
        )}
        {!ultima && <p className="mt-2 text-sm text-tenue">Todavía no hay ninguna entrega.</p>}

        {puedeRevisar && ultima && (
          <div className="no-imprimir mt-4 grid gap-4 border-t border-borde pt-4 sm:grid-cols-2">
            <form action={revisarEntrega}>
              <input type="hidden" name="entrega_id" value={ultima.id} />
              <input type="hidden" name="decision" value="aprobar" />
              <p className="text-sm text-tenue">Al aprobar, el requisito queda bloqueado.</p>
              <button className={`${boton} mt-2 w-full !bg-verde hover:!bg-[#2f5536]`}>Aprobar versión {ultima.version}</button>
            </form>
            <form action={revisarEntrega}>
              <input type="hidden" name="entrega_id" value={ultima.id} />
              <input type="hidden" name="decision" value="observar" />
              <label className="block text-sm">
                <span className="font-semibold">Motivo de la observación</span>
                <textarea name="motivo" required minLength={5} maxLength={500} rows={2}
                  placeholder="Por ejemplo: la foto no muestra el acceso principal." className={campo} />
              </label>
              <button className={`${botonSecundario} mt-2 w-full`}>Marcar como observada</button>
            </form>
          </div>
        )}

        {puedeEntregar && (
          <div className="no-imprimir mt-4 border-t border-borde pt-4">
            <p className="font-semibold">
              {r.estado === "observado" ? `Subir corrección (versión ${(ultima?.version ?? 0) + 1})` : "Entregar"}
            </p>
            {r.tipo === "archivos" ? (
              <>
                <p className="mt-1 text-sm text-tenue">
                  Modo demo: puede usar las fotos ficticias{" "}
                  <a href="/ejemplos/sede-version-1.png" download className="font-semibold text-rosa underline">versión 1</a> y{" "}
                  <a href="/ejemplos/sede-version-2.png" download className="font-semibold text-rosa underline">versión 2 (con acceso principal)</a>.
                </p>
                <SubirArchivos requisitoId={r.id} hayVersionAnterior={(ultima?.archivos?.length ?? 0) > 0} />
              </>
            ) : (
              <FormularioDatos r={r} previos={ultima?.datos ?? null} />
            )}
          </div>
        )}

        {entregas.length > 1 && (
          <div className="mt-4 border-t border-borde pt-3">
            <p className="text-sm font-semibold">Versiones anteriores</p>
            <ol className="mt-2 space-y-3">
              {entregas.slice(1).map((e) => (
                <li key={e.id} className="rounded-lg bg-gris-suave p-3 text-sm">
                  <p className="font-semibold">
                    Versión {e.version} · {e.autor} · {fechaHora(e.creado_en)} ·{" "}
                    {e.revision === "observada" ? "Observada" : e.revision === "aprobada" ? "Aprobada" : "Sin revisar"}
                    {e.revisor ? ` por ${e.revisor}` : ""}
                  </p>
                  {e.motivo && <p>Motivo: {e.motivo}</p>}
                  <Contenido r={r} e={e} base={`/${sesion.rol}/j/${jornada.id}`} urls={urls} />
                </li>
              ))}
            </ol>
          </div>
        )}
      </details>
    </li>
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
                <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-borde bg-superficie">
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
        <div className="rounded-xl bg-gris-suave p-3">
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
