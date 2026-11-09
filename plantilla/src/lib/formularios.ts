import type { Resultado } from "./tipos";

export const texto = (d: FormData, campo: string) => String(d.get(campo) ?? "").trim();
export const numero = (d: FormData, campo: string) => {
  const v = texto(d, campo).replace(",", ".");
  return v === "" || Number.isNaN(Number(v)) ? null : Number(v);
};
export const bien = (mensaje: string): Resultado => ({ ok: true, mensaje });
export const mal = (mensaje: string): Resultado => ({ ok: false, mensaje });
export const fallo = (e: unknown): Resultado =>
  mal(e instanceof Error ? traducir(e.message) : "Algo ha fallado. Vuelve a intentarlo.");

// Errores típicos de la base, en cristiano.
function traducir(m: string): string {
  if (/permission denied/i.test(m)) return "La base no da permiso. Lanza /conectar en Claude Code para arreglar las tablas.";
  if (/schema cache|does not exist|PGRST205/i.test(m)) return "Faltan tablas en la base. Lanza /conectar en Claude Code.";
  if (/fetch failed/i.test(m)) return "No hay conexión con la base. Revisa tu internet.";
  return m;
}
