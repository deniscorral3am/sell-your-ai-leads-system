import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { leerConfig } from "./config";

let cache: { firma: string; cliente: SupabaseClient } | null = null;

// Cliente de Supabase con la clave secreta. Solo se usa en el servidor.
export function db(): SupabaseClient | null {
  const { url, clave } = leerConfig().supabase;
  if (!url || !clave) return null;
  const firma = `${url}|${clave}`;
  if (cache?.firma !== firma) {
    try {
      cache = { firma, cliente: createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } }) };
    } catch {
      return null;
    }
  }
  return cache.cliente;
}

export function exigirDb(): SupabaseClient {
  const c = db();
  if (!c) throw new Error("Primero conecta la base de datos en Conexiones.");
  return c;
}

export type EstadoDb = "sin_configurar" | "sin_tablas" | "error" | "lista";

export async function estadoDb(): Promise<{ estado: EstadoDb; detalle?: string }> {
  const c = db();
  if (!c) return { estado: "sin_configurar" };
  try {
    const { error } = await c.from("mensajes").select("personalizado").limit(1);
    if (!error) return { estado: "lista" };
    if (["PGRST205", "PGRST204", "42P01", "42703", "42501"].includes(error.code)) return { estado: "sin_tablas" };
    return { estado: "error", detalle: explicar(error.message) };
  } catch (e) {
    return { estado: "error", detalle: explicar(e instanceof Error ? e.message : "") };
  }
}

function explicar(m: string): string {
  if (/invalid api key|jwt/i.test(m)) return "Supabase no reconoce esa clave. Cópiala otra vez de API Keys → Secret keys.";
  if (/fetch failed|enotfound|invalid url/i.test(m))
    return "No llegamos a esa URL. Comprueba que es la de tu proyecto (acaba en .supabase.co) y que tienes internet.";
  return m || "No se ha podido conectar.";
}

// Devuelve los datos o lanza el error de Supabase.
export function filas<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message || "Error de base de datos.");
  return r.data as T;
}

export async function contar(q: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}
