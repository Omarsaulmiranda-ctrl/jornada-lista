"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { CircleMarker, Map as MapaLeaflet } from "leaflet";
import { buscarLugar, coloniasPorCP, type Lugar } from "@/app/acciones";
import { ATRIBUCION, MOSAICOS } from "./MapaJornadas";

const campo =
  "mt-1 w-full rounded-lg border border-borde bg-superficie px-3 py-2.5 text-base outline-none focus:border-rosa focus:ring-2 focus:ring-rosa-suave";
const botonChico =
  "inline-flex items-center justify-center rounded-lg border border-borde bg-superficie px-3 py-2.5 font-semibold hover:bg-rosa-suave disabled:opacity-50";

/** Ubica la jornada en un lugar real: busca la localidad o colonia y permite afinar el punto en el mapa. */
export function ElegirUbicacion() {
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<Lugar[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [ubicacion, setUbicacion] = useState("");
  const [colonia, setColonia] = useState("");
  const [cp, setCp] = useState("");
  const [colonias, setColonias] = useState<string[] | null>(null);

  const caja = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const marca = useRef<CircleMarker | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !caja.current || mapa.current) return;
      mapa.current = L.map(caja.current, { scrollWheelZoom: false }).setView([19.85, -103.6], 9);
      L.tileLayer(MOSAICOS, { attribution: ATRIBUCION, maxZoom: 18 }).addTo(mapa.current);
      // Tocar el mapa mueve el punto: así se marca la sede exacta aunque la colonia no esté en el buscador.
      mapa.current.on("click", (e) => setPunto({ lat: e.latlng.lat, lng: e.latlng.lng }));
    })();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
      marca.current = null;
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (!mapa.current || !punto) return;
      const L = (await import("leaflet")).default;
      if (!marca.current) {
        marca.current = L.circleMarker([punto.lat, punto.lng], {
          radius: 11, color: "#ffffff", weight: 2, fillColor: "#b8336a", fillOpacity: 0.95,
        }).addTo(mapa.current);
      } else {
        marca.current.setLatLng([punto.lat, punto.lng]);
      }
    })();
  }, [punto]);

  async function buscar() {
    setBuscando(true);
    setResultados(await buscarLugar(consulta));
    setBuscando(false);
  }

  function elegir(l: Lugar) {
    setPunto({ lat: l.lat, lng: l.lng });
    setUbicacion(l.detalle);
    if (!colonia) setColonia(l.nombre);
    setResultados(null);
    mapa.current?.setView([l.lat, l.lng], 14);
  }

  async function verColonias() {
    setColonias(await coloniasPorCP(cp));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="lat" value={punto?.lat ?? ""} />
      <input type="hidden" name="lng" value={punto?.lng ?? ""} />
      <input type="hidden" name="ubicacion" value={ubicacion} />

      <div>
        <label className="block font-semibold" htmlFor="buscar-lugar">Buscar la localidad o colonia</label>
        <div className="mt-1 flex gap-2">
          <input
            id="buscar-lugar"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                buscar();
              }
            }}
            placeholder="Por ejemplo: Usmajac, Sayula"
            className={campo.replace("mt-1 ", "")}
          />
          <button type="button" onClick={buscar} disabled={buscando || consulta.trim().length < 3} className={botonChico}>
            {buscando ? "Buscando…" : "Buscar"}
          </button>
        </div>
        {resultados && (
          <ul className="mt-2 divide-y divide-borde rounded-lg border border-borde bg-superficie">
            {resultados.length === 0 && (
              <li className="p-3 text-sm text-tenue">
                Sin resultados. Pruebe con la localidad y el municipio, y después toque el mapa para marcar el punto exacto.
              </li>
            )}
            {resultados.map((l) => (
              <li key={`${l.lat},${l.lng}`}>
                <button type="button" onClick={() => elegir(l)} className="block w-full p-3 text-left text-sm hover:bg-rosa-suave">
                  <span className="font-semibold">{l.nombre}</span>
                  <span className="block text-tenue">{l.detalle}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div ref={caja} className="h-64 w-full overflow-hidden rounded-xl border border-borde" role="application" aria-label="Mapa para ubicar la sede" />
      <p className="text-sm text-tenue">
        {punto
          ? `Punto marcado: ${punto.lat.toFixed(5)}, ${punto.lng.toFixed(5)}. Toque el mapa para afinarlo.`
          : "Busque el lugar o toque el mapa para marcar dónde será la jornada."}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="font-semibold">Colonia o localidad</span>
          <input name="colonia" value={colonia} onChange={(e) => setColonia(e.target.value)} maxLength={120} className={campo} />
        </label>
        <div>
          <label className="block font-semibold" htmlFor="cp">Código postal (opcional)</label>
          <div className="mt-1 flex gap-2">
            <input id="cp" value={cp} onChange={(e) => setCp(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric"
              placeholder="49340" className={campo.replace("mt-1 ", "")} />
            <button type="button" onClick={verColonias} disabled={cp.length !== 5} className={`${botonChico} whitespace-nowrap`}>Ver colonias</button>
          </div>
        </div>
      </div>
      {colonias && (
        colonias.length === 0 ? (
          <p className="text-sm text-tenue">No se encontraron colonias para ese código postal.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {colonias.map((c) => (
              <button type="button" key={c} onClick={() => setColonia(c)}
                className={`rounded-full border px-3 py-1 text-sm ${c === colonia ? "border-rosa bg-rosa-suave font-semibold" : "border-borde bg-superficie hover:bg-rosa-suave"}`}>
                {c}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}
