import { entrarComoEira, entrarComoMunicipio } from "./acciones";
import { baseConfigurada } from "@/lib/supabase";
import { Marca, ModoDemo, boton, campo, tarjeta } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Portada({ searchParams }: PageProps<"/">) {
  const { error } = await searchParams;

  return (
    <>
      <header className="border-b border-borde bg-superficie">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Marca />
          <ModoDemo />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rosa">EIRA Movimiento Rosa A.C.</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Expediente de jornadas</h1>
        <p className="mt-2 max-w-2xl text-lg text-tenue">
          Qué impide confirmar cada jornada y a quién le toca resolverlo, visto por EIRA y por el municipio.
        </p>

        {!baseConfigurada() && (
          <p className="mt-6 rounded-lg bg-ambar-suave p-3 text-ambar">
            Falta configurar la base de datos. Revise el archivo README.
          </p>
        )}
        {error === "contrasena" && (
          <p role="alert" className="mt-6 rounded-lg bg-rojo-suave p-3 text-rojo">
            La contraseña de coordinación no es correcta.
          </p>
        )}
        {error === "codigo" && (
          <p role="alert" className="mt-6 rounded-lg bg-rojo-suave p-3 text-rojo">
            Ese código de acceso no es válido. Revise el mensaje de WhatsApp que le envió EIRA.
          </p>
        )}
        {error === "enlace" && (
          <p role="alert" className="mt-6 rounded-lg bg-rojo-suave p-3 text-rojo">
            Ese enlace no es válido o ya no está vigente. Pida uno nuevo a la coordinación de EIRA.
          </p>
        )}

        <section className="mt-8 rounded-xl border-2 border-dashed border-ambar/50 bg-superficie p-4 sm:p-5" aria-labelledby="titulo-demo">
          <div className="flex flex-wrap items-center gap-2">
            <ModoDemo />
            <h2 id="titulo-demo" className="text-xl font-extrabold">Elija con qué papel entrar</h2>
          </div>
          <p className="mt-1 text-sm text-tenue">
            Datos ficticios y credenciales de prueba, que se entregan junto con la demo. Cada municipio solo ve
            sus propias jornadas.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className={tarjeta}>
              <h3 className="text-lg font-extrabold">Coordinación de EIRA</h3>
              <p className="mt-1 text-sm text-tenue">
                Crea jornadas, genera la carta y revisa lo que entrega cada municipio.
              </p>
              <form action={entrarComoEira} className="mt-4">
                <label htmlFor="contrasena" className="text-sm font-semibold">Contraseña de coordinación</label>
                <input id="contrasena" name="contrasena" type="password" required autoComplete="current-password" className={campo} />
                <button className={`${boton} mt-3 w-full`}>Entrar como EIRA</button>
              </form>
            </div>

            <div className={tarjeta}>
              <h3 className="text-lg font-extrabold">Enlace municipal</h3>
              <p className="mt-1 text-sm text-tenue">
                Ve qué le falta entregar y sube sus documentos desde el celular.
              </p>
              <form action={entrarComoMunicipio} className="mt-4">
                <label htmlFor="codigo" className="text-sm font-semibold">Código de acceso</label>
                <input id="codigo" name="codigo" required autoComplete="off" autoCapitalize="none" spellCheck={false} className={campo} />
                <button className={`${boton} mt-3 w-full`}>Entrar como enlace municipal</button>
              </form>
              <p className="mt-2 text-xs text-tenue">
                También puede abrir directamente el enlace privado que EIRA le envía por WhatsApp.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
