// El «gancho»: el detalle real de cada negocio que abre el mensaje.
// Sale de lo que trae Google Maps, sin IA y sin coste. Para afinarlo con lo
// que pone su web, en Claude Code: /personalizar.

type Datos = { web: string | null; nota: number | null; resenas: number | null; email?: string | null };

export function calcularGancho(p: Datos): string {
  const nota = p.nota ?? 0;
  const resenas = p.resenas ?? 0;
  if (!p.web) return "no tenéis web, y quien os busca en Google acaba llamando al de al lado";
  if (resenas >= 5 && nota > 0 && nota < 4.2)
    return `vuestra nota en Google es un ${nota.toLocaleString("es-ES")}, y por debajo de 4,2 se pierde a mucha gente antes de que os llame`;
  if (resenas < 25) return `con ${resenas} reseñas en Google os cuesta salir de los primeros en Maps`;
  if (nota >= 4.5 && resenas >= 100)
    return `tenéis ${resenas} reseñas con un ${nota.toLocaleString("es-ES")}, así que os entran más consultas de las que se pueden atender a mano`;
  return "os escribe gente fuera de horario y esos mensajes se quedan sin contestar hasta el día siguiente";
}

// Rellena [negocio], [ciudad], [gancho], [tu_nombre] y [empresa].
export function rellenar(
  plantilla: string,
  p: { nombre: string; ciudad: string | null; gancho: string | null },
  yo: { tuNombre: string; empresa: string },
): string {
  return plantilla
    .replaceAll("[negocio]", p.nombre)
    .replaceAll("[ciudad]", p.ciudad || "tu zona")
    .replaceAll("[gancho]", p.gancho || "")
    .replaceAll("[tu_nombre]", yo.tuNombre || "")
    .replaceAll("[empresa]", yo.empresa || "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
