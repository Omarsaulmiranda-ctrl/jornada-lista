import { baseConfigurada, db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function estadoDeLaBase(): Promise<{ ok: boolean; texto: string }> {
  if (!baseConfigurada()) {
    return { ok: false, texto: "Base de datos sin configurar (falta .env.local)" };
  }
  const { count, error } = await db()
    .from("jornadas")
    .select("id", { count: "exact", head: true });
  if (error) return { ok: false, texto: `Error de conexión: ${error.message}` };
  return { ok: true, texto: `Base de datos conectada · ${count ?? 0} jornadas` };
}

export default async function Portada() {
  const base = await estadoDeLaBase();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-rosa">
        EIRA Movimiento Rosa · Reto 2
      </p>
      <h1 className="mt-2 text-4xl font-bold">Jornada Lista</h1>
      <p className="mt-4 text-lg text-tenue">
        El expediente compartido entre EIRA y cada municipio. Una jornada no se
        confirma hasta que lo crítico está aprobado, y siempre se ve quién debe qué.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-borde bg-superficie p-5">
          <h2 className="text-lg font-semibold">Coordinación de EIRA</h2>
          <p className="mt-1 text-tenue">
            Crea jornadas, revisa lo que entrega cada municipio y ve qué impide
            avanzar.
          </p>
          <p className="mt-4 text-sm text-tenue">Acceso en construcción.</p>
        </section>
        <section className="rounded-xl border border-borde bg-superficie p-5">
          <h2 className="text-lg font-semibold">Enlace municipal</h2>
          <p className="mt-1 text-tenue">
            Ve su lista de requisitos, llena la carta compromiso y sube sus
            documentos desde el celular.
          </p>
          <p className="mt-4 text-sm text-tenue">Acceso en construcción.</p>
        </section>
      </div>

      <p
        className={`mt-8 inline-block rounded-full px-3 py-1 text-sm ${
          base.ok ? "bg-verde-suave text-verde" : "bg-ambar-suave text-ambar"
        }`}
      >
        {base.texto}
      </p>
    </main>
  );
}
