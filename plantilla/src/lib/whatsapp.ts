import "server-only";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

// Cada número de WhatsApp es un proceso aparte (scripts/whatsapp-puente.mjs)
// con su carpeta en .whatsapp/numero-N y su puerto, solo en 127.0.0.1.

export const NUMEROS = [1, 2, 3] as const;
export type Numero = (typeof NUMEROS)[number];
export const NOMBRE_NUMERO: Record<Numero, string> = {
  1: "Número 1 · WhatsApp",
  2: "Número 2 · segunda cuenta",
  3: "Número 3 · Business",
};

export type Conexion = "apagado" | "iniciando" | "esperando_qr" | "conectado" | "desconectado" | "cerrada_sesion";
export type EstadoNumero = { numero: Numero; vinculado: boolean; conexion: Conexion; qr: string | null };

const PUERTO_BASE = 3940;
const carpeta = (n: Numero) => path.join(process.cwd(), ".whatsapp", `numero-${n}`);
const url = (n: Numero, ruta: string) => `http://127.0.0.1:${PUERTO_BASE + n}${ruta}`;
const archivoPid = (n: Numero) => path.join(carpeta(n), "puente.pid");

export const esNumero = (v: unknown): v is Numero => v === 1 || v === 2 || v === 3;

function token(n: Numero): string | null {
  try {
    return fs.readFileSync(path.join(carpeta(n), "token"), "utf8").trim();
  } catch {
    return null;
  }
}

async function pedir<T>(n: Numero, ruta: string, init?: RequestInit, ms = 2000): Promise<{ status: number; cuerpo: T } | null> {
  const t = token(n);
  if (!t) return null;
  try {
    const r = await fetch(url(n, ruta), {
      ...init,
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(ms),
    });
    return { status: r.status, cuerpo: (await r.json().catch(() => ({}))) as T };
  } catch {
    return null;
  }
}

const vinculado = (n: Numero) => fs.existsSync(path.join(carpeta(n), "auth", "creds.json"));
const recienLanzado = (n: Numero) =>
  Date.now() - (fs.statSync(archivoPid(n), { throwIfNoEntry: false })?.mtimeMs ?? 0) < 20_000;

export async function estadoNumero(n: Numero): Promise<EstadoNumero> {
  const r = await pedir<{ conexion: Conexion; qr: string | null }>(n, "/estado");
  if (!r || r.status !== 200) {
    return { numero: n, vinculado: vinculado(n), conexion: recienLanzado(n) ? "iniciando" : "apagado", qr: null };
  }
  const { conexion, qr } = r.cuerpo;
  return {
    numero: n,
    vinculado: vinculado(n),
    conexion,
    qr: conexion === "esperando_qr" && qr ? await QRCode.toDataURL(qr, { margin: 1, width: 300 }) : null,
  };
}

// Si un número ya vinculado está apagado (p. ej. tras reiniciar el ordenador), lo levanta.
export async function estadoNumeros(levantar = false): Promise<EstadoNumero[]> {
  const estados = await Promise.all(NUMEROS.map(estadoNumero));
  if (levantar) {
    for (const e of estados) {
      if (e.vinculado && e.conexion === "apagado") {
        iniciar(e.numero);
        e.conexion = "iniciando";
      }
    }
  }
  return estados;
}

export function parar(n: Numero): void {
  try {
    process.kill(Number(fs.readFileSync(archivoPid(n), "utf8")));
  } catch {
    // ya estaba parado
  }
  fs.rmSync(archivoPid(n), { force: true });
}

export async function iniciar(n: Numero): Promise<void> {
  const e = await estadoNumero(n);
  if (e.conexion !== "apagado") return; // ya está en marcha
  fs.mkdirSync(carpeta(n), { recursive: true });
  const registro = fs.openSync(path.join(carpeta(n), "puente.log"), "a");
  const entorno: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (/^(NEXT_|__NEXT|TURBOPACK|NODE_OPTIONS$|NODE_ENV$|PORT$)/.test(k)) continue;
    entorno[k] = v;
  }
  Object.assign(entorno, { WA_NUMERO: String(n), WA_PUERTO: String(PUERTO_BASE + n), WA_CARPETA: carpeta(n) });
  const hijo = spawn(process.execPath, [path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts", "whatsapp-puente.mjs")], {
    cwd: process.cwd(),
    env: entorno as NodeJS.ProcessEnv,
    detached: true,
    stdio: ["ignore", registro, registro],
    windowsHide: true,
  });
  hijo.unref();
  fs.closeSync(registro);
  if (hijo.pid) fs.writeFileSync(archivoPid(n), String(hijo.pid));
}

export function desvincular(n: Numero): void {
  parar(n);
  fs.rmSync(carpeta(n), { recursive: true, force: true });
}

// Solo dígitos y con prefijo de país. En España, un 6/7/8/9 de 9 cifras lleva 34 delante.
export function normalizarTelefono(t: string | null | undefined, prefijo = "34"): string | null {
  let d = (t ?? "").replace(/\D/g, "").replace(/^00/, "");
  if (d.length === 9 && prefijo) d = prefijo + d;
  return d.length >= 10 && d.length <= 15 ? d : null;
}

export type Envio = { ok: true } | { ok: false; error: string; dudoso?: boolean };

export async function enviarWhatsApp(n: Numero, telefono: string, texto: string, id: string): Promise<Envio> {
  const r = await pedir<{ ok?: boolean; error?: string }>(
    n,
    "/enviar",
    { method: "POST", body: JSON.stringify({ telefono, texto, id }) },
    30_000,
  );
  if (!r) return { ok: false, dudoso: true, error: "Se ha cortado la conexión con WhatsApp. Mira en el móvil si el mensaje ha salido." };
  if (r.status === 200) return { ok: true };
  return { ok: false, error: r.cuerpo.error || "WhatsApp no ha aceptado el mensaje." };
}

// Teléfonos que te han escrito y cuándo (de los 3 números).
export async function respuestasRecibidas(): Promise<Record<string, number>> {
  const todas: Record<string, number> = {};
  for (const n of NUMEROS) {
    const r = await pedir<Record<string, number>>(n, "/respuestas");
    if (r?.status === 200) for (const [tel, ts] of Object.entries(r.cuerpo)) todas[tel] = Math.max(todas[tel] ?? 0, ts);
  }
  return todas;
}
