import { Puerta } from "@/components/puerta";
import { Cabecera, Dato, Etiqueta, Tarjeta, Vacio } from "@/components/ui";
import { exigirDb, filas } from "@/lib/db";
import { euros, fechaLarga, haceCuanto } from "@/lib/fechas";
import type { Anuncio } from "@/lib/tipos";

export default function Anuncios() {
  return (
    <>
      <Cabecera numero="06" eyebrow="Medir" titulo={<>Tus <em>anuncios</em> de Meta</>}>
        Gasto, resultados y coste por resultado. Lo trae Claude: abre Claude Code en esta carpeta y escribe <code className="font-mono text-sm">/actualizar-anuncios</code>.
      </Cabecera>
      <Puerta><Contenido /></Puerta>
    </>
  );
}

async function Contenido() {
  const anuncios = filas(await exigirDb().from("anuncios").select("*").order("gasto", { ascending: false })) as Anuncio[];
  if (anuncios.length === 0)
    return <Vacio>Aún no hay datos. En Claude Code: <code className="font-mono">/actualizar-anuncios</code> (antes conecta Meta en Conexiones).</Vacio>;
  const moneda = anuncios[0].moneda || "EUR";
  const gasto = anuncios.reduce((s, a) => s + Number(a.gasto), 0);
  const resultados = anuncios.reduce((s, a) => s + Number(a.resultados), 0);
  const conCoste = anuncios.filter((a) => a.resultados > 0).map((a) => ({ ...a, coste: a.gasto / a.resultados }));
  const mejor = [...conCoste].sort((a, b) => a.coste - b.coste)[0];
  return (
    <div className="space-y-8">
      <p className="font-mono text-xs text-gris">
        {anuncios[0].desde && anuncios[0].hasta ? `Del ${fechaLarga(anuncios[0].desde)} al ${fechaLarga(anuncios[0].hasta)} · ` : ""}actualizado {haceCuanto(anuncios[0].actualizado_en)}
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Dato etiqueta="Gasto" valor={euros(gasto, moneda)} />
        <Dato etiqueta="Resultados" valor={resultados.toLocaleString("es-ES")} />
        <Dato etiqueta="Coste por resultado" valor={resultados ? euros(gasto / resultados, moneda) : "—"} destacado nota={mejor ? `Mejor: ${mejor.nombre}` : undefined} />
      </div>
      <Tarjeta className="overflow-x-auto !p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-linea"><tr className="eyebrow !text-gris">
            <th className="p-4 font-medium">Campaña</th><th className="p-4 font-medium">Estado</th>
            <th className="p-4 text-right font-medium">Gasto</th><th className="p-4 text-right font-medium">Resultados</th><th className="p-4 text-right font-medium">Coste</th>
          </tr></thead>
          <tbody className="divide-y divide-linea">
            {anuncios.map((a) => (
              <tr key={a.id}>
                <td className="p-4"><p className="font-medium">{a.nombre}</p>{a.tipo_resultado && <p className="text-xs text-gris">{a.tipo_resultado}</p>}</td>
                <td className="p-4"><Etiqueta tono={a.estado === "ACTIVE" ? "bien" : "neutro"}>{a.estado === "ACTIVE" ? "Activa" : a.estado === "PAUSED" ? "En pausa" : a.estado ?? "—"}</Etiqueta></td>
                <td className="p-4 text-right font-mono">{euros(Number(a.gasto), moneda)}</td>
                <td className="p-4 text-right font-mono">{Number(a.resultados).toLocaleString("es-ES")}</td>
                <td className="p-4 text-right font-mono">{a.resultados > 0 ? euros(a.gasto / a.resultados, moneda) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Tarjeta>
    </div>
  );
}
