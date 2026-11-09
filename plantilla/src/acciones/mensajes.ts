"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { leerConfig } from "@/lib/config";
import { enviadosHoy } from "@/lib/consultas";
import { enviarCorreo } from "@/lib/correo";
import { exigirDb, filas } from "@/lib/db";
import { bien, fallo, mal, texto } from "@/lib/formularios";
import type { Canal, MensajeConProspecto, Resultado } from "@/lib/tipos";
import { enviarWhatsApp, esNumero, estadoNumero, normalizarTelefono, respuestasRecibidas } from "@/lib/whatsapp";

const refrescar = () => revalidatePath("/", "layout");

export async function guardarPlantilla(_: Resultado, d: FormData): Promise<Resultado> {
  const canal = texto(d, "canal") as Canal;
  const cuerpo = texto(d, "texto");
  if (!cuerpo) return mal("La plantilla no puede quedar vacía.");
  try {
    filas(await exigirDb().from("plantillas").upsert({
      canal, asunto: canal === "correo" ? texto(d, "asunto") : null, texto: cuerpo, actualizado_en: new Date().toISOString(),
    }).select("canal"));
    refrescar();
    return bien("Plantilla guardada. Se usa en lo próximo que mandes a la cola.");
  } catch (e) {
    return fallo(e);
  }
}

// La etapa del prospecto sigue a sus mensajes (solo en las primeras etapas).
async function recolocar(c: SupabaseClient, prospectoId: string) {
  const estados = (filas(await c.from("mensajes").select("estado").eq("prospecto_id", prospectoId)) as { estado: string }[]).map((m) => m.estado);
  const etapa = estados.includes("enviado") ? "contactado"
    : estados.some((e) => ["pendiente", "enviando", "revisar"].includes(e)) ? "en_cola" : "nuevo";
  await c.from("prospectos").update({ etapa }).eq("id", prospectoId).in("etapa", ["nuevo", "en_cola", "contactado"]);
}

// Una sola acción por tarjeta: guardar, descartar o aprobar y enviar.
// Es el ÚNICO sitio del panel desde el que sale algo, y siempre tras tu clic.
export async function accionMensaje(_: Resultado, d: FormData): Promise<Resultado> {
  const id = texto(d, "id");
  const que = texto(d, "que");
  try {
    const c = exigirDb();
    const m = filas(await c.from("mensajes").select("*, prospectos(nombre, telefono, email, web, ciudad, gancho)").eq("id", id).maybeSingle()) as MensajeConProspecto | null;
    if (!m || !["pendiente", "revisar"].includes(m.estado)) return mal("Ese mensaje ya no está en la cola.");

    const cuerpo = texto(d, "texto");
    const asunto = d.has("asunto") ? texto(d, "asunto") : m.asunto;
    if (!cuerpo) return mal("El mensaje no puede quedar vacío.");

    if (que === "guardar") {
      filas(await c.from("mensajes").update({ texto: cuerpo, asunto }).eq("id", id).select("id"));
      refrescar();
      return bien("Cambios guardados.");
    }
    if (que === "descartar") {
      filas(await c.from("mensajes").update({ estado: "descartado" }).eq("id", id).select("id"));
      await recolocar(c, m.prospecto_id);
      refrescar();
      return bien("Descartado.");
    }
    if (que === "ya_salio") {
      // Para los dudosos: lo has mirado en el móvil y sí salió.
      filas(await c.from("mensajes").update({ estado: "enviado", error: null, enviado_en: new Date().toISOString() }).eq("id", id).select("id"));
      await recolocar(c, m.prospecto_id);
      refrescar();
      return bien("Marcado como enviado.");
    }
    if (que !== "enviar") return mal("Acción no válida.");
    if (m.estado === "revisar") return mal("Este quedó dudoso. Mira en el móvil si salió: márcalo como enviado o descártalo.");

    const config = leerConfig();
    let numero: number | null = null;
    let telefono = "";
    if (m.canal === "whatsapp") {
      if (!config.whatsapp.aceptoRiesgo) return mal("Antes acepta el aviso de riesgo en Conexiones → WhatsApp.");
      numero = Number(texto(d, "numero"));
      if (!esNumero(numero)) return mal("Elige desde qué número sale.");
      if ((await estadoNumero(numero)).conexion !== "conectado") return mal("Ese número no está conectado.");
      telefono = normalizarTelefono(m.prospectos?.telefono, config.negocio.prefijoPais) ?? "";
      if (!telefono) return mal("El teléfono no es válido. Descarta este mensaje o corrige el teléfono del negocio.");
      if ((await enviadosHoy(c, "whatsapp", numero)) >= config.whatsapp.topePorNumero)
        return mal(`Ese número ya ha llegado al tope de hoy (${config.whatsapp.topePorNumero}). Usa otro o sigue mañana.`);
    } else {
      if (!config.correo.usuario || !config.correo.clave) return mal("Primero conecta tu correo en Conexiones.");
      if (!m.prospectos?.email) return mal("Este negocio no tiene email.");
      if ((await enviadosHoy(c, "correo")) >= config.correo.topeDiario)
        return mal(`Ya has llegado al tope de hoy (${config.correo.topeDiario} correos). Sigue mañana.`);
    }

    // Reservar: si alguien pulsa dos veces, el segundo clic no pasa.
    const reservado = filas(await c.from("mensajes").update({ estado: "enviando", texto: cuerpo, asunto }).eq("id", id).eq("estado", "pendiente").select("id")) as { id: string }[];
    if (reservado.length === 0) return mal("Ese mensaje ya se está enviando.");

    const envio = m.canal === "whatsapp"
      ? await enviarWhatsApp(numero as 1 | 2 | 3, telefono, cuerpo, id)
      : await enviarCorreo(config.correo, { para: m.prospectos!.email!, asunto: asunto || "(sin asunto)", texto: cuerpo });

    if (envio.ok) {
      await c.from("mensajes").update({ estado: "enviado", numero, error: null, enviado_en: new Date().toISOString() }).eq("id", id);
    } else {
      // Si no sabemos si salió, queda en «revisar»: nadie lo reenvía sin mirar.
      const dudoso = "dudoso" in envio && envio.dudoso;
      await c.from("mensajes").update({ estado: dudoso ? "revisar" : "pendiente", numero, error: envio.error }).eq("id", id);
    }
    await recolocar(c, m.prospecto_id);
    refrescar();
    return envio.ok ? bien(`Enviado a ${m.prospectos?.nombre ?? "el negocio"}.`) : mal(envio.error);
  } catch (e) {
    return fallo(e);
  }
}

// Mira quién te ha contestado por WhatsApp y lo pasa a «Ha respondido».
export async function comprobarRespuestas(): Promise<Resultado> {
  try {
    const c = exigirDb();
    const recibidas = await respuestasRecibidas();
    const { prefijoPais } = leerConfig().negocio;
    const contactados = filas(await c.from("prospectos").select("id, telefono").eq("etapa", "contactado").not("telefono", "is", null)) as { id: string; telefono: string }[];
    let n = 0;
    for (const p of contactados) {
      const tel = normalizarTelefono(p.telefono, prefijoPais);
      const ts = tel ? recibidas[tel] : undefined;
      if (!ts) continue;
      // Solo cuenta si escribió DESPUÉS de tu primer mensaje.
      const [primero] = filas(await c.from("mensajes").select("enviado_en").eq("prospecto_id", p.id).eq("estado", "enviado").order("enviado_en").limit(1)) as { enviado_en: string }[];
      if (!primero || new Date(primero.enviado_en).getTime() > ts) continue;
      await c.from("prospectos").update({ etapa: "respondio", respondio_en: new Date(ts).toISOString() }).eq("id", p.id);
      n++;
    }
    refrescar();
    return n ? bien(`${n} ${n === 1 ? "negocio te ha" : "negocios te han"} contestado. Los tienes en el CRM.`) : bien("Nadie nuevo ha contestado todavía.");
  } catch (e) {
    return fallo(e);
  }
}

export async function comprobarRespuestasForm(_: Resultado, _d: FormData): Promise<Resultado> {
  void _d;
  return comprobarRespuestas();
}
