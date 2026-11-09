import { aceptarRiesgoWhatsApp } from "@/acciones/conexiones";
import { AvisoWhatsApp } from "@/components/aviso-whatsapp";
import { Boton, Form } from "@/components/form";
import { NumeroWA } from "@/components/numero-wa";
import { Cabecera, Tarjeta } from "@/components/ui";
import { leerConfig } from "@/lib/config";
import { NOMBRE_NUMERO, estadoNumeros } from "@/lib/whatsapp";

const AYUDA = {
  1: "La cuenta que ya tienes en WhatsApp en ese móvil.",
  2: "En la misma app: Ajustes → Añadir cuenta. Cambias de una a otra manteniendo pulsada tu foto.",
  3: "WhatsApp Business, que es otra app en el mismo móvil.",
} as const;

export default async function GuiaWhatsApp() {
  const { aceptoRiesgo } = leerConfig().whatsapp;
  const numeros = await estadoNumeros(true);
  return (
    <>
      <Cabecera numero="08.3" eyebrow="Conexión · 3 min por número" titulo={<>Tus números de <em>WhatsApp</em></>}>
        Hasta 3 números desde un solo móvil. Cada uno se vincula escaneando su QR, como WhatsApp Web.
      </Cabecera>
      <AvisoWhatsApp />
      {!aceptoRiesgo && (
        <Tarjeta eyebrow="Antes de vincular" titulo={<>Léelo <em>una vez</em></>} className="mb-8 max-w-3xl">
          <ul className="mb-5 list-disc space-y-1.5 pl-5 text-[15px]">
            <li>Esta conexión no es de Meta. Pueden bloquear el número para siempre y sin aviso.</li>
            <li>El panel nunca envía solo: cada mensaje lo apruebas tú, con un tope diario por número.</li>
            <li>Empieza con 10-15 al día en un número nuevo y sube poco a poco. Si te marcan como spam, el bloqueo llega rápido.</li>
            <li>Tus sesiones se guardan en la carpeta <code className="font-mono">.whatsapp/</code> de tu ordenador. No la compartas con nadie.</li>
          </ul>
          <Form accion={aceptarRiesgoWhatsApp} className="flex flex-wrap items-center gap-4">
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="acepto" value="si" className="size-4 accent-[#0E0E0D]" /> Lo he leído y uso un número que puedo perder</label>
            <Boton>Aceptar</Boton>
          </Form>
        </Tarjeta>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {numeros.map((n) => <NumeroWA key={`${n.numero}-${n.conexion}-${n.vinculado}`} inicial={n} nombre={NOMBRE_NUMERO[n.numero]} ayuda={AYUDA[n.numero]} aceptado={aceptoRiesgo} />)}
      </div>
    </>
  );
}
