// Todo en hora de España.
const ZONA = "Europe/Madrid";

export function hoyISO(fecha = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(fecha); // AAAA-MM-DD
}

// Instante en que empezó hoy en España, para contar los envíos del día.
export function inicioDeHoy(): string {
  const ahora = new Date();
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONA, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(ahora).map((x) => [x.type, Number(x.value)]),
  );
  const desfase = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ahora.getTime() / 1000) * 1000;
  return new Date(Date.UTC(p.year, p.month - 1, p.day) - desfase).toISOString();
}

// Lunes de la semana de una fecha (AAAA-MM-DD).
export function lunesDe(fechaISO: string): string {
  const d = new Date(`${fechaISO}T12:00:00Z`);
  const dia = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dia);
  return d.toISOString().slice(0, 10);
}

export function sumarDias(fechaISO: string, dias: number): string {
  const d = new Date(`${fechaISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function fechaLarga(fechaISO: string): string {
  return new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(`${fechaISO}T12:00:00Z`));
}

export function haceCuanto(iso: string | null): string {
  if (!iso) return "";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

export function saludo(): string {
  const h = Number(new Intl.DateTimeFormat("es-ES", { hour: "numeric", hour12: false, timeZone: ZONA }).format(new Date()));
  return h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
}

export const euros = (n: number, moneda = "EUR") =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: moneda, maximumFractionDigits: Number.isInteger(n) || Math.abs(n) >= 100 ? 0 : 2 }).format(n);
