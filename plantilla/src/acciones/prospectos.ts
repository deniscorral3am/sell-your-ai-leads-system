"use server";

import { revalidatePath } from "next/cache";
import { buscarNegocios } from "@/lib/apify";
import { leerConfig } from "@/lib/config";
import { exigirDb, filas } from "@/lib/db";
import { bien, fallo, mal, numero, texto } from "@/lib/formularios";
import { calcularGancho, rellenar } from "@/lib/gancho";
import type { Canal, Etapa, Plantilla, Prospecto, Resultado } from "@/lib/tipos";
import { ETAPAS } from "@/lib/tipos";

const refrescar = () => revalidatePath("/", "layout");

export async function buscar(_: Resultado, d: FormData): Promise<Resultado> {
  const categoria = texto(d, "categoria");
  const ciudad = texto(d, "ciudad");
  const cantidad = Math.min(200, Math.max(5, numero(d, "cantidad") ?? 30));
  if (!categoria || !ciudad) return mal("Dime qué tipo de negocio y en qué ciudad.");
  const { token } = leerConfig().apify;
  if (!token) return mal("Primero conecta Apify en Conexiones.");
  try {
    const negocios = await buscarNegocios({ token, categoria, ciudad, cantidad, conEmails: d.get("emails") === "si" });
    if (negocios.length === 0) return mal("No ha salido ningún negocio. Prueba otra palabra o una ciudad más grande.");
    const busqueda = `${categoria} · ${ciudad}`;
    const nuevos = filas(
      await exigirDb()
        .from("prospectos")
        .upsert(negocios.map((n) => ({ ...n, gancho: calcularGancho(n), busqueda })), { onConflict: "place_id", ignoreDuplicates: true })
        .select("id"),
    ) as { id: string }[];
    refrescar();
    const repes = negocios.length - nuevos.length;
    return bien(`${nuevos.length} negocios nuevos${repes ? ` (${repes} ya los tenías)` : ""}. Están arriba en la lista.`);
  } catch (e) {
    return fallo(e);
  }
}

export async function anadirAMano(_: Resultado, d: FormData): Promise<Resultado> {
  const nombre = texto(d, "nombre");
  if (!nombre) return mal("Pon al menos el nombre del negocio.");
  const p = {
    nombre,
    telefono: texto(d, "telefono") || null,
    email: texto(d, "email") || null,
    web: texto(d, "web") || null,
    ciudad: texto(d, "ciudad") || null,
    nota: null,
    resenas: null,
    busqueda: "A mano",
  };
  try {
    filas(await exigirDb().from("prospectos").insert({ ...p, gancho: texto(d, "gancho") || calcularGancho(p) }).select("id"));
    refrescar();
    return bien(`${nombre} añadido.`);
  } catch (e) {
    return fallo(e);
  }
}

// Mete los seleccionados en la cola de un canal con la plantilla rellenada.
export async function aLaCola(_: Resultado, d: FormData): Promise<Resultado> {
  const ids = d.getAll("ids").map(String);
  const que = texto(d, "que");
  if (ids.length === 0) return mal("Marca al menos un negocio.");
  try {
    const c = exigirDb();
    if (que === "descartar") {
      filas(await c.from("prospectos").update({ etapa: "descartado", actualizado_en: new Date().toISOString() }).in("id", ids).select("id"));
      refrescar();
      return bien(`${ids.length} descartados.`);
    }
    const canal = que as Canal;
    if (canal !== "whatsapp" && canal !== "correo") return mal("Acción no válida.");
    const plantilla = filas(await c.from("plantillas").select("*").eq("canal", canal).maybeSingle()) as Plantilla | null;
    if (!plantilla) return mal("Falta la plantilla de ese canal. Guárdala en su pantalla.");
    const prospectos = filas(await c.from("prospectos").select("*").in("id", ids)) as Prospecto[];
    const yaEnCola = new Set(
      (filas(await c.from("mensajes").select("prospecto_id").eq("canal", canal).in("prospecto_id", ids)
        .in("estado", ["pendiente", "enviando", "revisar", "enviado"])) as { prospecto_id: string }[]).map((m) => m.prospecto_id),
    );
    const { negocio } = leerConfig();
    const validos = prospectos.filter((p) => (canal === "whatsapp" ? p.telefono : p.email) && !yaEnCola.has(p.id));
    if (validos.length === 0)
      return mal(canal === "whatsapp" ? "Ninguno tiene teléfono o ya estaban en la cola." : "Ninguno tiene email o ya estaban en la cola.");
    filas(
      await c.from("mensajes").insert(
        validos.map((p) => ({
          prospecto_id: p.id,
          canal,
          asunto: plantilla.asunto ? rellenar(plantilla.asunto, p, negocio) : null,
          texto: rellenar(plantilla.texto, p, negocio),
        })),
      ).select("id"),
    );
    filas(await c.from("prospectos").update({ etapa: "en_cola" }).in("id", validos.map((p) => p.id)).eq("etapa", "nuevo").select("id"));
    refrescar();
    const fuera = ids.length - validos.length;
    return bien(`${validos.length} a la cola de ${canal === "whatsapp" ? "WhatsApp" : "correo"}${fuera ? ` (${fuera} sin ${canal === "whatsapp" ? "teléfono" : "email"} o ya en cola)` : ""}.`);
  } catch (e) {
    return fallo(e);
  }
}

// CRM: mover de etapa, poner valor y notas.
export async function actualizarProspecto(_: Resultado, d: FormData): Promise<Resultado> {
  const id = texto(d, "id");
  const etapa = texto(d, "etapa") as Etapa;
  if (!ETAPAS.some((e) => e.id === etapa)) return mal("Etapa no válida.");
  try {
    filas(
      await exigirDb().from("prospectos").update({
        etapa,
        valor: numero(d, "valor"),
        notas: texto(d, "notas") || null,
        actualizado_en: new Date().toISOString(),
      }).eq("id", id).select("id"),
    );
    refrescar();
    return bien("Guardado.");
  } catch (e) {
    return fallo(e);
  }
}
