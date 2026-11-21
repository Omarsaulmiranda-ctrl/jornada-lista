"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { LayerGroup, Map as MapaLeaflet } from "leaflet";
import { enlaceMaps } from "@/lib/mapas";

export type PuntoMapa = {
  id: string;
  lat: number;
  lng: number;
  titulo: string;
  subtitulo: string;
  etiqueta: string;
  color: "verde" | "ambar" | "rojo";
  bloqueos: string[];
  href: string;
};

const COLOR = { verde: "#6f9c76", ambar: "#d9a21b", rojo: "#a12525" };
export const MOSAICOS = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const ATRIBUCION = '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function linea(texto: string, clase = ""): HTMLElement {
  const p = document.createElement("p");
  p.textContent = texto; // textContent: nada de lo que venga de la base se interpreta como HTML
  p.style.margin = "2px 0";
  if (clase) p.style.cssText += clase;
  return p;
}

export function MapaJornadas({ puntos, compacto = false }: { puntos: PuntoMapa[]; compacto?: boolean }) {
  const caja = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const capa = useRef<LayerGroup | null>(null);
  const encuadrado = useRef("");
  const firma = JSON.stringify(puntos);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !caja.current) return;
      if (!mapa.current) {
        mapa.current = L.map(caja.current, { scrollWheelZoom: false }).setView([19.85, -103.6], 9);
        L.tileLayer(MOSAICOS, { attribution: ATRIBUCION, maxZoom: 18 }).addTo(mapa.current);
        capa.current = L.layerGroup().addTo(mapa.current);
      }
      capa.current!.clearLayers();
      const lista = JSON.parse(firma) as PuntoMapa[];
      for (const p of lista) {
        const globo = document.createElement("div");
        globo.style.minWidth = "200px";
        globo.append(
          linea(p.titulo, "font-weight:700;font-size:15px;"),
          linea(p.subtitulo, "color:#6b6b6b;"),
          linea(p.etiqueta, `font-weight:700;color:${COLOR[p.color]};`),
        );
        if (p.bloqueos.length) {
          globo.append(linea("Impide confirmar:", "font-weight:600;margin-top:6px;"));
          for (const b of p.bloqueos) globo.append(linea(`• ${b}`));
        }
        const enlace = document.createElement("a");
        enlace.href = p.href;
        enlace.textContent = "Abrir expediente →";
        enlace.style.cssText = "display:inline-block;margin-top:6px;font-weight:600;color:#b7426c;";
        const maps = document.createElement("a");
        maps.href = enlaceMaps(p.lat, p.lng);
        maps.target = "_blank";
        maps.rel = "noopener noreferrer";
        maps.textContent = "Abrir en Google Maps";
        maps.style.cssText = "display:inline-block;margin-top:6px;margin-left:12px;font-weight:600;color:#7d3b3b;";
        globo.append(enlace, maps);

        L.circleMarker([p.lat, p.lng], {
          radius: 11,
          color: "#ffffff",
          weight: 2,
          fillColor: COLOR[p.color],
          fillOpacity: 0.95,
        })
          .bindPopup(globo)
          .bindTooltip(p.titulo)
          .addTo(capa.current!);
      }
      // Solo se reencuadra cuando cambia el conjunto de puntos, no en cada refresco.
      const llave = lista.map((p) => p.id).join(",");
      if (lista.length && llave !== encuadrado.current) {
        encuadrado.current = llave;
        mapa.current.fitBounds(L.latLngBounds(lista.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: lista.length === 1 ? 14 : 12 });
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [firma]);

  useEffect(
    () => () => {
      mapa.current?.remove();
      mapa.current = null;
    },
    [],
  );

  return (
    <div>
      <div ref={caja} className={`${compacto ? "h-52" : "h-80 lg:h-[28rem]"} w-full overflow-hidden rounded-xl border border-borde`} role="application" aria-label="Mapa de jornadas" />
      <p className={`mt-1 flex-wrap gap-x-4 text-sm text-tenue ${compacto ? "hidden" : "flex"}`}>
        <span><span className="mr-1 inline-block h-3 w-3 rounded-full bg-rojo" />Atrasada</span>
        <span><span className="mr-1 inline-block h-3 w-3 rounded-full" style={{ background: COLOR.ambar }} />En preparación o con observaciones</span>
        <span><span className="mr-1 inline-block h-3 w-3 rounded-full bg-verde-marca" />Lista o confirmada</span>
        <span>Lugares reales; jornadas ficticias de demostración.</span>
      </p>
    </div>
  );
}
