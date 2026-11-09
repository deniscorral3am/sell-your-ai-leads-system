import "server-only";
import fs from "node:fs";
import path from "node:path";

// Las claves y ajustes viven en config.local.json, en la raíz del proyecto.
// Ese archivo está en .gitignore: nunca se sube a GitHub ni sale del ordenador.
export type Config = {
  negocio: { tuNombre: string; empresa: string; queVendes: string; prefijoPais: string };
  supabase: { url: string; clave: string };
  apify: { token: string };
  correo: { usuario: string; clave: string; remitente: string; topeDiario: number };
  whatsapp: { aceptoRiesgo: boolean; topePorNumero: number };
};

const ARCHIVO = path.join(process.cwd(), "config.local.json");

const BASE: Config = {
  negocio: { tuNombre: "", empresa: "", queVendes: "", prefijoPais: "34" },
  supabase: { url: "", clave: "" },
  apify: { token: "" },
  correo: { usuario: "", clave: "", remitente: "", topeDiario: 40 },
  whatsapp: { aceptoRiesgo: false, topePorNumero: 25 },
};

type Parcial = { [K in keyof Config]?: Partial<Config[K]> };

function fusionar(a: Config, b: Parcial): Config {
  const r = { ...a };
  for (const k of Object.keys(BASE) as (keyof Config)[]) {
    // @ts-expect-error: cada sección se fusiona con su propio tipo
    r[k] = { ...a[k], ...(b[k] ?? {}) };
  }
  return r;
}

export function leerConfig(): Config {
  try {
    return fusionar(BASE, JSON.parse(fs.readFileSync(ARCHIVO, "utf8")) as Parcial);
  } catch {
    return BASE; // primera vez: aún no existe el archivo
  }
}

export function guardarConfig(cambios: Parcial): Config {
  const nuevo = fusionar(leerConfig(), cambios);
  fs.writeFileSync(ARCHIVO, JSON.stringify(nuevo, null, 2) + "\n", { mode: 0o600 });
  return nuevo;
}

// Para enseñar una clave sin revelarla: solo los 4 últimos caracteres.
export function tapar(valor: string): string {
  if (!valor) return "";
  return valor.length <= 8 ? "••••" : `••••${valor.slice(-4)}`;
}
