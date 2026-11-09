import type { NextConfig } from "next";

// El panel solo corre en tu ordenador. Baileys (WhatsApp) va en un proceso
// aparte, así que Next no tiene que empaquetarlo.
const nextConfig: NextConfig = {
  serverExternalPackages: ["@whiskeysockets/baileys", "pino"],
  poweredByHeader: false,
};

export default nextConfig;
