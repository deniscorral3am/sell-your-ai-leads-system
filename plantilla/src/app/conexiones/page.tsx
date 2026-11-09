import Link from "next/link";
import { guardarNegocio } from "@/acciones/conexiones";
import { Boton, Form } from "@/components/form";
import { Cabecera, Campo, Etiqueta, Tarjeta } from "@/components/ui";
import { leerConfig } from "@/lib/config";
import { estadoDb } from "@/lib/db";
import { estadoNumeros } from "@/lib/whatsapp";

export default async function Conexiones() {
  const c = leerConfig();
  const [db, numeros] = await Promise.all([estadoDb(), estadoNumeros(true)]);
  const conectados = numeros.filter((n) => n.conexion === "conectado").length;
  const lista = [
    { href: "/conexiones/supabase", n: "01", nombre: "Base de datos", que: "Supabase · donde se guarda todo", ok: db.estado === "lista", tiempo: "5 min" },
    { href: "/conexiones/apify", n: "02", nombre: "Buscador", que: "Apify · negocios de Google Maps", ok: !!c.apify.token, tiempo: "2 min" },
    { href: "/conexiones/whatsapp", n: "03", nombre: "WhatsApp", que: `Hasta 3 números · ${conectados} conectados`, ok: conectados > 0, tiempo: "3 min/número" },
    { href: "/conexiones/correo", n: "04", nombre: "Correo", que: "Gmail · correos en frío", ok: !!c.correo.clave, tiempo: "3 min" },
    { href: "/conexiones/meta", n: "05", nombre: "Meta Ads", que: "Tus anuncios, a través de Claude", ok: false, tiempo: "5 min" },
  ];
  return (
    <>
      <Cabecera numero="08" eyebrow="Ajustes" titulo={<>Conecta lo que <em>uses</em></>}>
        Empieza por la base de datos. El resto es independiente: conecta solo lo que vayas a usar.
      </Cabecera>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-linea border border-linea bg-[#FAF8F3]">
          {lista.map((x) => (
            <li key={x.href}>
              <Link href={x.href} className="flex min-h-20 items-center gap-5 px-5 py-4 hover:bg-crema/50">
                <span className="titulo text-3xl text-laton-2">{x.n}</span>
                <span className="flex-1"><span className="block font-semibold">{x.nombre}</span><span className="text-sm text-gris">{x.que}</span></span>
                {x.href === "/conexiones/meta" ? <Etiqueta>Con Claude</Etiqueta> : x.ok ? <Etiqueta tono="bien">Conectado</Etiqueta> : <Etiqueta>{x.tiempo}</Etiqueta>}
                <span className="font-mono">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <Tarjeta eyebrow="Tú" titulo={<>Tus <em>datos</em></>} className="self-start">
          <Form accion={guardarNegocio} className="space-y-3">
            <Campo etiqueta="Tu nombre" name="tuNombre" defaultValue={c.negocio.tuNombre} placeholder="Denis" />
            <Campo etiqueta="Tu empresa" name="empresa" defaultValue={c.negocio.empresa} placeholder="Sell Your AI" />
            <Campo etiqueta="Qué vendes (una frase)" name="queVendes" defaultValue={c.negocio.queVendes} placeholder="Recepcionista con IA para clínicas" ayuda="Lo usa Claude en /personalizar." />
            <Campo etiqueta="Prefijo de país" name="prefijoPais" defaultValue={c.negocio.prefijoPais} className="w-32" ayuda="34 = España. Se pone delante de los móviles de 9 cifras." />
            <Boton>Guardar</Boton>
          </Form>
        </Tarjeta>
      </div>
    </>
  );
}
