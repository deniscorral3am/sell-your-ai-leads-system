import { crearLlamada, resultadoLlamada } from "@/acciones/llamadas";
import { Boton, Form } from "@/components/form";
import { Puerta } from "@/components/puerta";
import { Cabecera, Campo, Etiqueta, Selector, Tarjeta, Vacio } from "@/components/ui";
import { exigirDb, filas } from "@/lib/db";
import { fechaLarga, hoyISO } from "@/lib/fechas";
import type { Llamada, Prospecto } from "@/lib/tipos";

const RESULTADOS = { pendiente: "Pendiente", hecha: "Hecha", no_vino: "No vino", cerrada: "Cerrada" } as const;

export default function Llamadas() {
  return (
    <>
      <Cabecera numero="05" eyebrow="Agenda" titulo={<>Llamadas de <em>venta</em></>}>
        Apunta cada llamada para que no se te escape ninguna. Si la cierras, el negocio pasa a Cliente en el CRM.
      </Cabecera>
      <Puerta><Contenido /></Puerta>
    </>
  );
}

async function Contenido() {
  const c = exigirDb();
  const [llamadas, candidatos] = await Promise.all([
    c.from("llamadas").select("*").order("fecha", { ascending: false }).order("hora", { ascending: false }).limit(200).then((r) => filas(r) as Llamada[]),
    c.from("prospectos").select("id, nombre").in("etapa", ["respondio", "llamada", "propuesta", "contactado"]).order("actualizado_en", { ascending: false }).limit(200)
      .then((r) => filas(r) as Pick<Prospecto, "id" | "nombre">[]),
  ]);
  const hoy = hoyISO();
  const proximas = llamadas.filter((l) => l.fecha >= hoy && l.resultado === "pendiente").reverse();
  const pasadas = llamadas.filter((l) => !(l.fecha >= hoy && l.resultado === "pendiente"));
  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
      <Tarjeta eyebrow="Nueva" titulo={<>Apuntar <em>llamada</em></>} className="self-start">
        <Form accion={crearLlamada} className="space-y-3">
          <Selector etiqueta="Del CRM (opcional)" name="prospecto_id" defaultValue="">
            <option value="">— Otro —</option>
            {candidatos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Selector>
          <Campo etiqueta="Con quién" name="nombre" required placeholder="Nombre y negocio" />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Día" name="fecha" type="date" defaultValue={hoy} required />
            <Campo etiqueta="Hora" name="hora" type="time" />
          </div>
          <Campo etiqueta="Dónde" name="donde" placeholder="Meet, teléfono…" />
          <Campo etiqueta="Nota" name="nota" placeholder="Lo que te contó" />
          <Boton>Apuntar</Boton>
        </Form>
      </Tarjeta>
      <div className="space-y-8">
        <Bloque titulo={<>Próximas <em>({proximas.length})</em></>} llamadas={proximas} />
        <Bloque titulo={<>Anteriores</>} llamadas={pasadas} />
      </div>
    </div>
  );
}

function Bloque({ titulo, llamadas }: { titulo: React.ReactNode; llamadas: Llamada[] }) {
  return (
    <section>
      <h2 className="titulo mb-3 text-3xl">{titulo}</h2>
      {llamadas.length === 0 ? <Vacio>Nada por aquí.</Vacio> : (
        <ul className="divide-y divide-linea border border-linea bg-[#FAF8F3]">
          {llamadas.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-32 font-mono text-xs text-gris">{fechaLarga(l.fecha)}{l.hora ? ` · ${l.hora.slice(0, 5)}` : ""}</span>
              <span className="min-w-40 flex-1">
                <span className="font-semibold">{l.nombre}</span>
                {(l.donde || l.nota) && <span className="block text-xs text-gris">{[l.donde, l.nota].filter(Boolean).join(" · ")}</span>}
              </span>
              <Etiqueta tono={l.resultado === "cerrada" ? "bien" : l.resultado === "no_vino" ? "aviso" : "neutro"}>{RESULTADOS[l.resultado]}</Etiqueta>
              <Form accion={resultadoLlamada} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={l.id} />
                <select name="resultado" defaultValue={l.resultado} className="min-h-11 border border-linea bg-papel px-2 text-sm">
                  {Object.entries(RESULTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  <option value="borrar">Borrar</option>
                </select>
                <Boton variante="suave">OK</Boton>
              </Form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
