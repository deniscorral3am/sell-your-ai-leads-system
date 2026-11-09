"use server";

import { revalidatePath } from "next/cache";
import { probarApify } from "@/lib/apify";
import { guardarConfig, leerConfig } from "@/lib/config";
import { probarCorreo } from "@/lib/correo";
import { estadoDb } from "@/lib/db";
import { bien, mal, numero, texto } from "@/lib/formularios";
import type { Resultado } from "@/lib/tipos";
import { desvincular, esNumero, iniciar, parar } from "@/lib/whatsapp";

const refrescar = () => revalidatePath("/", "layout");

export async function guardarNegocio(_: Resultado, d: FormData): Promise<Resultado> {
  guardarConfig({
    negocio: {
      tuNombre: texto(d, "tuNombre"),
      empresa: texto(d, "empresa"),
      queVendes: texto(d, "queVendes"),
      prefijoPais: texto(d, "prefijoPais").replace(/\D/g, "") || "34",
    },
  });
  refrescar();
  return bien("Guardado. Tu nombre y tu empresa ya salen en las plantillas.");
}

export async function guardarSupabase(_: Resultado, d: FormData): Promise<Resultado> {
  const url = texto(d, "url").replace(/\/+$/, "");
  const clave = texto(d, "clave");
  const actual = leerConfig().supabase;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) return mal("La URL tiene que ser como https://xxxx.supabase.co");
  if (clave && !clave.startsWith("sb_secret_") && !clave.startsWith("eyJ"))
    return mal("Esa no parece la clave secreta. Es la que empieza por sb_secret_");
  if (clave.startsWith("sb_publishable_")) return mal("Esa es la clave pública. Necesitamos la secreta (sb_secret_…).");
  guardarConfig({ supabase: { url, clave: clave || actual.clave } });
  const e = await estadoDb();
  refrescar();
  if (e.estado === "lista") return bien("Base conectada. Ya puedes buscar negocios.");
  if (e.estado === "sin_tablas") return mal("Conectado, pero faltan las tablas. Lanza /conectar en Claude Code o pega supabase/esquema.sql en el SQL Editor.");
  return mal(e.detalle ?? "No se ha podido conectar.");
}

export async function guardarApify(_: Resultado, d: FormData): Promise<Resultado> {
  const token = texto(d, "token");
  if (!token) return mal("Pega tu token de Apify.");
  const p = await probarApify(token);
  if (!p.ok) return mal("Apify no reconoce ese token. Cópialo otra vez de Settings → API & Integrations.");
  guardarConfig({ apify: { token } });
  refrescar();
  return bien(`Apify conectado${p.usuario ? ` como ${p.usuario}` : ""}.`);
}

export async function guardarCorreo(_: Resultado, d: FormData): Promise<Resultado> {
  const actual = leerConfig().correo;
  const c = {
    usuario: texto(d, "usuario"),
    clave: texto(d, "clave") || actual.clave,
    remitente: texto(d, "remitente"),
    topeDiario: Math.min(400, Math.max(1, numero(d, "topeDiario") ?? actual.topeDiario)),
  };
  if (!/@/.test(c.usuario)) return mal("Pon tu dirección de Gmail completa.");
  if (!c.clave) return mal("Pega la contraseña de aplicación (16 letras).");
  if (!(await probarCorreo(c))) return mal("Gmail no acepta esos datos. Tiene que ser una contraseña de aplicación y la verificación en dos pasos tiene que estar activa.");
  guardarConfig({ correo: c });
  refrescar();
  return bien("Correo conectado.");
}

export async function guardarTopeCorreo(_: Resultado, d: FormData): Promise<Resultado> {
  const tope = numero(d, "tope");
  if (!tope || tope < 1 || tope > 400) return mal("Pon un número entre 1 y 400.");
  guardarConfig({ correo: { topeDiario: Math.round(tope) } });
  refrescar();
  return bien(`Tope diario: ${Math.round(tope)} correos.`);
}

export async function aceptarRiesgoWhatsApp(_: Resultado, d: FormData): Promise<Resultado> {
  if (d.get("acepto") !== "si") return mal("Marca la casilla para confirmar que lo has leído.");
  guardarConfig({ whatsapp: { aceptoRiesgo: true } });
  refrescar();
  return bien("Aceptado. Ya puedes vincular tus números.");
}

export async function guardarTopeWhatsApp(_: Resultado, d: FormData): Promise<Resultado> {
  const tope = numero(d, "tope");
  if (!tope || tope < 1 || tope > 60) return mal("Pon un número entre 1 y 60. Más de eso es buscar un baneo.");
  guardarConfig({ whatsapp: { topePorNumero: Math.round(tope) } });
  refrescar();
  return bien(`Tope: ${Math.round(tope)} mensajes al día por número.`);
}

export async function accionNumero(_: Resultado, d: FormData): Promise<Resultado> {
  const n = Number(texto(d, "numero"));
  if (!esNumero(n)) return mal("Número no válido.");
  const que = texto(d, "que");
  if (que === "conectar") {
    if (!leerConfig().whatsapp.aceptoRiesgo) return mal("Antes acepta el aviso de riesgo.");
    await iniciar(n);
    refrescar();
    return bien("Arrancando… en unos segundos sale el QR.");
  }
  if (que === "reiniciar") {
    parar(n);
    await new Promise((ok) => setTimeout(ok, 800));
    await iniciar(n);
    refrescar();
    return bien("Reiniciando el número…");
  }
  if (que === "desvincular") {
    desvincular(n);
    refrescar();
    return bien("Número desvinculado. Quítalo también en el móvil: Dispositivos vinculados.");
  }
  return mal("Acción no válida.");
}
