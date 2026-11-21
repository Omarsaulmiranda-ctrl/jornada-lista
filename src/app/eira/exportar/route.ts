import { exigirEira } from "@/lib/sesion";
import { listarJornadas, quienDebe, resumir } from "@/lib/datos";
import { ETIQUETA_ESTADO } from "@/lib/plantillas";
import { hoy } from "@/lib/fechas";

// Exportación en formato abierto: una fila por requisito de cada jornada.
export async function GET() {
  const sesion = await exigirEira();
  const jornadas = await listarJornadas(sesion);
  const celda = (v: unknown) => {
    let t = String(v ?? "");
    if (/^[=+\-@]/.test(t)) t = `'${t}`; // evita que una hoja de cálculo lo interprete como fórmula
    return `"${t.replace(/"/g, '""')}"`;
  };
  const filas = [
    ["Municipio", "Colonia o localidad", "Sede", "Programa", "Fecha de la jornada", "Estado de la jornada",
      "Requisito", "Crítico", "Estado del requisito", "Fecha límite", "Le toca a", "Latitud", "Longitud"],
  ];
  for (const j of jornadas) {
    const r = resumir(j);
    for (const q of j.requisitos) {
      filas.push([
        j.municipio.nombre, j.colonia ?? "", j.sede, j.programa, j.fecha, r.etiqueta,
        q.titulo, q.critico ? "Sí" : "No", ETIQUETA_ESTADO[q.estado] ?? q.estado, q.fecha_limite,
        quienDebe(q) ?? "", String(j.lat ?? ""), String(j.lng ?? ""),
      ]);
    }
  }
  const csv = "\uFEFF" + filas.map((f) => f.map(celda).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="jornadas-${hoy()}.csv"`,
      "cache-control": "no-store",
    },
  });
}
