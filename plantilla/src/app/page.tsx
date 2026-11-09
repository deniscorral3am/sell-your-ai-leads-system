import Link from "next/link";
import { Puerta } from "@/components/puerta";
import { BotonLink, Cabecera, Dato, Tarjeta, Etiqueta } from "@/components/ui";
import { leerConfig } from "@/lib/config";
import { enviadosHoy } from "@/lib/consultas";
import { contar, estadoDb, exigirDb, filas } from "@/lib/db";
import { euros, fechaLarga, hoyISO, saludo } from "@/lib/fechas";
import type { Llamada } from "@/lib/tipos";
import { estadoNumeros } from "@/lib/whatsapp";

export default async function Inicio() {
  const config = leerConfig();
  const nombre = config.negocio.tuNombre.split(" ")[0];
  return (
    <>
      <Cabecera numero="00" eyebrow="Panel de hoy" titulo={<>{saludo()}{nombre ? <>, <em>{nombre}</em></> : null}.</>}>
        Busca negocios, revisa cada mensaje antes de que salga y lleva a los que contestan hasta la llamada.
      </Cabecera>
      <Pasos />
      <Puerta>
        <Resumen />
      </Puerta>
    </>
  );
}

async function Pasos() {
  const c = leerConfig();
  const db = await estadoDb();
  const numeros = await estadoNumeros(true);
  const pasos = [
    { hecho: !!c.negocio.tuNombre, texto: "Tus datos (nombre, empresa)", href: "/conexiones" },
    { hecho: db.estado === "lista", texto: "Base de datos (Supabase)", href: "/conexiones/supabase" },
    { hecho: !!c.apify.token, texto: "Buscador de negocios (Apify)", href: "/conexiones/apify" },
    { hecho: numeros.some((n) => n.conexion === "conectado") || !!c.correo.clave, texto: "Un canal: WhatsApp o correo", href: "/conexiones" },
  ];
  if (pasos.every((p) => p.hecho)) return null;
  return (
    <Tarjeta eyebrow="Puesta en marcha" titulo={<>Te quedan <em>{pasos.filter((p) => !p.hecho).length}</em> pasos</>} className="mb-10">
      <ol className="grid gap-2 md:grid-cols-2">
        {pasos.map((p, i) => (
          <li key={p.texto}>
            <Link href={p.href} className="flex min-h-11 items-center gap-3 border border-linea px-4 hover:border-tinta">
              <span className="font-mono text-xs text-laton-2">{String(i + 1).padStart(2, "0")}</span>
              <span className={p.hecho ? "flex-1 text-gris line-through" : "flex-1"}>{p.texto}</span>
              {p.hecho ? <Etiqueta tono="bien">Hecho</Etiqueta> : <span className="font-mono text-sm">→</span>}
            </Link>
          </li>
        ))}
      </ol>
    </Tarjeta>
  );
}

async function Resumen() {
  const c = exigirDb();
  const hoy = hoyISO();
  const [prospectos, enCola, waHoy, correoHoy, respondieron, clientes, llamadas, abiertos] = await Promise.all([
    contar(c.from("prospectos").select("id", { count: "exact", head: true })),
    contar(c.from("mensajes").select("id", { count: "exact", head: true }).in("estado", ["pendiente", "revisar"])),
    enviadosHoy(c, "whatsapp"),
    enviadosHoy(c, "correo"),
    contar(c.from("prospectos").select("id", { count: "exact", head: true }).eq("etapa", "respondio")),
    contar(c.from("prospectos").select("id", { count: "exact", head: true }).eq("etapa", "cliente")),
    filas(await c.from("llamadas").select("*").eq("resultado", "pendiente").gte("fecha", hoy).order("fecha").order("hora").limit(5)) as Llamada[],
    filas(await c.from("prospectos").select("valor").in("etapa", ["respondio", "llamada", "propuesta"]).not("valor", "is", null)) as { valor: number }[],
  ]);
  const pipeline = abiertos.reduce((s, p) => s + Number(p.valor), 0);
  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dato etiqueta="En la cola" valor={enCola} nota="Esperando tu visto bueno" destacado={enCola > 0} />
        <Dato etiqueta="Enviados hoy" valor={waHoy + correoHoy} nota={`${waHoy} WhatsApp · ${correoHoy} correo`} />
        <Dato etiqueta="Han respondido" valor={respondieron} nota="Contéstales hoy" />
        <Dato etiqueta="Pipeline abierto" valor={euros(pipeline)} nota={`${clientes} ${clientes === 1 ? "cliente" : "clientes"} · ${prospectos} prospectos`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Tarjeta eyebrow="Lo siguiente" titulo={<>Qué toca <em>ahora</em></>}>
          <ul className="divide-y divide-linea">
            {enCola > 0 && <Fila href="/whatsapp" texto={`Revisa y envía los ${enCola} mensajes de la cola`} />}
            {respondieron > 0 && <Fila href="/crm" texto={`${respondieron} te han contestado: agenda la llamada`} />}
            <Fila href="/prospectos" texto="Busca una tanda nueva de negocios" />
            <Fila href="/metricas" texto="Apunta los números de la semana" />
          </ul>
        </Tarjeta>
        <Tarjeta eyebrow="Agenda" titulo={<>Próximas <em>llamadas</em></>}>
          {llamadas.length === 0 ? (
            <p className="text-gris">Ninguna llamada pendiente. <Link className="underline" href="/llamadas">Apunta una</Link>.</p>
          ) : (
            <ul className="divide-y divide-linea">
              {llamadas.map((l) => (
                <li key={l.id} className="flex items-baseline justify-between gap-3 py-3">
                  <span className="font-medium">{l.nombre}</span>
                  <span className="font-mono text-xs text-gris">{fechaLarga(l.fecha)}{l.hora ? ` · ${l.hora.slice(0, 5)}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
          <BotonLink href="/llamadas" variante="suave" className="mt-4">Ver todas</BotonLink>
        </Tarjeta>
      </div>
    </div>
  );
}

function Fila({ href, texto }: { href: string; texto: string }) {
  return (
    <li>
      <Link href={href} className="flex min-h-12 items-center justify-between gap-4 py-2 hover:text-laton-2">
        <span>{texto}</span><span className="font-mono">→</span>
      </Link>
    </li>
  );
}
