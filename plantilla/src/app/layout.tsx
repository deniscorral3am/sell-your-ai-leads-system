import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Menu } from "@/components/menu";
import { db } from "@/lib/db";
import "./globals.css";

// Todo depende de datos del momento (tu base, tus números): nada se cachea.
export const dynamic = "force-dynamic";

const serif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--fuente-serif" });
const sans = Inter_Tight({ subsets: ["latin"], variable: "--fuente-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--fuente-mono" });

export const metadata: Metadata = {
  title: "Sell Your AI Leads System",
  description: "Busca negocios, escríbeles con un clic por mensaje y llévalos hasta la llamada.",
};

async function pendientes() {
  const c = db();
  if (!c) return { whatsapp: 0, correo: 0 };
  try {
    const contar = async (canal: string) =>
      (await c.from("mensajes").select("id", { count: "exact", head: true }).eq("canal", canal).in("estado", ["pendiente", "revisar"])).count ?? 0;
    const [whatsapp, correo] = await Promise.all([contar("whatsapp"), contar("correo")]);
    return { whatsapp, correo };
  } catch {
    return { whatsapp: 0, correo: 0 };
  }
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen md:flex">
        <Menu pendientes={await pendientes()} />
        <main className="min-w-0 flex-1 px-5 py-10 md:px-12 md:py-14">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
