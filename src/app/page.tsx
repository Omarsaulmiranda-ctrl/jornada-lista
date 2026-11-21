import { entrarComoEira, entrarComoMunicipio } from "./acciones";
import { baseConfigurada } from "@/lib/supabase";
import { puntosPublicos } from "@/lib/datos";
import { ENLACES_DEMO } from "@/lib/operaciones";
import { Monitor } from "@/components/Monitor";
import { boton, botonSecundario } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Portada({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const puntos = baseConfigurada() ? await puntosPublicos().catch(() => []) : [];

  return (
    <div className="tema-oscuro">
      <Monitor
        soloFondo
        puntos={puntos.map((p) => ({ ...p, titulo: "", subtitulo: "", etiqueta: "", bloqueos: [], href: "/" }))}
      />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-tenue">
          <span className="en-vivo" /> EIRA Movimiento Rosa · Reto 2
        </p>
        <h1 className="mt-2 text-5xl font-bold sm:text-6xl">Jornada Lista</h1>
        <p className="mt-4 max-w-2xl text-lg text-tenue">
          El expediente compartido entre EIRA y cada municipio. Una jornada no se confirma hasta que
          lo crítico está aprobado, y siempre se ve quién debe qué.
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
          <section className="vidrio rounded-2xl border border-borde bg-superficie p-5">
            <h2 className="text-xl font-semibold">Coordinación de EIRA</h2>
            <p className="mt-1 text-tenue">
              Monitorea todas las jornadas, revisa lo que entrega cada municipio y ve qué impide avanzar.
            </p>
            <form action={entrarComoEira} className="mt-4">
              <button className={`${boton} w-full`}>Entrar como EIRA</button>
            </form>
          </section>

          <section className="vidrio rounded-2xl border border-borde bg-superficie p-5">
            <h2 className="text-xl font-semibold">Enlace municipal</h2>
            <p className="mt-1 text-tenue">
              Ve su lista de requisitos, llena la carta y sube sus documentos desde el celular.
            </p>
            <form action={entrarComoMunicipio} className="mt-4 flex flex-col gap-2">
              <label className="text-sm font-semibold" htmlFor="municipio">Municipio</label>
              <select id="municipio" name="token" defaultValue={ENLACES_DEMO[0].token}
                className="w-full rounded-lg border border-borde px-3 py-2.5 text-base">
                {ENLACES_DEMO.map((e) => (
                  <option key={e.token} value={e.token}>{e.municipio}</option>
                ))}
              </select>
              <button className={`${botonSecundario} w-full`}>Entrar como enlace municipal</button>
            </form>
          </section>
        </div>

        <p className="mt-8 max-w-2xl text-sm text-tenue">
          Accesos de demostración. Cada punto del mapa es una jornada ficticia en una localidad real del sur de
          Jalisco. En un piloto, cada enlace recibe por WhatsApp su enlace privado y EIRA entra con su cuenta institucional.
        </p>
      </main>
    </div>
  );
}
