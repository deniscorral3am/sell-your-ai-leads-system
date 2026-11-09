"use server";

import { revalidatePath } from "next/cache";
import { exigirDb, filas } from "@/lib/db";
import { bien, fallo, mal, texto } from "@/lib/formularios";
import type { Resultado } from "@/lib/tipos";

const refrescar = () => revalidatePath("/", "layout");

export async function crearLlamada(_: Resultado, d: FormData): Promise<Resultado> {
  const nombre = texto(d, "nombre");
  const fecha = texto(d, "fecha");
  if (!nombre || !fecha) return mal("Pon con quién y qué día.");
  const prospecto_id = texto(d, "prospecto_id") || null;
  try {
    const c = exigirDb();
    filas(await c.from("llamadas").insert({
      nombre, fecha, prospecto_id, hora: texto(d, "hora") || null, donde: texto(d, "donde") || null, nota: texto(d, "nota") || null,
    }).select("id"));
    if (prospecto_id) await c.from("prospectos").update({ etapa: "llamada" }).eq("id", prospecto_id).in("etapa", ["nuevo", "en_cola", "contactado", "respondio"]);
    refrescar();
    return bien(`Llamada con ${nombre} apuntada.`);
  } catch (e) {
    return fallo(e);
  }
}

export async function resultadoLlamada(_: Resultado, d: FormData): Promise<Resultado> {
  const id = texto(d, "id");
  const resultado = texto(d, "resultado");
  if (!["pendiente", "hecha", "no_vino", "cerrada", "borrar"].includes(resultado)) return mal("Resultado no válido.");
  try {
    const c = exigirDb();
    if (resultado === "borrar") {
      filas(await c.from("llamadas").delete().eq("id", id).select("id"));
    } else {
      const [ll] = filas(await c.from("llamadas").update({ resultado }).eq("id", id).select("prospecto_id")) as { prospecto_id: string | null }[];
      if (resultado === "cerrada" && ll?.prospecto_id) await c.from("prospectos").update({ etapa: "cliente" }).eq("id", ll.prospecto_id);
    }
    refrescar();
    return bien(resultado === "cerrada" ? "Cerrada. Pasa a Clientes en el CRM." : "Guardado.");
  } catch (e) {
    return fallo(e);
  }
}
