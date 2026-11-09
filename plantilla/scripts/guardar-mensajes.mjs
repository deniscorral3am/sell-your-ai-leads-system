// Guarda los mensajes que reescribe Claude con /personalizar.
// Uso: npm run mensajes:guardar -- datos/personalizados.json
// Formato: { "mensajes": [ { "id": "<id del mensaje>", "texto": "...", "asunto": "..." , "gancho": "..." } ] }
// Solo toca mensajes que siguen pendientes: nunca envía nada.
import { baseDeDatos, leerJson, salir } from "./comun.mjs";

const datos = leerJson(process.argv[2]);
if (!Array.isArray(datos.mensajes)) salir("El JSON necesita una lista «mensajes».");
const db = baseDeDatos();
let ok = 0;
for (const m of datos.mensajes) {
  if (!m.id || !m.texto?.trim()) continue;
  const cambios = { texto: m.texto.trim(), personalizado: true };
  if (typeof m.asunto === "string" && m.asunto.trim()) cambios.asunto = m.asunto.trim();
  const { data, error } = await db.from("mensajes").update(cambios).eq("id", m.id).eq("estado", "pendiente").select("prospecto_id");
  if (error) salir(error.message);
  if (data?.length) {
    ok++;
    if (m.gancho?.trim()) await db.from("prospectos").update({ gancho: m.gancho.trim() }).eq("id", data[0].prospecto_id);
  }
}
console.log(`✓ ${ok} mensajes personalizados. Revísalos en el panel antes de aprobarlos.`);
