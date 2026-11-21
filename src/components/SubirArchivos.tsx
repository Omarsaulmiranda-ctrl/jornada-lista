"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { prepararCarga, registrarArchivos } from "@/app/acciones";

const LADO_MAXIMO = 1600;

/** Reduce las fotos antes de subirlas: pesan menos y llegan aunque la conexión sea mala. */
async function comprimir(archivo: File): Promise<{ blob: Blob; tipo: string }> {
  if (!archivo.type.startsWith("image/")) return { blob: archivo, tipo: archivo.type };
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    const esPng = archivo.type === "image/png";
    const blob = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, esPng ? "image/png" : "image/jpeg", 0.82),
    );
    if (blob) return { blob, tipo: blob.type };
  } catch {
    // Si el navegador no puede procesarla, se sube tal cual.
  }
  return { blob: archivo, tipo: archivo.type };
}

export function SubirArchivos({
  requisitoId,
  hayVersionAnterior,
}: {
  requisitoId: string;
  hayVersionAnterior: boolean;
}) {
  const router = useRouter();
  const [archivos, setArchivos] = useState<File[]>([]);
  const [conservar, setConservar] = useState(true);
  const [nota, setNota] = useState("");
  const [estado, setEstado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ocupado = estado !== null;

  async function enviar() {
    setError(null);
    try {
      setEstado("Preparando archivos…");
      const listos = await Promise.all(archivos.map(comprimir));
      const preparada = await prepararCarga(
        requisitoId,
        archivos.map((a, i) => ({ nombre: a.name, tipo: listos[i].tipo, tamano: listos[i].blob.size })),
      );
      if (!preparada.ok) throw new Error(preparada.error);

      for (let i = 0; i < preparada.cargas.length; i++) {
        setEstado(`Subiendo ${i + 1} de ${preparada.cargas.length}…`);
        const respuesta = await fetch(preparada.cargas[i].url, {
          method: "PUT",
          headers: { "content-type": listos[i].tipo, "x-upsert": "false" },
          body: listos[i].blob,
        });
        if (!respuesta.ok) throw new Error(`No se pudo subir «${archivos[i].name}». Revise su conexión e intente de nuevo.`);
      }

      setEstado("Registrando la entrega…");
      const registro = await registrarArchivos(
        requisitoId,
        preparada.cargas.map((c) => ({ ruta: c.ruta, nombre: c.nombre })),
        hayVersionAnterior && conservar,
        nota,
      );
      if (!registro.ok) throw new Error(registro.error);
      setArchivos([]);
      setNota("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error. Intente de nuevo.");
    } finally {
      setEstado(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <label className="block">
        <span className="font-semibold">Elija fotos o archivos</span>
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          disabled={ocupado}
          onChange={(e) => setArchivos(Array.from(e.target.files ?? []))}
          className="mt-1 block w-full rounded-lg border border-dashed border-rosa bg-rosa-suave p-3 text-base file:mr-3 file:rounded-lg file:border-0 file:bg-rosa file:px-3 file:py-2 file:font-semibold file:text-white"
        />
      </label>
      {archivos.length > 0 && (
        <ul className="list-inside list-disc text-sm text-tenue">
          {archivos.map((a) => (
            <li key={a.name + a.size}>{a.name}</li>
          ))}
        </ul>
      )}
      {hayVersionAnterior && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={conservar} onChange={(e) => setConservar(e.target.checked)} className="mt-1 h-4 w-4" />
          <span>Conservar también los archivos de la versión anterior (solo agrego lo que faltaba).</span>
        </label>
      )}
      <label className="block text-sm">
        <span className="font-semibold">Nota para EIRA (opcional)</span>
        <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300} disabled={ocupado}
          className="mt-1 w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-base" />
      </label>
      <button
        type="button"
        onClick={enviar}
        disabled={ocupado || archivos.length === 0}
        className="inline-flex w-full items-center justify-center rounded-lg bg-rosa px-4 py-3 font-semibold text-white hover:bg-rosa-fuerte disabled:opacity-50 sm:w-auto"
      >
        {estado ?? `Enviar a EIRA${archivos.length ? ` (${archivos.length})` : ""}`}
      </button>
      {error && <p role="alert" className="rounded-lg bg-rojo-suave p-3 text-sm text-rojo">{error}</p>}
    </div>
  );
}
