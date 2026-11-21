import { redirect } from "next/navigation";
import { entrarComoEira, entrarComoMunicipio } from "./acciones";
import { leerSesion } from "@/lib/sesion";
import { baseConfigurada } from "@/lib/supabase";
import { ENLACES_DEMO } from "@/lib/operaciones";
import { boton, botonSecundario, tarjeta } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Portada({ searchParams }: PageProps<"/">) {
  const sesion = baseConfigurada() ? await leerSesion() : null;
  if (sesion) redirect(sesion.rol === "eira" ? "/eira" : "/municipio");
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-rosa">
        EIRA Movimiento Rosa · Reto 2
      </p>
      <h1 className="mt-2 text-4xl font-bold">Jornada Lista</h1>
      <p className="mt-4 text-lg text-tenue">
        El expediente compartido entre EIRA y cada municipio. Una jornada no se
        confirma hasta que lo crítico está aprobado, y siempre se ve quién debe qué.
      </p>

      {!baseConfigurada() && (
        <p className="mt-6 rounded-lg bg-ambar-suave p-3 text-ambar">
          Falta configurar la base de datos. Revise el archivo README.
        </p>
      )}
      {error === "enlace" && (
        <p role="alert" className="mt-6 rounded-lg bg-rojo-suave p-3 text-rojo">
          Ese enlace no es válido o ya no está vigente. Pida uno nuevo a la coordinación de EIRA.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className={tarjeta}>
          <h2 className="text-xl font-semibold">Coordinación de EIRA</h2>
          <p className="mt-1 text-tenue">
            Crea jornadas, revisa lo que entrega cada municipio y ve qué impide avanzar.
          </p>
          <form action={entrarComoEira} className="mt-4">
            <button className={`${boton} w-full`}>Entrar como EIRA</button>
          </form>
        </section>

        <section className={tarjeta}>
          <h2 className="text-xl font-semibold">Enlace municipal</h2>
          <p className="mt-1 text-tenue">
            Ve su lista de requisitos, llena la carta y sube sus documentos desde el celular.
          </p>
          <div className="mt-4 space-y-2">
            {ENLACES_DEMO.map((e, i) => (
              <form action={entrarComoMunicipio} key={e.token}>
                <input type="hidden" name="token" value={e.token} />
                <button className={`${i === 0 ? boton : botonSecundario} w-full`}>
                  Entrar como {e.municipio}
                </button>
              </form>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-8 text-sm text-tenue">
        Accesos de demostración. En un piloto, cada enlace municipal recibe por WhatsApp
        un enlace privado y la coordinación de EIRA entra con su cuenta institucional.
      </p>
    </main>
  );
}
