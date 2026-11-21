import Link from "next/link";
import { resumir, type Jornada } from "@/lib/datos";
import { fechaCorta, fechaLarga, plazo } from "@/lib/fechas";
import { Semaforo, tarjeta } from "./ui";

export function TarjetaJornada({ jornada, vista }: { jornada: Jornada; vista: "eira" | "municipio" }) {
  const r = resumir(jornada);
  const dias = r.diasParaJornada;
  return (
    <Link href={`/j/${jornada.id}`} className={`${tarjeta} block hover:border-rosa`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-xl font-semibold">
            {vista === "eira" ? jornada.municipio.nombre : jornada.programa}
          </h3>
          <p className="text-tenue">
            {vista === "eira" ? `${jornada.programa} · ` : ""}
            {jornada.sede} · {fechaLarga(jornada.fecha)}
            {dias >= 0 ? ` (faltan ${dias} días)` : ""}
          </p>
        </div>
        <Semaforo resumen={r} />
      </div>

      <p className="mt-3 text-sm text-tenue">
        {r.aprobados} de {r.total} requisitos aprobados
      </p>

      {r.bloqueos.length > 0 ? (
        <div className="mt-2">
          <p className="text-sm font-semibold">Impide confirmar:</p>
          <ul className="mt-1 space-y-1 text-sm">
            {r.bloqueos.map((b) => (
              <li key={b.requisito.id} className="flex flex-wrap gap-x-2">
                <span className={`font-semibold ${b.debe === "EIRA" ? "text-ambar" : "text-rosa-fuerte"}`}>
                  {vista === "municipio" && b.debe === "Municipio" ? "Le toca a usted" : `${b.debe} debe`} {b.accion}:
                </span>
                <span>{b.requisito.titulo.toLowerCase()}</span>
                <span className={b.vencido ? "font-semibold text-rojo" : "text-tenue"}>
                  ({fechaCorta(b.requisito.fecha_limite)}, {plazo(b.requisito.fecha_limite)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        jornada.estado !== "confirmada" && (
          <p className="mt-2 text-sm font-semibold text-verde">
            Todo lo crítico está aprobado.{vista === "eira" ? " Falta la confirmación final de EIRA." : ""}
          </p>
        )
      )}
    </Link>
  );
}
