"use client";

export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center rounded-lg bg-rosa px-4 py-2.5 font-semibold text-white hover:bg-rosa-fuerte"
    >
      Imprimir o guardar como PDF
    </button>
  );
}
