import { anadirAMano, buscar } from "@/acciones/prospectos";
import { Boton, Form } from "@/components/form";
import { Puerta } from "@/components/puerta";
import { Cabecera, Campo, Tarjeta, Vacio } from "@/components/ui";
import { leerConfig } from "@/lib/config";
import { exigirDb, filas } from "@/lib/db";
import type { Prospecto } from "@/lib/tipos";
import { ETAPAS } from "@/lib/tipos";
import { Tabla } from "./tabla";

export default async function Prospectos({ searchParams }: { searchParams: Promise<{ etapa?: string; busqueda?: string }> }) {
  const filtro = await searchParams;
  return (
    <>
      <Cabecera numero="01" eyebrow="Encontrar" titulo={<>Negocios a los que <em>escribir</em></>}>
        Busca por tipo de negocio y ciudad. Cada uno llega con su gancho: el detalle real con el que abre tu mensaje.
      </Cabecera>
      <Puerta>
        <div className="mb-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Buscador />
          <AMano />
        </div>
        <Lista etapa={filtro.etapa} busqueda={filtro.busqueda} />
      </Puerta>
    </>
  );
}

function Buscador() {
  const conApify = !!leerConfig().apify.token;
  return (
    <Tarjeta eyebrow="Google Maps" titulo={<>Buscar <em>negocios</em></>}>
      <Form accion={buscar} className="flex flex-wrap items-end gap-3">
        <Campo etiqueta="Tipo de negocio" name="categoria" placeholder="clínicas dentales" required className="min-w-48 flex-1" />
        <Campo etiqueta="Ciudad" name="ciudad" placeholder="Valencia" required className="min-w-40 flex-1" />
        <Campo etiqueta="Cuántos" name="cantidad" type="number" min={5} max={200} defaultValue={30} className="w-24" />
        <label className="flex min-h-11 basis-full items-center gap-2 text-sm text-gris">
          <input type="checkbox" name="emails" value="si" className="size-4 accent-[#0E0E0D]" />
          Buscar también el email en su web (extra de pago en Apify, para la cola de correo)
        </label>
        <Boton enCurso="Buscando… (1-3 min)" disabled={!conApify}>Buscar →</Boton>
        {!conApify && <p className="text-sm text-aviso">Conecta Apify en Conexiones para buscar.</p>}
      </Form>
    </Tarjeta>
  );
}

function AMano() {
  return (
    <Tarjeta eyebrow="A mano" titulo={<>Añadir <em>uno</em></>}>
      <Form accion={anadirAMano} className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Nombre" name="nombre" required className="col-span-2" />
        <Campo etiqueta="Teléfono" name="telefono" placeholder="612 345 678" />
        <Campo etiqueta="Email" name="email" type="email" />
        <Campo etiqueta="Ciudad" name="ciudad" />
        <Campo etiqueta="Web" name="web" />
        <Campo etiqueta="Gancho (opcional)" name="gancho" placeholder="lo que has visto de ellos" className="col-span-2" />
        <div className="col-span-2"><Boton variante="linea">Añadir</Boton></div>
      </Form>
    </Tarjeta>
  );
}

async function Lista({ etapa, busqueda }: { etapa?: string; busqueda?: string }) {
  const c = exigirDb();
  let q = c.from("prospectos").select("*").order("creado_en", { ascending: false }).limit(300);
  if (etapa) q = q.eq("etapa", etapa);
  else q = q.neq("etapa", "descartado");
  if (busqueda) q = q.eq("busqueda", busqueda);
  const [prospectos, busquedas] = await Promise.all([
    q.then((r) => filas(r) as Prospecto[]),
    c.from("prospectos").select("busqueda").not("busqueda", "is", null).order("creado_en", { ascending: false }).limit(1000)
      .then((r) => [...new Set((filas(r) as { busqueda: string }[]).map((b) => b.busqueda))]),
  ]);
  return (
    <section>
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="eyebrow mb-1.5 block !text-gris">Etapa</span>
          <select name="etapa" defaultValue={etapa ?? ""} className="min-h-11 border border-linea bg-papel px-3">
            <option value="">Todas (menos descartados)</option>
            {ETAPAS.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="eyebrow mb-1.5 block !text-gris">Búsqueda</span>
          <select name="busqueda" defaultValue={busqueda ?? ""} className="min-h-11 border border-linea bg-papel px-3">
            <option value="">Todas</option>
            {busquedas.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        <button className="min-h-11 border border-linea px-4 text-sm hover:border-tinta">Filtrar</button>
        <span className="ml-auto font-mono text-xs text-gris">{prospectos.length} negocios</span>
      </form>
      {prospectos.length === 0 ? <Vacio>Aún no hay negocios aquí. Lanza tu primera búsqueda arriba.</Vacio> : <Tabla prospectos={prospectos} />}
    </section>
  );
}
