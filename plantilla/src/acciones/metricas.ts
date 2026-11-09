"use server";

import { revalidatePath } from "next/cache";
import { exigirDb, filas } from "@/lib/db";
import { bien, fallo, mal, numero, texto } from "@/lib/formularios";
import type { Resultado } from "@/lib/tipos";

const refrescar = () => revalidatePath("/", "layout");

export async function crearMetrica(_: Resultado, d: FormData): Promise<Resultado> {
  const nombre = texto(d, "nombre");
  if (!nombre) return mal("Ponle nombre (p. ej. «Reels publicados»).");
  try {
    filas(await exigirDb().from("metricas").insert({ nombre, meta: numero(d, "meta"), posicion: Date.now() / 1e10 }).select("id"));
    refrescar();
    return bien(`«${nombre}» añadida.`);
  } catch (e) {
    return fallo(e);
  }
}

export async function editarMetrica(_: Resultado, d: FormData): Promise<Resultado> {
  const id = texto(d, "id");
  try {
    const c = exigirDb();
    if (texto(d, "que") === "borrar") {
      filas(await c.from("metricas").delete().eq("id", id).select("id"));
    } else {
      filas(await c.from("metricas").update({ nombre: texto(d, "nombre"), meta: numero(d, "meta") }).eq("id", id).select("id"));
    }
    refrescar();
    return bien("Guardado.");
  } catch (e) {
    return fallo(e);
  }
}

// Guarda la fila de una semana: un campo por métrica, llamado m_<id>.
export async function guardarSemana(_: Resultado, d: FormData): Promise<Resultado> {
  const semana = texto(d, "semana");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semana)) return mal("Semana no válida.");
  const valores = [...d.keys()].filter((k) => k.startsWith("m_")).map((k) => ({
    metrica_id: k.slice(2), semana, valor: numero(d, k) ?? 0,
  }));
  try {
    filas(await exigirDb().from("metricas_valores").upsert(valores).select("metrica_id"));
    refrescar();
    return bien("Semana guardada.");
  } catch (e) {
    return fallo(e);
  }
}
