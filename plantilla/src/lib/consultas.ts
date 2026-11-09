import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { inicioDeHoy } from "./fechas";
import { contar, filas } from "./db";
import type { Canal, MensajeConProspecto } from "./tipos";

export function enviadosHoy(c: SupabaseClient, canal: Canal, numero?: number): Promise<number> {
  let q = c.from("mensajes").select("id", { count: "exact", head: true })
    .eq("canal", canal).eq("estado", "enviado").gte("enviado_en", inicioDeHoy());
  if (numero) q = q.eq("numero", numero);
  return contar(q);
}

export async function cola(c: SupabaseClient, canal: Canal): Promise<MensajeConProspecto[]> {
  return filas(
    await c.from("mensajes")
      .select("*, prospectos(nombre, telefono, email, web, ciudad, gancho)")
      .eq("canal", canal).in("estado", ["pendiente", "revisar"])
      .order("creado_en").limit(100),
  ) as MensajeConProspecto[];
}
