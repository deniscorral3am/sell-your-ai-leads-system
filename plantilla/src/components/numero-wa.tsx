"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { accionNumero } from "@/acciones/conexiones";
import { Boton, Form } from "@/components/form";
import { Etiqueta } from "@/components/ui";
import type { EstadoNumero } from "@/lib/whatsapp";

const TEXTO: Record<EstadoNumero["conexion"], [string, "bien" | "aviso" | "neutro" | "laton"]> = {
  conectado: ["Conectado", "bien"],
  esperando_qr: ["Escanea el QR", "laton"],
  iniciando: ["Arrancando…", "neutro"],
  desconectado: ["Se ha desconectado", "aviso"],
  cerrada_sesion: ["Sesión cerrada: vuelve a escanear", "aviso"],
  apagado: ["Sin vincular", "neutro"],
};

export function NumeroWA({ inicial, nombre, ayuda, aceptado }: { inicial: EstadoNumero; nombre: string; ayuda: string; aceptado: boolean }) {
  const [e, setE] = useState(inicial);
  useEffect(() => {
    if (e.conexion === "conectado" || (e.conexion === "apagado" && !e.vinculado)) return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/whatsapp/${e.numero}`, { cache: "no-store" }).catch(() => null);
      if (r?.ok) setE(await r.json());
    }, 2500);
    return () => clearInterval(t);
  }, [e.numero, e.conexion, e.vinculado]);

  const [texto, tono] = e.conexion === "apagado" && e.vinculado ? ["Apagado", "aviso" as const] : TEXTO[e.conexion];
  return (
    <section className="flex flex-col border border-linea bg-[#FAF8F3] p-5">
      <p className="eyebrow">Número {e.numero}</p>
      <h3 className="titulo mt-2 text-3xl">{nombre}</h3>
      <p className="mt-1 text-sm text-gris">{ayuda}</p>
      <div className="my-4"><Etiqueta tono={tono}>{texto}</Etiqueta></div>
      {e.qr && (
        <div className="mb-4 border border-linea bg-white p-3">
          <Image src={e.qr} alt="QR para vincular" width={300} height={300} unoptimized className="mx-auto" />
          <p className="mt-2 text-center text-xs text-gris">Móvil → WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
        </div>
      )}
      <Form accion={accionNumero} className="mt-auto flex flex-wrap gap-2">
        <input type="hidden" name="numero" value={e.numero} />
        {e.conexion === "apagado" && <Boton name="que" value="conectar" disabled={!aceptado}>{e.vinculado ? "Encender" : "Vincular"}</Boton>}
        {["desconectado", "cerrada_sesion", "esperando_qr", "iniciando"].includes(e.conexion) && <Boton name="que" value="reiniciar" variante="linea">Reintentar</Boton>}
        {(e.vinculado || e.conexion !== "apagado") && <Boton name="que" value="desvincular" variante="peligro">Desvincular</Boton>}
      </Form>
    </section>
  );
}
