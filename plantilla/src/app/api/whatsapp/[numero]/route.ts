import { NextResponse } from "next/server";
import { esNumero, estadoNumero } from "@/lib/whatsapp";

// La tarjeta de cada número pregunta aquí cada pocos segundos (para el QR).
export async function GET(_: Request, { params }: { params: Promise<{ numero: string }> }) {
  const n = Number((await params).numero);
  if (!esNumero(n)) return NextResponse.json({ error: "Número no válido." }, { status: 400 });
  return NextResponse.json(await estadoNumero(n), { headers: { "Cache-Control": "no-store" } });
}
