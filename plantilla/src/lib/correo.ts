import "server-only";
import nodemailer from "nodemailer";
import type { Config } from "./config";

// Correo con Gmail (contraseña de aplicación). Texto plano: llega mejor que el HTML en frío.
function transporte(c: Config["correo"]) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: c.usuario, pass: c.clave.replace(/\s/g, "") },
  });
}

export async function probarCorreo(c: Config["correo"]): Promise<boolean> {
  try {
    await transporte(c).verify();
    return true;
  } catch {
    return false;
  }
}

export async function enviarCorreo(
  c: Config["correo"],
  m: { para: string; asunto: string; texto: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await transporte(c).sendMail({
      from: c.remitente ? `"${c.remitente.replace(/"/g, "")}" <${c.usuario}>` : c.usuario,
      to: m.para,
      subject: m.asunto,
      text: m.texto,
    });
    return { ok: true };
  } catch (e) {
    const t = e instanceof Error ? e.message : "";
    if (/invalid login|535/i.test(t)) return { ok: false, error: "Gmail no acepta la contraseña. Vuelve a crearla en Conexiones → Correo." };
    if (/limit|quota|550 5\.4\.5/i.test(t)) return { ok: false, error: "Gmail ha cortado los envíos por hoy. Sigue mañana." };
    return { ok: false, error: t || "No se ha podido enviar el correo." };
  }
}
