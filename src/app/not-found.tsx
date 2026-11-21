import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">No encontramos esa página</h1>
      <p className="mt-3 text-tenue">
        Puede que el expediente ya no exista o que no tenga permiso para verlo.
      </p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-rosa px-5 py-2.5 font-bold text-white hover:bg-vino">
        Ir al inicio
      </Link>
    </main>
  );
}
