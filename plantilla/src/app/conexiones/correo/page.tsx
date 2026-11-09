import { guardarCorreo } from "@/acciones/conexiones";
import { Boton, Form } from "@/components/form";
import { Cabecera, Campo, Etiqueta, Paso } from "@/components/ui";
import { leerConfig, tapar } from "@/lib/config";

export default function GuiaCorreo() {
  const c = leerConfig().correo;
  return (
    <>
      <Cabecera numero="08.4" eyebrow="Conexión · 3 min" titulo={<>Tu <em>correo</em></>}>
        Los correos salen de tu Gmail, uno a uno y con tu aprobación. Mejor una cuenta aparte de la principal.
      </Cabecera>
      <p className="mb-6">Estado: {c.clave ? <Etiqueta tono="bien">Conectado</Etiqueta> : <Etiqueta>Sin conectar</Etiqueta>}</p>
      <ol className="max-w-3xl">
        <Paso n={1} titulo="Activa la verificación en dos pasos">
          <p>En <a className="underline" href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">myaccount.google.com/security</a>. Sin ella Google no deja crear el paso 2.</p>
        </Paso>
        <Paso n={2} titulo="Crea una contraseña de aplicación">
          <p>En <a className="underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">myaccount.google.com/apppasswords</a> → nombre «Prospección» → Crear. Copia las 16 letras.</p>
        </Paso>
        <Paso n={3} titulo="Pégala aquí">
          <Form accion={guardarCorreo} className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Tu Gmail" name="usuario" type="email" defaultValue={c.usuario} required />
            <Campo etiqueta="Contraseña de aplicación" name="clave" type="password" placeholder={c.clave ? `Guardada (${tapar(c.clave)})` : "abcd efgh ijkl mnop"} autoComplete="off" />
            <Campo etiqueta="Nombre que verán" name="remitente" defaultValue={c.remitente} placeholder="Denis de Sell Your AI" />
            <Campo etiqueta="Tope diario" name="topeDiario" type="number" min={1} max={400} defaultValue={c.topeDiario} />
            <div className="sm:col-span-2"><Boton enCurso="Probando…">Guardar y probar</Boton></div>
          </Form>
          <p className="text-sm text-gris">Google corta cerca de 500 al día en cuentas normales. Para frío, no pases de 40-50 por cuenta.</p>
        </Paso>
      </ol>
    </>
  );
}
