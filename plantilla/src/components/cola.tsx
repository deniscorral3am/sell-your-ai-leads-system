import { accionMensaje, guardarPlantilla } from "@/acciones/mensajes";
import { Boton, Form } from "@/components/form";
import { Area, Campo, Etiqueta, Selector, Tarjeta, Vacio } from "@/components/ui";
import { haceCuanto } from "@/lib/fechas";
import type { Canal, MensajeConProspecto, Plantilla } from "@/lib/tipos";
import type { EstadoNumero } from "@/lib/whatsapp";
import { NOMBRE_NUMERO } from "@/lib/whatsapp";

export function EditorPlantilla({ canal, plantilla }: { canal: Canal; plantilla: Plantilla | null }) {
  return (
    <Tarjeta eyebrow="Plantilla" titulo={<>Tu <em>mensaje</em></>}>
      <Form accion={guardarPlantilla} className="space-y-3">
        <input type="hidden" name="canal" value={canal} />
        {canal === "correo" && <Campo etiqueta="Asunto" name="asunto" defaultValue={plantilla?.asunto ?? ""} />}
        <Area name="texto" rows={canal === "correo" ? 10 : 7} defaultValue={plantilla?.texto ?? ""}
          ayuda={<>Se rellenan solas: <code>[negocio]</code> <code>[ciudad]</code> <code>[gancho]</code> <code>[tu_nombre]</code> <code>[empresa]</code>. Corto, sin enlaces ni emojis en el primer mensaje.</>} />
        <Boton variante="linea">Guardar plantilla</Boton>
      </Form>
    </Tarjeta>
  );
}

export function Cola({ mensajes, canal, numeros }: { mensajes: MensajeConProspecto[]; canal: Canal; numeros?: EstadoNumero[] }) {
  if (mensajes.length === 0)
    return <Vacio>La cola está vacía. Ve a Prospectos, marca negocios y mándalos a la cola de {canal === "whatsapp" ? "WhatsApp" : "correo"}.</Vacio>;
  const conectados = (numeros ?? []).filter((n) => n.conexion === "conectado");
  return (
    <ol className="space-y-4">
      {mensajes.map((m, i) => (
        <li key={m.id} className="border border-linea bg-[#FAF8F3]">
          <div className="flex flex-wrap items-center gap-3 border-b border-linea px-5 py-3">
            <span className="font-mono text-xs text-laton-2">{String(i + 1).padStart(2, "0")}</span>
            <span className="font-semibold">{m.prospectos?.nombre}</span>
            <span className="font-mono text-xs text-gris">{canal === "whatsapp" ? m.prospectos?.telefono : m.prospectos?.email}</span>
            {m.personalizado && <Etiqueta tono="laton">Personalizado</Etiqueta>}
            {m.estado === "revisar" && <Etiqueta tono="aviso">Revisar</Etiqueta>}
            <span className="ml-auto font-mono text-[11px] text-gris">{haceCuanto(m.creado_en)}</span>
          </div>
          <Form accion={accionMensaje} className="flex flex-wrap items-end gap-3 p-5">
            <input type="hidden" name="id" value={m.id} />
            {m.error && <p className="basis-full text-sm text-aviso">{m.error}</p>}
            {canal === "correo" && <Campo etiqueta="Asunto" name="asunto" defaultValue={m.asunto ?? ""} className="basis-full" />}
            <Area name="texto" rows={canal === "correo" ? 8 : 5} defaultValue={m.texto} className="basis-full" />
            {m.estado === "revisar" ? (
              <>
                <Boton name="que" value="ya_salio">Sí salió</Boton>
                <Boton name="que" value="descartar" variante="peligro">No salió, descartar</Boton>
              </>
            ) : (
              <>
                {canal === "whatsapp" && (
                  <Selector name="numero" etiqueta="Sale desde" defaultValue={conectados[0]?.numero} className="min-w-56">
                    {conectados.length === 0 && <option value="">Ningún número conectado</option>}
                    {conectados.map((n) => <option key={n.numero} value={n.numero}>{NOMBRE_NUMERO[n.numero]}</option>)}
                  </Selector>
                )}
                <Boton name="que" value="enviar" enCurso="Enviando…" disabled={canal === "whatsapp" && conectados.length === 0}>Aprobar y enviar →</Boton>
                <Boton name="que" value="guardar" variante="suave">Guardar cambios</Boton>
                <Boton name="que" value="descartar" variante="peligro">Descartar</Boton>
              </>
            )}
          </Form>
        </li>
      ))}
    </ol>
  );
}
