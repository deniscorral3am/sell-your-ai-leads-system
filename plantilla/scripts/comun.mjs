// Utilidades compartidas por los scripts de terminal.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export function baseDeDatos() {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "config.local.json"), "utf8"));
  } catch {
    salir("No encuentro config.local.json. Lanza esto desde la carpeta del panel y conecta antes la base.");
  }
  const { url, clave } = config.supabase ?? {};
  if (!url || !clave) salir("Falta conectar la base de datos (Conexiones → Base de datos).");
  return createClient(url, clave, { auth: { persistSession: false } });
}

export function leerJson(archivo) {
  if (!archivo) salir("Dime el archivo JSON. Ejemplo: npm run anuncios:guardar -- datos/anuncios.json");
  try {
    return JSON.parse(fs.readFileSync(archivo, "utf8"));
  } catch (e) {
    salir(`No puedo leer ${archivo}: ${e.message}`);
  }
}

export function salir(mensaje) {
  console.error(`✗ ${mensaje}`);
  process.exit(1);
}
