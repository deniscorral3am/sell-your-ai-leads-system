// Para todos los puentes de WhatsApp que sigan encendidos (no borra las sesiones).
import fs from "node:fs";
import path from "node:path";

let n = 0;
for (const numero of [1, 2, 3]) {
  const pid = path.join(process.cwd(), ".whatsapp", `numero-${numero}`, "puente.pid");
  try {
    process.kill(Number(fs.readFileSync(pid, "utf8")));
    n++;
  } catch {}
  fs.rmSync(pid, { force: true });
}
console.log(n ? `✓ ${n} números parados.` : "No había ningún número encendido.");
