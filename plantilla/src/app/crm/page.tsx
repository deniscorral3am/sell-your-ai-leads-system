import { actualizarProspecto } from "@/acciones/prospectos";
import { Boton, Form } from "@/components/form";
import { Puerta } from "@/components/puerta";
import { Cabecera, Etiqueta } from "@/components/ui";
import { exigirDb, filas } from "@/lib/db";
import { euros, haceCuanto } from "@/lib/fechas";
import type { Prospecto } from "@/lib/tipos";
import { ETAPAS } from "@/lib/tipos";

const COLUMNAS = ["contactado", "respondio", "llamada", "propuesta", "cliente"] as const;

export default function CRM() {
  return (
    <>
      <Cabecera numero="04" eyebrow="Cerrar" titulo={<>Del primer mensaje al <em>cliente</em></>}>
        Cada negocio avanza solo hasta «Ha respondido» (al enviar y al comprobar respuestas). A partir de ahí lo mueves tú.
      </Cabecera>
      <Puerta><Tablero /></Puerta>
    </>
  );
}

async function Tablero() {
  const prospectos = filas(
    await exigirDb().from("prospectos").select("*").in("etapa", [...COLUMNAS]).order("actualizado_en", { ascending: false }).limit(500),
  ) as Prospecto[];
  return (
    <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <div className="grid min-w-[1100px] grid-cols-5 gap-3">
        {COLUMNAS.map((col) => {
          const lista = prospectos.filter((p) => p.etapa === col);
          const total = lista.reduce((s, p) => s + Number(p.valor ?? 0), 0);
          return (
            <section key={col} className="flex flex-col border border-linea bg-papel-2/60">
              <header className="border-b border-linea px-3 py-3">
                <p className="eyebrow">{ETAPAS.find((e) => e.id === col)?.nombre}</p>
                <p className="mt-1 flex items-baseline justify-between">
                  <span className="titulo text-3xl">{lista.length}</span>
                  {total > 0 && <span className="font-mono text-xs text-gris">{euros(total)}</span>}
                </p>
              </header>
              <ul className="space-y-2 p-2">
                {lista.map((p) => <TarjetaCRM key={p.id} p={p} />)}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TarjetaCRM({ p }: { p: Prospecto }) {
  return (
    <li className="border border-linea bg-[#FAF8F3] p-3 text-sm">
      <details>
        <summary className="cursor-pointer list-none">
          <p className="font-semibold leading-snug">{p.nombre}</p>
          <p className="mt-1 font-mono text-[11px] text-gris">{p.telefono ?? p.email ?? ""}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.valor != null && <Etiqueta tono="tinta">{euros(Number(p.valor))}</Etiqueta>}
            {p.etapa === "respondio" && p.respondio_en && <Etiqueta tono="bien">{haceCuanto(p.respondio_en)}</Etiqueta>}
          </div>
          {p.notas && <p className="mt-2 line-clamp-2 text-xs text-gris">{p.notas}</p>}
        </summary>
        <Form accion={actualizarProspecto} className="mt-3 space-y-2 border-t border-linea pt-3">
          <input type="hidden" name="id" value={p.id} />
          <select name="etapa" defaultValue={p.etapa} className="min-h-11 w-full border border-linea bg-papel px-2">
            {ETAPAS.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <input name="valor" type="number" step="any" defaultValue={p.valor ?? ""} placeholder="Valor (€)" className="min-h-11 w-full border border-linea bg-papel px-2" />
          <textarea name="notas" rows={3} defaultValue={p.notas ?? ""} placeholder="Notas" className="w-full border border-linea bg-papel px-2 py-1.5" />
          {p.telefono && (
            <a className="block text-xs text-laton-2 underline" target="_blank" rel="noreferrer" href={`https://wa.me/${p.telefono.replace(/\D/g, "")}`}>Abrir su chat</a>
          )}
          <Boton className="w-full">Guardar</Boton>
        </Form>
      </details>
    </li>
  );
}
