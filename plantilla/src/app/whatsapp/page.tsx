import Link from "next/link";
import { comprobarRespuestasForm } from "@/acciones/mensajes";
import { guardarTopeWhatsApp } from "@/acciones/conexiones";
import { AvisoWhatsApp } from "@/components/aviso-whatsapp";
import { Cola, EditorPlantilla } from "@/components/cola";
import { Boton, Form } from "@/components/form";
import { Puerta } from "@/components/puerta";
import { Cabecera, Campo, Etiqueta, Tarjeta } from "@/components/ui";
import { leerConfig } from "@/lib/config";
import { cola, enviadosHoy } from "@/lib/consultas";
import { exigirDb, filas } from "@/lib/db";
import type { Plantilla } from "@/lib/tipos";
import { NOMBRE_NUMERO, estadoNumeros } from "@/lib/whatsapp";

export default function WhatsApp() {
  return (
    <>
      <Cabecera numero="02" eyebrow="Escribir" titulo={<>Cola de <em>WhatsApp</em></>}>
        Lees cada mensaje, lo retocas si hace falta y lo apruebas. Uno a uno: así es como no te banean el número.
      </Cabecera>
      <AvisoWhatsApp />
      <Puerta><Contenido /></Puerta>
    </>
  );
}

async function Contenido() {
  const c = exigirDb();
  const config = leerConfig();
  const numeros = await estadoNumeros(true);
  const [mensajes, plantilla, usados] = await Promise.all([
    cola(c, "whatsapp"),
    c.from("plantillas").select("*").eq("canal", "whatsapp").maybeSingle().then((r) => filas(r) as Plantilla | null),
    Promise.all(numeros.map((n) => enviadosHoy(c, "whatsapp", n.numero))),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="titulo text-3xl">{mensajes.length} por <em>revisar</em></h2>
        </div>
        <Cola mensajes={mensajes} canal="whatsapp" numeros={numeros} />
      </div>
      <aside className="space-y-6">
        <Tarjeta eyebrow="Tus números">
          <ul className="divide-y divide-linea">
            {numeros.map((n, i) => (
              <li key={n.numero} className="flex items-center justify-between gap-2 py-3 text-sm">
                <span>{NOMBRE_NUMERO[n.numero]}</span>
                {n.conexion === "conectado"
                  ? <span className="font-mono text-xs">{usados[i]}/{config.whatsapp.topePorNumero} hoy</span>
                  : <Etiqueta tono={n.vinculado ? "aviso" : "neutro"}>{n.vinculado ? "Desconectado" : "Sin vincular"}</Etiqueta>}
              </li>
            ))}
          </ul>
          <Link href="/conexiones/whatsapp" className="mt-3 inline-block text-sm underline">Gestionar números</Link>
          <Form accion={guardarTopeWhatsApp} className="mt-5 flex flex-wrap items-end gap-2">
            <Campo etiqueta="Tope diario por número" name="tope" type="number" min={1} max={60} defaultValue={config.whatsapp.topePorNumero} className="w-40" />
            <Boton variante="suave">Guardar</Boton>
          </Form>
        </Tarjeta>
        <Tarjeta eyebrow="Respuestas">
          <p className="mb-3 text-sm text-gris">Mira quién te ha contestado y lo pasa a «Ha respondido» en el CRM. Solo mira quién y cuándo, no lee tus chats.</p>
          <Form accion={comprobarRespuestasForm} className="flex flex-wrap gap-2"><Boton variante="linea" enCurso="Mirando…">Comprobar respuestas</Boton></Form>
        </Tarjeta>
        <EditorPlantilla canal="whatsapp" plantilla={plantilla} />
      </aside>
    </div>
  );
}
