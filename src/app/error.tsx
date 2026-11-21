"use client";

import Link from "next/link";

export default function ErrorDePagina({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">No se pudo completar la acción</h1>
      <p className="mt-3 text-tenue">
        No se guardó ningún cambio a medias. Revise los datos (por ejemplo, que la fecha sea
        posterior a hoy y que no falte ningún campo) y vuelva a intentarlo.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="rounded-lg bg-rosa px-4 py-2.5 font-semibold text-white hover:bg-rosa-fuerte">
          Volver a intentar
        </button>
        <Link href="/" className="rounded-lg border border-borde bg-superficie px-4 py-2.5 font-semibold hover:bg-rosa-suave">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
