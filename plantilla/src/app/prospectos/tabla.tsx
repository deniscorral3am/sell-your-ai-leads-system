"use client";

import { useState } from "react";
import { aLaCola } from "@/acciones/prospectos";
import { Boton, Form } from "@/components/form";
import { Etiqueta } from "@/components/ui";
import type { Prospecto } from "@/lib/tipos";
import { nombreEtapa } from "@/lib/tipos";

export function Tabla({ prospectos }: { prospectos: Prospecto[] }) {
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const todos = marcados.size === prospectos.length;
  const alternar = (id: string) => setMarcados((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  return (
    <Form accion={aLaCola} className="flex flex-wrap gap-3">
      {[...marcados].map((id) => <input key={id} type="hidden" name="ids" value={id} />)}
      <div className="sticky top-0 z-10 flex w-full flex-wrap items-center gap-2 border border-linea bg-papel p-3">
        <span className="mr-auto font-mono text-xs text-gris">{marcados.size} marcados</span>
        <Boton name="que" value="whatsapp" disabled={!marcados.size}>A la cola de WhatsApp</Boton>
        <Boton name="que" value="correo" variante="linea" disabled={!marcados.size}>A la cola de correo</Boton>
        <Boton name="que" value="descartar" variante="peligro" disabled={!marcados.size}>Descartar</Boton>
      </div>
      <div className="w-full overflow-x-auto border border-linea bg-[#FAF8F3]">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-linea">
            <tr className="eyebrow !text-gris">
              <th className="w-10 p-3"><input type="checkbox" aria-label="Marcar todos" checked={todos} onChange={() => setMarcados(todos ? new Set() : new Set(prospectos.map((p) => p.id)))} className="size-4 accent-[#0E0E0D]" /></th>
              <th className="p-3 font-medium">Negocio</th>
              <th className="p-3 font-medium">Contacto</th>
              <th className="p-3 font-medium">Google</th>
              <th className="p-3 font-medium">Gancho</th>
              <th className="p-3 font-medium">Etapa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linea">
            {prospectos.map((p) => (
              <tr key={p.id} className={marcados.has(p.id) ? "bg-crema/60" : "hover:bg-crema/30"}>
                <td className="p-3 align-top"><input type="checkbox" checked={marcados.has(p.id)} onChange={() => alternar(p.id)} aria-label={`Marcar ${p.nombre}`} className="size-4 accent-[#0E0E0D]" /></td>
                <td className="p-3 align-top">
                  <p className="font-semibold">{p.nombre}</p>
                  <p className="text-xs text-gris">{[p.categoria, p.ciudad].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="p-3 align-top font-mono text-xs leading-5">
                  {p.telefono ? <p>{p.telefono}</p> : <p className="text-gris">sin teléfono</p>}
                  {p.email && <p className="text-gris">{p.email}</p>}
                  {p.web && <a href={p.web} target="_blank" rel="noreferrer" className="text-laton-2 underline">web</a>}
                </td>
                <td className="p-3 align-top font-mono text-xs">
                  {p.nota != null ? <>{p.nota.toLocaleString("es-ES")} ★ · {p.resenas ?? 0}</> : "—"}
                  {p.maps_url && <> · <a href={p.maps_url} target="_blank" rel="noreferrer" className="text-laton-2 underline">maps</a></>}
                </td>
                <td className="max-w-xs p-3 align-top text-xs leading-5 text-tinta/80">{p.gancho}</td>
                <td className="p-3 align-top"><Etiqueta tono={p.etapa === "respondio" || p.etapa === "cliente" ? "bien" : p.etapa === "nuevo" ? "neutro" : "laton"}>{nombreEtapa(p.etapa)}</Etiqueta></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Form>
  );
}
