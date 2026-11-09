import { crearMetrica, editarMetrica, guardarSemana } from "@/acciones/metricas";
import { Boton, Form } from "@/components/form";
import { Puerta } from "@/components/puerta";
import { Cabecera, Campo, Tarjeta, cx } from "@/components/ui";
import { exigirDb, filas } from "@/lib/db";
import { fechaLarga, hoyISO, lunesDe, sumarDias } from "@/lib/fechas";
import type { Metrica, ValorMetrica } from "@/lib/tipos";

const SEMANAS = 8;

export default function Metricas() {
  return (
    <>
      <Cabecera numero="07" eyebrow="Medir" titulo={<>Tu semana en <em>números</em></>}>
        Elige qué mides (mensajes, respuestas, reels, llamadas…) y ponle un objetivo semanal. Una fila por semana.
      </Cabecera>
      <Puerta><Contenido /></Puerta>
    </>
  );
}

async function Contenido() {
  const c = exigirDb();
  const esteLunes = lunesDe(hoyISO());
  const semanas = Array.from({ length: SEMANAS }, (_, i) => sumarDias(esteLunes, -7 * i));
  const [metricas, valores] = await Promise.all([
    c.from("metricas").select("*").order("posicion").then((r) => filas(r) as Metrica[]),
    c.from("metricas_valores").select("*").gte("semana", semanas.at(-1)!).then((r) => filas(r) as ValorMetrica[]),
  ]);
  const valor = (m: string, s: string) => valores.find((v) => v.metrica_id === m && v.semana === s)?.valor;

  return (
    <div className="space-y-10">
      {metricas.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metricas.map((m) => {
            const v = Number(valor(m.id, esteLunes) ?? 0);
            const pct = m.meta ? Math.min(100, Math.round((v / Number(m.meta)) * 100)) : null;
            return (
              <div key={m.id} className="border border-linea bg-[#FAF8F3] p-4">
                <p className="eyebrow !text-gris">{m.nombre}</p>
                <p className="mt-2"><span className="titulo text-4xl">{v}</span>{m.meta != null && <span className="text-gris"> / {m.meta}</span>}</p>
                {pct != null && (
                  <div className="mt-3 h-1.5 bg-crema"><div className={cx("h-full", pct >= 100 ? "bg-bien" : "bg-laton")} style={{ width: `${pct}%` }} /></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <section className="overflow-x-auto border border-linea bg-[#FAF8F3]">
        <div className="min-w-[760px]">
          <div className="grid border-b border-linea" style={{ gridTemplateColumns: `140px repeat(${metricas.length}, 1fr) 110px` }}>
            <span className="eyebrow p-3 !text-gris">Semana</span>
            {metricas.map((m) => <span key={m.id} className="eyebrow p-3 !text-gris">{m.nombre}</span>)}
            <span />
          </div>
          {semanas.map((s) => (
            <Form key={s} accion={guardarSemana} className="grid items-center border-b border-linea last:border-0" >
              <div className="grid items-center" style={{ gridTemplateColumns: `140px repeat(${metricas.length}, 1fr) 110px` }}>
                <input type="hidden" name="semana" value={s} />
                <span className={cx("p-3 font-mono text-xs", s === esteLunes ? "font-bold text-laton-2" : "text-gris")}>{s === esteLunes ? "Esta semana" : fechaLarga(s)}</span>
                {metricas.map((m) => {
                  const v = valor(m.id, s);
                  const ok = m.meta != null && v != null && Number(v) >= Number(m.meta);
                  return (
                    <span key={m.id} className="p-1.5">
                      <input name={`m_${m.id}`} type="number" step="any" defaultValue={v ?? ""} aria-label={`${m.nombre} ${s}`}
                        className={cx("min-h-11 w-full border bg-papel px-2 font-mono text-sm", ok ? "border-bien text-bien" : "border-linea")} />
                    </span>
                  );
                })}
                <span className="p-1.5"><Boton variante="suave" className="w-full !px-2">Guardar</Boton></span>
              </div>
            </Form>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta eyebrow="Nueva" titulo={<>Añadir <em>métrica</em></>}>
          <Form accion={crearMetrica} className="flex flex-wrap items-end gap-3">
            <Campo etiqueta="Nombre" name="nombre" placeholder="Historias publicadas" className="flex-1" />
            <Campo etiqueta="Objetivo semanal" name="meta" type="number" step="any" className="w-36" />
            <Boton variante="linea">Añadir</Boton>
          </Form>
        </Tarjeta>
        <Tarjeta eyebrow="Ajustes" titulo={<>Tus <em>métricas</em></>}>
          <ul className="space-y-2">
            {metricas.map((m) => (
              <li key={m.id}>
                <Form accion={editarMetrica} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <input name="nombre" defaultValue={m.nombre} aria-label="Nombre" className="min-h-11 flex-1 border border-linea bg-papel px-2 text-sm" />
                  <input name="meta" type="number" step="any" defaultValue={m.meta ?? ""} aria-label="Objetivo" className="min-h-11 w-24 border border-linea bg-papel px-2 font-mono text-sm" />
                  <Boton name="que" value="guardar" variante="suave">OK</Boton>
                  <Boton name="que" value="borrar" variante="peligro">Borrar</Boton>
                </Form>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>
    </div>
  );
}
