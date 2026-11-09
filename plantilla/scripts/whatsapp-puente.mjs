// Puente de WhatsApp de un número.
//
// El panel lanza un proceso de estos por cada número (1, 2 y 3). Usa Baileys
// (WhatsApp Web, API NO oficial) y abre un mini servidor que SOLO escucha en
// este ordenador (127.0.0.1). No contesta solo, no envía nada por su cuenta:
// únicamente manda el mensaje que el panel le pide tras tu clic.
//
// Variables: WA_NUMERO (1-3), WA_PUERTO, WA_CARPETA.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";

const NUMERO = Number(process.env.WA_NUMERO);
const PUERTO = Number(process.env.WA_PUERTO);
const CARPETA = process.env.WA_CARPETA;
if (![1, 2, 3].includes(NUMERO) || !PUERTO || !CARPETA) {
  console.error("Faltan WA_NUMERO, WA_PUERTO o WA_CARPETA.");
  process.exit(1);
}

const AUTH = path.join(CARPETA, "auth");
const ARCHIVO_TOKEN = path.join(CARPETA, "token");
const ARCHIVO_ENVIADOS = path.join(CARPETA, "enviados.json");
const ARCHIVO_RESPUESTAS = path.join(CARPETA, "respuestas.json");
fs.mkdirSync(CARPETA, { recursive: true });

// Token nuevo en cada arranque: solo el panel (que lee este archivo) puede
// pedirle cosas al puente.
const TOKEN = crypto.randomBytes(24).toString("hex");
fs.writeFileSync(ARCHIVO_TOKEN, TOKEN, { mode: 0o600 });

const log = (...a) => console.log(new Date().toISOString(), `[número ${NUMERO}]`, ...a);
const leerJson = (archivo, porDefecto) => {
  try {
    return JSON.parse(fs.readFileSync(archivo, "utf8"));
  } catch {
    return porDefecto;
  }
};

// Ids de los envíos ya hechos: si el panel pide dos veces el mismo, no se repite.
const enviados = new Set(leerJson(ARCHIVO_ENVIADOS, []));
// Último mensaje recibido de cada teléfono (solo la hora, nunca el contenido).
const respuestas = leerJson(ARCHIVO_RESPUESTAS, {});

let sock = null;
let conexion = "iniciando"; // iniciando | esperando_qr | conectado | desconectado | cerrada_sesion
let qr = null;
let reintentos = 0;

async function conectar() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH);
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));
  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: Browsers.macOS("Desktop"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (u) => {
    if (u.qr) {
      qr = u.qr;
      conexion = "esperando_qr";
    }
    if (u.connection === "open") {
      conexion = "conectado";
      qr = null;
      reintentos = 0;
      log("conectado");
    }
    if (u.connection === "close") {
      const codigo = u.lastDisconnect?.error?.output?.statusCode;
      if (codigo === DisconnectReason.loggedOut) {
        // Se cerró la sesión desde el móvil: hay que volver a escanear el QR.
        log("sesión cerrada desde el móvil");
        fs.rmSync(AUTH, { recursive: true, force: true });
        conexion = "cerrada_sesion";
        qr = null;
        setTimeout(conectar, 2000);
        return;
      }
      conexion = "desconectado";
      reintentos += 1;
      const espera = Math.min(30000, 2000 * reintentos);
      log(`desconectado (código ${codigo ?? "?"}), reintento en ${espera / 1000} s`);
      setTimeout(conectar, espera);
    }
  });

  // Solo apuntamos QUIÉN te ha escrito y cuándo, para que el panel sepa que un
  // prospecto ha respondido. El texto de los mensajes no se guarda.
  sock.ev.on("messages.upsert", ({ messages, type }) => {
    if (type !== "notify") return;
    let cambio = false;
    for (const m of messages) {
      if (m.key.fromMe) continue;
      const candidatos = [m.key.remoteJid, m.key.remoteJidAlt, m.key.senderPn].filter(Boolean);
      const jid = candidatos.find((j) => j.endsWith("@s.whatsapp.net"));
      if (!jid) continue;
      respuestas[jid.split("@")[0].split(":")[0]] = Date.now();
      cambio = true;
    }
    if (cambio) fs.writeFileSync(ARCHIVO_RESPUESTAS, JSON.stringify(respuestas));
  });
}

async function enviar({ telefono, texto, id }) {
  if (conexion !== "conectado" || !sock) return [503, { error: "Este número no está conectado." }];
  if (!/^\d{10,15}$/.test(telefono || "")) return [400, { error: "Teléfono no válido." }];
  if (!texto?.trim()) return [400, { error: "El mensaje está vacío." }];
  if (id && enviados.has(id)) return [200, { ok: true, repetido: true }];

  const [existe] = await sock.onWhatsApp(telefono).catch(() => []);
  if (!existe?.exists) return [404, { error: "Ese teléfono no tiene WhatsApp." }];

  await sock.sendMessage(existe.jid, { text: texto });
  if (id) {
    enviados.add(id);
    fs.writeFileSync(ARCHIVO_ENVIADOS, JSON.stringify([...enviados].slice(-5000)));
  }
  return [200, { ok: true }];
}

function leerCuerpo(req) {
  return new Promise((ok, mal) => {
    let datos = "";
    req.on("data", (c) => {
      datos += c;
      if (datos.length > 100_000) req.destroy();
    });
    req.on("end", () => {
      try {
        ok(datos ? JSON.parse(datos) : {});
      } catch (e) {
        mal(e);
      }
    });
  });
}

const servidor = http.createServer(async (req, res) => {
  const responder = (codigo, cuerpo) => {
    res.writeHead(codigo, { "Content-Type": "application/json" });
    res.end(JSON.stringify(cuerpo));
  };
  const auth = req.headers.authorization ?? "";
  const esperado = `Bearer ${TOKEN}`;
  if (auth.length !== esperado.length || !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(esperado))) {
    return responder(401, { error: "No autorizado." });
  }
  try {
    if (req.method === "GET" && req.url === "/estado") {
      return responder(200, { conexion, qr, vinculado: fs.existsSync(path.join(AUTH, "creds.json")) });
    }
    if (req.method === "GET" && req.url === "/respuestas") return responder(200, respuestas);
    if (req.method === "POST" && req.url === "/enviar") {
      const [codigo, cuerpo] = await enviar(await leerCuerpo(req));
      return responder(codigo, cuerpo);
    }
    responder(404, { error: "No existe." });
  } catch (e) {
    log("error", e?.message);
    responder(500, { error: e?.message || "Error del puente." });
  }
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  log(`puente escuchando en 127.0.0.1:${PUERTO}`);
  conectar().catch((e) => {
    log("no arranca", e?.message);
    conexion = "desconectado";
  });
});

const salir = () => {
  try {
    sock?.end(undefined);
  } catch {}
  process.exit(0);
};
process.on("SIGTERM", salir);
process.on("SIGINT", salir);
