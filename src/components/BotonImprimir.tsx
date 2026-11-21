"use client";

export function BotonImprimir({ texto = "Imprimir o guardar como PDF" }: { texto?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center rounded-lg bg-rosa px-5 py-2.5 font-bold text-white hover:bg-vino"
    >
      {texto}
    </button>
  );
}
