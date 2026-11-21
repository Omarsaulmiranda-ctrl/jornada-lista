// Las fechas se manejan como texto AAAA-MM-DD y "hoy" siempre es el día en Ciudad de México,
// sin importar la zona horaria del servidor.

const ZONA = "America/Mexico_City";

export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
}

function aUTC(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUTC(hasta) - aUTC(desde)) / 86_400_000);
}

export function sumarDias(fecha: string, dias: number): string {
  return new Date(aUTC(fecha) + dias * 86_400_000).toISOString().slice(0, 10);
}

export function fechaLarga(fecha: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(aUTC(fecha)));
}

export function fechaCorta(fecha: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(new Date(aUTC(fecha)));
}

export function fechaHora(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function plazo(fechaLimite: string): string {
  const d = diasEntre(hoy(), fechaLimite);
  if (d < 0) return `venció hace ${-d} ${-d === 1 ? "día" : "días"}`;
  if (d === 0) return "vence hoy";
  return `vence en ${d} ${d === 1 ? "día" : "días"}`;
}
