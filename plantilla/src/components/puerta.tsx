import type { ReactNode } from "react";
import { estadoDb } from "@/lib/db";
import { BotonLink, Tarjeta } from "./ui";

// Envuelve las pantallas que necesitan la base de datos.
export async function Puerta({ children }: { children: ReactNode }) {
  const { estado, detalle } = await estadoDb();
  if (estado === "lista") return <>{children}</>;
  return (
    <Tarjeta eyebrow="Antes de empezar" titulo={estado === "sin_tablas" ? <>Faltan las <em>tablas</em></> : <>Conecta tu <em>base de datos</em></>}>
      <p className="mb-5 max-w-xl text-gris">
        {estado === "sin_configurar" && "Todo lo que encuentres y envíes se guarda en tu propio Supabase. Son 5 minutos."}
        {estado === "sin_tablas" && "La conexión funciona, pero la base está vacía. En Claude Code escribe /conectar y las crea él."}
        {estado === "error" && detalle}
      </p>
      <BotonLink href="/conexiones/supabase">Ir a la guía →</BotonLink>
    </Tarjeta>
  );
}
