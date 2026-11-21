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
        <button onClick={reset} className="rounded-lg bg-rosa px-5 py-2.5 font-bold text-white hover:bg-vino">
          Volver a intentar
        </button>
        <Link href="/" className="rounded-lg border border-rosa/40 bg-superficie px-5 py-2 font-bold text-vino hover:bg-rosa-suave">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
