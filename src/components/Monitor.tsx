"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as MapaLeaflet, Marker } from "leaflet";
import { ATRIBUCION_OSCURA, MOSAICOS_OSCUROS, type PuntoMapa } from "./MapaJornadas";


export type ActividadVista = { id: number; titulo: string; detalle: string; hace: string; rol: string };

const CADA_MS = 4500;

/**
 * Monitor de jornadas: mapa rosa a pantalla completa detrás del contenido, con un punto que late por
 * jornada. En el tablero recorre las jornadas una por una («En foco») y muestra la actividad reciente.
 * Con `soloFondo` queda como fondo decorativo, sin datos ni interacción.
 */
export function Monitor({
  puntos,
  actividad = [],
  soloFondo = false,
}: {
  puntos: PuntoMapa[];
  actividad?: ActividadVista[];
  soloFondo?: boolean;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const capa = useRef<LayerGroup | null>(null);
  const marcas = useRef<Map<string, Marker>>(new Map());
  const encuadrado = useRef("");
  const [foco, setFoco] = useState(0);
  const [pausa, setPausa] = useState(false);
  const firma = JSON.stringify(puntos.map((p) => [p.id, p.lat, p.lng, p.color]));
  const enFoco = puntos.length ? puntos[foco % puntos.length] : null;

  // Mapa y puntos. Solo se rehace cuando cambia una posición o un color, no en cada refresco de datos.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !caja.current) return;
      if (!mapa.current) {
        mapa.current = L.map(caja.current, {
          zoomControl: false,
          scrollWheelZoom: false,
          dragging: !soloFondo,
          doubleClickZoom: !soloFondo,
          touchZoom: !soloFondo,
          keyboard: false,
          attributionControl: true,
        }).setView([19.85, -103.5], 10);
        L.tileLayer(MOSAICOS_OSCUROS, { attribution: ATRIBUCION_OSCURA, maxZoom: 16, subdomains: "abc" }).addTo(mapa.current);
        capa.current = L.layerGroup().addTo(mapa.current);
      }
      capa.current!.clearLayers();
      marcas.current.clear();
      const lista = JSON.parse(firma) as [string, number, number, string][];
      for (const [id, lat, lng, color] of lista) {
        const icono = L.divIcon({
          className: "",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          html: `<span class="punto punto-${color}"><span class="onda"></span><span class="onda onda-2"></span><span class="nucleo"></span></span>`,
        });
        const m = L.marker([lat, lng], { icon: icono, interactive: !soloFondo, keyboard: false }).addTo(capa.current!);
        if (!soloFondo) m.on("click", () => { setFoco(lista.findIndex((x) => x[0] === id)); setPausa(true); });
        marcas.current.set(id, m);
      }
      const llave = lista.map((x) => x[0]).join(",");
      if (lista.length && llave !== encuadrado.current) {
        encuadrado.current = llave;
        // El contenido tapa la parte alta y la baja de la pantalla: se deja margen para que los puntos queden a la vista.
        // En pantallas anchas, las tarjetas flotan a los lados: los puntos se encuadran en el hueco central.
        const ancho = caja.current.clientWidth;
        const lado = !soloFondo && ancho >= 1024 ? Math.round(ancho * 0.3) : 40;
        mapa.current.fitBounds(L.latLngBounds(lista.map((x) => [x[1], x[2]])), {
          paddingTopLeft: [lado, soloFondo ? 40 : 230],
          paddingBottomRight: [lado, soloFondo ? 40 : 60],
          maxZoom: 11,
        });
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [firma, soloFondo]);

  useEffect(
    () => () => {
      mapa.current?.remove();
      mapa.current = null;
    },
    [],
  );

  // Recorrido automático: una jornada en foco cada pocos segundos.
  useEffect(() => {
    if (soloFondo || pausa || puntos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setFoco((f) => (f + 1) % puntos.length), CADA_MS);
    return () => clearInterval(id);
  }, [soloFondo, pausa, puntos.length]);

  // Resalta en el mapa el punto que está en foco.
  useEffect(() => {
    for (const [id, m] of marcas.current) m.getElement()?.classList.toggle("enfocado", !soloFondo && id === enFoco?.id);
  }, [enFoco?.id, firma, soloFondo]);

  return (
    <>
      <div className="mapa-rosa fixed inset-0 z-0" aria-hidden={soloFondo}>
        <div ref={caja} className="h-full w-full" />
        <div className="velo pointer-events-none absolute inset-0" />
      </div>

      {!soloFondo && (
        <section className="pointer-events-none relative z-10 mx-auto flex min-h-[46vh] max-w-6xl flex-wrap items-end justify-between gap-4 px-4 pb-4 pt-6">
          {enFoco && (
            <div
              className="vidrio pointer-events-auto w-full max-w-sm rounded-2xl border border-borde p-4"
              onMouseEnter={() => setPausa(true)}
              onMouseLeave={() => setPausa(false)}
            >
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-tenue">
                <span className={`punto-mini punto-${enFoco.color}`} />
                En foco · {(foco % puntos.length) + 1} de {puntos.length}
              </p>
              <h2 className="mt-1 text-2xl font-bold">{enFoco.titulo}</h2>
              <p className="text-sm text-tenue">{enFoco.subtitulo}</p>
              <p className={`mt-2 text-sm font-bold texto-${enFoco.color}`}>{enFoco.etiqueta}</p>
              {enFoco.bloqueos.length > 0 ? (
                <ul className="mt-1 space-y-0.5 text-sm">
                  {enFoco.bloqueos.slice(0, 3).map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm">Nada impide confirmar.</p>
              )}
              <Link href={enFoco.href} className="mt-3 inline-block text-sm font-semibold text-rosa-fuerte underline">
                Abrir expediente →
              </Link>
              <div className="mt-3 h-0.5 overflow-hidden rounded bg-gris-suave">
                <div key={`${enFoco.id}-${pausa}`} className={pausa ? "h-full w-full bg-rosa/40" : "barra-foco h-full bg-rosa"} />
              </div>
            </div>
          )}

          <div className="vidrio pointer-events-auto w-full max-w-sm rounded-2xl border border-borde p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-tenue">
              <span className="en-vivo" /> Actividad en vivo
            </p>
            <ol className="mt-2 max-h-44 space-y-2 overflow-hidden text-sm">
              {actividad.length === 0 && <li className="text-tenue">Sin movimientos todavía.</li>}
              {actividad.slice(0, 5).map((a) => (
                <li key={a.id} className="entrada-actividad">
                  <span className="font-semibold">{a.titulo}</span>
                  <span className="text-tenue"> · {a.hace}</span>
                  <span className="block truncate text-tenue">{a.detalle}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </>
  );
}
