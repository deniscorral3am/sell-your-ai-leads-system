import Link from "next/link";
import type { ReactNode } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type Variante = "tinta" | "linea" | "suave" | "peligro";

// Botones cuadrados, en mayúsculas, como en sellyourai.io.
export function claseBoton(v: Variante = "tinta", extra?: string) {
  return cx(
    "inline-flex min-h-11 items-center justify-center gap-2 px-5 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
    v === "tinta" && "bg-tinta text-papel hover:bg-laton-2",
    v === "linea" && "border border-tinta text-tinta hover:bg-tinta hover:text-papel",
    v === "suave" && "border border-linea bg-papel text-tinta hover:border-tinta",
    v === "peligro" && "border border-linea text-aviso hover:border-aviso",
    extra,
  );
}

export function BotonLink({ href, children, variante, className }: { href: string; children: ReactNode; variante?: Variante; className?: string }) {
  return <Link href={href} className={claseBoton(variante, className)}>{children}</Link>;
}

export function Cabecera({ numero, eyebrow, titulo, children }: { numero: string; eyebrow: string; titulo: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-10 border-b border-linea pb-8">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-laton-2">§ {numero}</span>
        <span className="eyebrow rounded-full border border-linea px-3 py-1">{eyebrow}</span>
      </div>
      <h1 className="titulo mt-5 text-5xl md:text-6xl">{titulo}</h1>
      {children && <div className="mt-4 max-w-2xl text-[17px] leading-relaxed text-gris">{children}</div>}
    </header>
  );
}

export function Tarjeta({ children, className, titulo, eyebrow }: { children: ReactNode; className?: string; titulo?: ReactNode; eyebrow?: string }) {
  return (
    <section className={cx("border border-linea bg-[#FAF8F3] p-6", className)}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      {titulo && <h2 className="titulo mb-4 text-3xl">{titulo}</h2>}
      {children}
    </section>
  );
}

export function Dato({ etiqueta, valor, nota, destacado }: { etiqueta: string; valor: ReactNode; nota?: ReactNode; destacado?: boolean }) {
  return (
    <div className={cx("border p-5", destacado ? "border-tinta bg-tinta text-papel" : "border-linea bg-[#FAF8F3]")}>
      <p className={cx("eyebrow", destacado && "!text-laton")}>{etiqueta}</p>
      <p className="titulo mt-3 text-5xl">{valor}</p>
      {nota && <p className={cx("mt-2 text-sm", destacado ? "text-crema" : "text-gris")}>{nota}</p>}
    </div>
  );
}

const claseCampo = "min-h-11 w-full border border-linea bg-papel px-3 py-2 text-[15px] text-tinta placeholder:text-gris/70 focus:border-tinta focus:outline-none";

export function Campo({ etiqueta, ayuda, className, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; ayuda?: ReactNode }) {
  return (
    <label className={cx("block", className)}>
      <span className="eyebrow mb-1.5 block !text-gris">{etiqueta}</span>
      <input {...p} className={claseCampo} />
      {ayuda && <span className="mt-1 block text-xs text-gris">{ayuda}</span>}
    </label>
  );
}

export function Area({ etiqueta, ayuda, className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { etiqueta?: string; ayuda?: ReactNode }) {
  return (
    <label className={cx("block", className)}>
      {etiqueta && <span className="eyebrow mb-1.5 block !text-gris">{etiqueta}</span>}
      <textarea {...p} className={cx(claseCampo, "leading-relaxed")} />
      {ayuda && <span className="mt-1 block text-xs text-gris">{ayuda}</span>}
    </label>
  );
}

export function Selector({ etiqueta, children, className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { etiqueta?: string }) {
  return (
    <label className={cx("block", className)}>
      {etiqueta && <span className="eyebrow mb-1.5 block !text-gris">{etiqueta}</span>}
      <select {...p} className={claseCampo}>{children}</select>
    </label>
  );
}

export function Etiqueta({ children, tono = "neutro" }: { children: ReactNode; tono?: "neutro" | "bien" | "aviso" | "laton" | "tinta" }) {
  return (
    <span className={cx(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em]",
      tono === "neutro" && "border-linea text-gris",
      tono === "bien" && "border-bien/40 bg-bien-suave text-bien",
      tono === "aviso" && "border-aviso/40 bg-aviso-suave text-aviso",
      tono === "laton" && "border-laton/50 text-laton-2",
      tono === "tinta" && "border-tinta bg-tinta text-papel",
    )}>{children}</span>
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return <div className="border border-dashed border-linea px-6 py-12 text-center text-gris">{children}</div>;
}

export function Paso({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[44px_1fr] gap-4 border-t border-linea py-6">
      <span className="titulo text-4xl text-laton-2">{String(n).padStart(2, "0")}</span>
      <div>
        <h3 className="mb-2 text-lg font-semibold">{titulo}</h3>
        <div className="space-y-3 text-[15px] leading-relaxed text-tinta/85">{children}</div>
      </div>
    </li>
  );
}
