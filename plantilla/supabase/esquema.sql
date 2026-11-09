-- =============================================================
-- Sell Your AI Leads System · tablas
-- =============================================================
-- Se puede lanzar las veces que quieras: no rompe nada ni borra datos.
-- Cómo: en Claude Code con /conectar, o pegándolo en el SQL Editor de
-- Supabase y pulsando «Run».

-- ---------- Prospectos: los negocios que encuentras ----------
create table if not exists public.prospectos (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  telefono       text,
  email          text,
  web            text,
  direccion      text,
  ciudad         text,
  categoria      text,
  nota           numeric,          -- estrellas en Google
  resenas        integer,
  maps_url       text,
  place_id       text unique,      -- id de Google Maps: evita duplicados
  gancho         text,             -- el detalle real con el que abre el mensaje
  etapa          text not null default 'nuevo'
                 check (etapa in ('nuevo','en_cola','contactado','respondio','llamada','propuesta','cliente','descartado')),
  valor          numeric,          -- lo que vale si cierra (para el CRM)
  notas          text,
  busqueda       text,             -- «peluquerías · Valencia»
  respondio_en   timestamptz,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists prospectos_creado_idx on public.prospectos (creado_en desc);
create index if not exists prospectos_etapa_idx  on public.prospectos (etapa);

-- ---------- Plantillas: una por canal ----------
create table if not exists public.plantillas (
  canal          text primary key check (canal in ('whatsapp','correo')),
  asunto         text,
  texto          text not null,
  actualizado_en timestamptz not null default now()
);

-- ---------- Mensajes: la cola de WhatsApp y de correo ----------
-- Nada sale solo: cada mensaje nace «pendiente» y solo pasa a «enviado»
-- cuando lo apruebas tú desde el panel, uno a uno.
create table if not exists public.mensajes (
  id            uuid primary key default gen_random_uuid(),
  prospecto_id  uuid not null references public.prospectos (id) on delete cascade,
  canal         text not null check (canal in ('whatsapp','correo')),
  numero        smallint check (numero between 1 and 3),
  asunto        text,
  texto         text not null,
  estado        text not null default 'pendiente'
                check (estado in ('pendiente','enviando','enviado','descartado','revisar')),
  error         text,
  personalizado boolean not null default false,  -- lo ha reescrito /personalizar
  creado_en     timestamptz not null default now(),
  enviado_en    timestamptz
);
alter table public.mensajes add column if not exists personalizado boolean not null default false;
create index if not exists mensajes_cola_idx    on public.mensajes (canal, estado, creado_en);
create index if not exists mensajes_enviado_idx on public.mensajes (canal, enviado_en);

-- ---------- Llamadas de venta ----------
create table if not exists public.llamadas (
  id           uuid primary key default gen_random_uuid(),
  prospecto_id uuid references public.prospectos (id) on delete set null,
  nombre       text not null,
  fecha        date not null,
  hora         time,
  donde        text,               -- Meet, teléfono, en persona…
  nota         text,
  resultado    text not null default 'pendiente'
               check (resultado in ('pendiente','hecha','no_vino','cerrada')),
  creado_en    timestamptz not null default now()
);
create index if not exists llamadas_fecha_idx on public.llamadas (fecha, hora);

-- ---------- Métricas semanales (contenido, prospección, lo que quieras) ----------
create table if not exists public.metricas (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  meta      numeric,               -- objetivo por semana
  posicion  real not null default 0,
  creado_en timestamptz not null default now()
);
create table if not exists public.metricas_valores (
  metrica_id uuid not null references public.metricas (id) on delete cascade,
  semana     date not null,        -- lunes de la semana
  valor      numeric not null default 0,
  primary key (metrica_id, semana)
);

-- ---------- Anuncios: la última foto que trae Claude de Meta ----------
create table if not exists public.anuncios (
  id             uuid primary key default gen_random_uuid(),
  campana_id     text,
  nombre         text not null,
  estado         text,
  gasto          numeric not null default 0,
  resultados     numeric not null default 0,
  tipo_resultado text,
  moneda         text,
  desde          date,
  hasta          date,
  actualizado_en timestamptz not null default now()
);

-- ---------- Seguridad ----------
-- RLS activado y SIN políticas: la clave pública de Supabase no puede leer ni
-- escribir nada. El panel entra con la clave secreta, que solo vive en tu
-- ordenador (config.local.json).
alter table public.prospectos       enable row level security;
alter table public.plantillas       enable row level security;
alter table public.mensajes         enable row level security;
alter table public.llamadas         enable row level security;
alter table public.metricas         enable row level security;
alter table public.metricas_valores enable row level security;
alter table public.anuncios         enable row level security;

-- Los proyectos nuevos de Supabase no dan permisos solos: solo a service_role
-- (la clave secreta). A anon/authenticated, nada.
grant select, insert, update, delete on public.prospectos       to service_role;
grant select, insert, update, delete on public.plantillas       to service_role;
grant select, insert, update, delete on public.mensajes         to service_role;
grant select, insert, update, delete on public.llamadas         to service_role;
grant select, insert, update, delete on public.metricas         to service_role;
grant select, insert, update, delete on public.metricas_valores to service_role;
grant select, insert, update, delete on public.anuncios         to service_role;

-- ---------- Arranque ----------
insert into public.plantillas (canal, asunto, texto) values
  ('whatsapp', null,
   E'Hola, buenas. He visto [negocio] en Google Maps y me ha llamado la atención una cosa: [gancho].\n\nMe dedico justo a eso con negocios de [ciudad]. Te puedo contar en dos minutos cómo lo solucionamos?\n\n[tu_nombre]'),
  ('correo', '[negocio], una cosa que he visto en Google',
   E'Hola,\n\nHe visto [negocio] en Google Maps y me ha llamado la atención una cosa: [gancho].\n\nTrabajo justo en eso con negocios de [ciudad] y suele notarse en el primer mes. Si te encaja, te lo cuento en una llamada de 15 minutos esta semana.\n\nUn saludo,\n[tu_nombre]\n[empresa]\n\nSi no te interesa, contéstame «no» y no te vuelvo a escribir.')
on conflict (canal) do nothing;

insert into public.metricas (nombre, meta, posicion)
select * from (values
  ('Mensajes enviados', 150::numeric, 1::real),
  ('Respuestas', 15, 2),
  ('Llamadas agendadas', 5, 3),
  ('Clientes cerrados', 1, 4),
  ('Reels publicados', 5, 5)
) as v(nombre, meta, posicion)
where not exists (select 1 from public.metricas);

notify pgrst, 'reload schema';
