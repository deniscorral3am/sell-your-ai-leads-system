import { guardarApify } from "@/acciones/conexiones";
import { Boton, Form } from "@/components/form";
import { Cabecera, Campo, Etiqueta, Paso } from "@/components/ui";
import { leerConfig, tapar } from "@/lib/config";

export default function GuiaApify() {
  const { token } = leerConfig().apify;
  return (
    <>
      <Cabecera numero="08.2" eyebrow="Conexión · 2 min" titulo={<>El <em>buscador</em> de negocios</>}>
        Apify saca los negocios de Google Maps con su teléfono, web, nota y reseñas. Tiene 5 $ gratis al mes, que dan para unos cientos de negocios.
      </Cabecera>
      <p className="mb-6">Estado: {token ? <Etiqueta tono="bien">Conectado</Etiqueta> : <Etiqueta>Sin conectar</Etiqueta>}</p>
      <ol className="max-w-3xl">
        <Paso n={1} titulo="Crea tu cuenta">
          <p>En <a className="underline" href="https://console.apify.com/sign-up" target="_blank" rel="noreferrer">apify.com</a>, gratis.</p>
        </Paso>
        <Paso n={2} titulo="Copia tu token">
          <p><strong>Settings → API &amp; Integrations → Personal API tokens</strong> → copiar.</p>
          <Form accion={guardarApify} className="flex flex-wrap items-end gap-3">
            <Campo etiqueta="Token de Apify" name="token" type="password" placeholder={token ? `Guardado (${tapar(token)})` : "apify_api_…"} className="min-w-72 flex-1" autoComplete="off" />
            <Boton enCurso="Probando…">Guardar y probar</Boton>
          </Form>
        </Paso>
      </ol>
    </>
  );
}
