"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { Resultado } from "@/lib/tipos";
import { claseBoton, cx, type Variante } from "./ui";

export type Accion = (previo: Resultado, datos: FormData) => Promise<Resultado>;

// Formulario que llama a una acción del servidor y enseña el resultado debajo.
export function Form({ accion, className, children }: { accion: Accion; className?: string; children: ReactNode }) {
  const [resultado, enviar] = useActionState(accion, null);
  return (
    <form action={enviar} className={className}>
      {children}
      {resultado && (
        <p role="status" className={cx(
          "basis-full border-l-2 px-3 py-2 text-sm font-medium",
          resultado.ok ? "border-bien bg-bien-suave text-bien" : "border-aviso bg-aviso-suave text-aviso",
        )}>{resultado.mensaje}</p>
      )}
    </form>
  );
}

export function Boton({ children, variante, enCurso = "Un momento…", className, ...p }: {
  children: ReactNode; variante?: Variante; enCurso?: string; className?: string; name?: string; value?: string; disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" {...p} disabled={pending || p.disabled} className={claseBoton(variante, className)}>
      {pending ? enCurso : children}
    </button>
  );
}
