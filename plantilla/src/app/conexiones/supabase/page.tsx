import { guardarSupabase } from "@/acciones/conexiones";
import { Boton, Form } from "@/components/form";
import { Cabecera, Campo, Etiqueta, Paso } from "@/components/ui";
import { leerConfig, tapar } from "@/lib/config";
import { estadoDb } from "@/lib/db";

export default async function GuiaSupabase() {
  const { url, clave } = leerConfig().supabase;
  const { estado, detalle } = await estadoDb();
  return (
    <>
      <Cabecera numero="08.1" eyebrow="Conexión · 5 min" titulo={<>Tu base de <em>datos</em></>}>
        Supabase guarda tus prospectos, mensajes y llamadas en tu propia cuenta (gratis). Nadie más los ve.
      </Cabecera>
      <p className="mb-6">Estado: {estado === "lista" ? <Etiqueta tono="bien">Base conectada</Etiqueta> : estado === "sin_tablas" ? <Etiqueta tono="aviso">Faltan las tablas</Etiqueta> : estado === "error" ? <Etiqueta tono="aviso">Error</Etiqueta> : <Etiqueta>Sin conectar</Etiqueta>}
        {detalle && <span className="ml-2 text-sm text-aviso">{detalle}</span>}</p>
      <ol className="max-w-3xl">
        <Paso n={1} titulo="Atajo: que lo haga Claude">
          <p>Abre Claude Code en la carpeta del panel y escribe <code className="bg-crema px-1.5 font-mono">/conectar</code>. Busca tu proyecto, crea las tablas y te dice qué pegar en el paso 3. Si lo usas, sáltate el paso 2.</p>
        </Paso>
        <Paso n={2} titulo="A mano: crea el proyecto y las tablas">
          <p>Entra en <a className="underline" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">supabase.com</a> → New project (región: Frankfurt o París). Cuando esté listo, abre <strong>SQL Editor</strong>, pega todo el archivo <code className="bg-crema px-1.5 font-mono">supabase/esquema.sql</code> de esta carpeta y pulsa <strong>Run</strong>.</p>
        </Paso>
        <Paso n={3} titulo="Pega la URL y la clave secreta">
          <p>En Supabase: <strong>Project Settings → Data API</strong> (la URL, acaba en .supabase.co) y <strong>API Keys → Secret keys</strong> (empieza por <code className="font-mono">sb_secret_</code>). La clave se queda en tu ordenador, en <code className="font-mono">config.local.json</code>.</p>
          <Form accion={guardarSupabase} className="flex flex-col gap-3">
            <Campo etiqueta="URL del proyecto" name="url" defaultValue={url} placeholder="https://abcd1234.supabase.co" required />
            <Campo etiqueta="Clave secreta" name="clave" type="password" placeholder={clave ? `Guardada (${tapar(clave)}). Déjalo vacío para mantenerla.` : "sb_secret_…"} autoComplete="off" />
            <div><Boton enCurso="Probando…">Guardar y probar</Boton></div>
          </Form>
        </Paso>
      </ol>
    </>
  );
}
