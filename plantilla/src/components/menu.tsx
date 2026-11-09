"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

export const SECCIONES = [
  { href: "/", nombre: "Inicio", n: "00" },
  { href: "/prospectos", nombre: "Prospectos", n: "01" },
  { href: "/whatsapp", nombre: "WhatsApp", n: "02" },
  { href: "/correo", nombre: "Correo", n: "03" },
  { href: "/crm", nombre: "CRM", n: "04" },
  { href: "/llamadas", nombre: "Llamadas", n: "05" },
  { href: "/anuncios", nombre: "Anuncios", n: "06" },
  { href: "/metricas", nombre: "Métricas", n: "07" },
  { href: "/conexiones", nombre: "Conexiones", n: "08" },
];

export function Menu({ pendientes }: { pendientes: { whatsapp: number; correo: number } }) {
  const ruta = usePathname();
  const activo = (href: string) => (href === "/" ? ruta === "/" : ruta.startsWith(href));
  return (
    <nav className="flex shrink-0 flex-col border-linea bg-tinta text-papel md:sticky md:top-0 md:h-screen md:w-60 md:border-r">
      <Link href="/" className="flex items-center gap-3 border-b border-tinta-2 px-5 py-5">
        <Image src="/icono.png" alt="" width={30} height={30} className="rounded-sm" />
        <span className="leading-tight">
          <span className="block font-serif text-xl">Sell Your <em className="text-laton">AI</em></span>
          <span className="block font-mono text-[9.5px] uppercase tracking-[0.16em] text-crema/60">Leads System</span>
        </span>
      </Link>
      <ul className="flex gap-1 overflow-x-auto px-2 py-3 md:flex-col md:overflow-visible">
        {SECCIONES.map((s) => {
          const extra = s.href === "/whatsapp" ? pendientes.whatsapp : s.href === "/correo" ? pendientes.correo : 0;
          return (
            <li key={s.href}>
              <Link href={s.href} className={cx(
                "flex min-h-11 items-center gap-3 whitespace-nowrap px-3 text-[14px] transition-colors",
                activo(s.href) ? "bg-papel text-tinta" : "text-crema/80 hover:bg-tinta-2 hover:text-papel",
              )}>
                <span className={cx("font-mono text-[10px]", activo(s.href) ? "text-laton-2" : "text-crema/40")}>{s.n}</span>
                <span className="flex-1">{s.nombre}</span>
                {extra > 0 && <span className="bg-laton px-1.5 font-mono text-[10px] text-tinta">{extra}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-auto hidden px-5 py-5 font-mono text-[10px] leading-relaxed text-crema/40 md:block">
        Corre en tu ordenador.<br />Nada sale sin tu clic.
      </p>
    </nav>
  );
}
