import "server-only";

// Busca negocios en Google Maps con el scraper de Apify (actor compass/crawler-google-places).
const API = "https://api.apify.com/v2";
const ACTOR = "compass~crawler-google-places";

export type Negocio = {
  nombre: string;
  telefono: string | null;
  email: string | null;
  web: string | null;
  direccion: string | null;
  ciudad: string | null;
  categoria: string | null;
  nota: number | null;
  resenas: number | null;
  maps_url: string | null;
  place_id: string | null;
};

const cab = (token: string) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

export async function probarApify(token: string): Promise<{ ok: boolean; usuario?: string }> {
  try {
    const r = await fetch(`${API}/users/me`, { headers: cab(token), signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { ok: false };
    const { data } = (await r.json()) as { data?: { username?: string } };
    return { ok: true, usuario: data?.username };
  } catch {
    return { ok: false };
  }
}

type Item = {
  title?: string; phone?: string; phoneUnformatted?: string; website?: string; address?: string; city?: string;
  categoryName?: string; totalScore?: number; reviewsCount?: number; url?: string; placeId?: string; emails?: string[];
};

const esperar = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

// Lanza la búsqueda y espera a que acabe (de 1 a 3 minutos normalmente).
export async function buscarNegocios(o: {
  token: string; categoria: string; ciudad: string; cantidad: number; conEmails: boolean;
}): Promise<Negocio[]> {
  const inicio = await fetch(`${API}/acts/${ACTOR}/runs`, {
    method: "POST",
    headers: cab(o.token),
    body: JSON.stringify({
      searchStringsArray: [o.categoria],
      locationQuery: o.ciudad,
      maxCrawledPlacesPerSearch: o.cantidad,
      language: "es",
      countryCode: "es",
      skipClosedPlaces: true,
      scrapeContacts: o.conEmails, // extra de pago en Apify: entra en cada web a buscar el email
    }),
  });
  if (inicio.status === 401) throw new Error("Apify no acepta el token. Revísalo en Conexiones → Apify.");
  if (inicio.status === 402) throw new Error("Tu cuenta de Apify se ha quedado sin saldo.");
  if (!inicio.ok) throw new Error(`Apify no ha podido empezar la búsqueda (error ${inicio.status}).`);
  const run = ((await inicio.json()) as { data: { id: string; defaultDatasetId: string } }).data;

  const limite = Date.now() + 6 * 60_000;
  for (;;) {
    await esperar(4000);
    const r = await fetch(`${API}/actor-runs/${run.id}`, { headers: cab(o.token) });
    const estado = r.ok ? ((await r.json()) as { data: { status: string } }).data.status : "";
    if (estado === "SUCCEEDED") break;
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(estado)) throw new Error("La búsqueda ha fallado en Apify. Prueba con menos resultados.");
    if (Date.now() > limite) throw new Error("La búsqueda tarda demasiado. Prueba con menos resultados.");
  }

  const r = await fetch(`${API}/datasets/${run.defaultDatasetId}/items?clean=true`, { headers: cab(o.token) });
  if (!r.ok) throw new Error("No se han podido leer los resultados de Apify.");
  return ((await r.json()) as Item[])
    .filter((i) => i.title)
    .map((i) => ({
      nombre: i.title!,
      telefono: i.phoneUnformatted || i.phone || null,
      email: i.emails?.[0] ?? null,
      web: i.website ?? null,
      direccion: i.address ?? null,
      ciudad: i.city ?? o.ciudad,
      categoria: i.categoryName ?? o.categoria,
      nota: i.totalScore ?? null,
      resenas: i.reviewsCount ?? null,
      maps_url: i.url ?? null,
      place_id: i.placeId ?? null,
    }));
}
