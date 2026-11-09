// Guarda en la base la foto de campañas que trae Claude con /actualizar-anuncios.
// Uso: npm run anuncios:guardar -- datos/anuncios.json
import { baseDeDatos, leerJson, salir } from "./comun.mjs";

const datos = leerJson(process.argv[2]);
const fecha = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
if (!Array.isArray(datos.campanas)) salir("El JSON necesita una lista «campanas».");

const filas = datos.campanas.map((c, i) => {
  if (!c.nombre) salir(`A la campaña ${i + 1} le falta el nombre.`);
  const gasto = Number(c.gasto), resultados = Number(c.resultados ?? 0);
  if (!Number.isFinite(gasto) || !Number.isFinite(resultados)) salir(`Gasto o resultados no válidos en «${c.nombre}».`);
  return {
    campana_id: c.id ? String(c.id) : null,
    nombre: String(c.nombre),
    estado: c.estado ?? null,
    gasto,
    resultados,
    tipo_resultado: c.tipo_resultado ?? null,
    moneda: datos.moneda ?? "EUR",
    desde: fecha(datos.desde),
    hasta: fecha(datos.hasta),
  };
});

const db = baseDeDatos();
// Es una foto: se cambia entera.
const borrar = await db.from("anuncios").delete().not("id", "is", null);
if (borrar.error) salir(borrar.error.message);
if (filas.length) {
  const { error } = await db.from("anuncios").insert(filas);
  if (error) salir(error.message);
}
console.log(`✓ ${filas.length} campañas guardadas. Ábrelas en el panel → Anuncios.`);
