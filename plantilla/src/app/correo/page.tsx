import Link from "next/link";
import { guardarTopeCorreo } from "@/acciones/conexiones";
import { Cola, EditorPlantilla } from "@/components/cola";
import { Boton, Form } from "@/components/form";
import { Puerta } from "@/components/puerta";
import { Cabecera, Campo, Tarjeta } from "@/components/ui";
import { leerConfig } from "@/lib/config";
import { cola, enviadosHoy } from "@/lib/consultas";
import { exigirDb, filas } from "@/lib/db";
import type { Plantilla } from "@/lib/tipos";

export default function Correo() {
  return (
    <>
      <Cabecera numero="03" eyebrow="Escribir" titulo={<>Cola de <em>correo</em></>}>
        Lo mismo que WhatsApp, por email desde tu Gmail. Corto, personal y en texto plano: así no cae en spam.
      </Cabecera>
      <Puerta><Contenido /></Puerta>
    </>
  );
}

async function Contenido() {
  const c = exigirDb();
  const config = leerConfig();
  const [mensajes, plantilla, hoy] = await Promise.all([
    cola(c, "correo"),
    c.from("plantillas").select("*").eq("canal", "correo").maybeSingle().then((r) => filas(r) as Plantilla | null),
    enviadosHoy(c, "correo"),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <h2 className="titulo mb-4 text-3xl">{mensajes.length} por <em>revisar</em></h2>
        <Cola mensajes={mensajes} canal="correo" />
      </div>
      <aside className="space-y-6">
        <Tarjeta eyebrow="Hoy">
          {config.correo.usuario ? (
            <p className="text-sm">Desde <span className="font-mono">{config.correo.usuario}</span><br /><span className="titulo text-4xl">{hoy}</span> <span className="text-gris">/ {config.correo.topeDiario} enviados</span></p>
          ) : (
            <p className="text-sm text-aviso">Aún no has conectado tu correo. <Link href="/conexiones/correo" className="underline">Conéctalo</Link>.</p>
          )}
          <Form accion={guardarTopeCorreo} className="mt-5 flex flex-wrap items-end gap-2">
            <Campo etiqueta="Tope diario" name="tope" type="number" min={1} max={400} defaultValue={config.correo.topeDiario} className="w-32" />
            <Boton variante="suave">Guardar</Boton>
          </Form>
        </Tarjeta>
        <EditorPlantilla canal="correo" plantilla={plantilla} />
      </aside>
    </div>
  );
}
