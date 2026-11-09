export type Canal = "whatsapp" | "correo";

export const ETAPAS = [
  { id: "nuevo", nombre: "Nuevo" },
  { id: "en_cola", nombre: "En cola" },
  { id: "contactado", nombre: "Contactado" },
  { id: "respondio", nombre: "Ha respondido" },
  { id: "llamada", nombre: "Llamada agendada" },
  { id: "propuesta", nombre: "Propuesta enviada" },
  { id: "cliente", nombre: "Cliente" },
  { id: "descartado", nombre: "Descartado" },
] as const;
export type Etapa = (typeof ETAPAS)[number]["id"];
export const nombreEtapa = (e: string) => ETAPAS.find((x) => x.id === e)?.nombre ?? e;

export type Prospecto = {
  id: string;
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
  gancho: string | null;
  etapa: Etapa;
  valor: number | null;
  notas: string | null;
  busqueda: string | null;
  respondio_en: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type EstadoMensaje = "pendiente" | "enviando" | "enviado" | "descartado" | "revisar";

export type Mensaje = {
  id: string;
  prospecto_id: string;
  canal: Canal;
  numero: number | null;
  asunto: string | null;
  texto: string;
  estado: EstadoMensaje;
  error: string | null;
  personalizado: boolean;
  creado_en: string;
  enviado_en: string | null;
};
export type MensajeConProspecto = Mensaje & {
  prospectos: Pick<Prospecto, "nombre" | "telefono" | "email" | "web" | "ciudad" | "gancho"> | null;
};

export type Plantilla = { canal: Canal; asunto: string | null; texto: string };

export type Llamada = {
  id: string;
  prospecto_id: string | null;
  nombre: string;
  fecha: string;
  hora: string | null;
  donde: string | null;
  nota: string | null;
  resultado: "pendiente" | "hecha" | "no_vino" | "cerrada";
  creado_en: string;
};

export type Metrica = { id: string; nombre: string; meta: number | null; posicion: number };
export type ValorMetrica = { metrica_id: string; semana: string; valor: number };

export type Anuncio = {
  id: string;
  campana_id: string | null;
  nombre: string;
  estado: string | null;
  gasto: number;
  resultados: number;
  tipo_resultado: string | null;
  moneda: string | null;
  desde: string | null;
  hasta: string | null;
  actualizado_en: string;
};

export type Resultado = { ok: boolean; mensaje: string } | null;
