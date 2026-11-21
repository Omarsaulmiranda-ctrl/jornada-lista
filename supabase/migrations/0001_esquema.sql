-- Jornada Lista · esquema inicial
-- Solo datos institucionales ficticios. Sin datos de pacientes.

create table public.municipios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  estado text not null default 'Jalisco',
  enlace_nombre text,
  enlace_cargo text,
  enlace_telefono text,
  -- El enlace municipal entra con un enlace privado; aquí solo se guarda su hash.
  token_hash text not null unique,
  creado_en timestamptz not null default now()
);

create table public.jornadas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios (id) on delete cascade,
  programa text not null default 'Tamizaje Rosa',
  localidad text,
  sede text not null,
  fecha date not null,
  servicios text[] not null default '{}',
  responsable_eira text not null,
  aliado text,
  estado text not null default 'en_preparacion'
    check (estado in ('en_preparacion', 'confirmada')),
  confirmada_en timestamptz,
  confirmada_por text,
  creado_en timestamptz not null default now()
);

create table public.requisitos (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references public.jornadas (id) on delete cascade,
  clave text not null,
  titulo text not null,
  descripcion text,
  tipo text not null check (tipo in ('carta', 'archivos', 'datos')),
  critico boolean not null default false,
  responsable text not null default 'municipio'
    check (responsable in ('municipio', 'eira')),
  fecha_limite date not null,
  -- Vocabulario de la guía de EIRA: pendiente, recibido, observado, aprobado.
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'recibido', 'observado', 'aprobado', 'no_aplica')),
  orden int not null default 0,
  unique (jornada_id, clave)
);

-- Cada entrega es una versión. Nunca se sobrescribe.
create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  requisito_id uuid not null references public.requisitos (id) on delete cascade,
  version int not null check (version >= 1),
  archivos jsonb not null default '[]'::jsonb,
  datos jsonb,
  nota text,
  autor text not null,
  creado_en timestamptz not null default now(),
  revision text not null default 'en_revision'
    check (revision in ('en_revision', 'observada', 'aprobada')),
  motivo text,
  revisor text,
  revisado_en timestamptz,
  unique (requisito_id, version),
  -- No se puede observar una entrega sin explicar el motivo.
  constraint motivo_obligatorio check (
    revision <> 'observada' or length(btrim(coalesce(motivo, ''))) >= 5
  )
);

create table public.eventos (
  id bigint generated always as identity primary key,
  jornada_id uuid not null references public.jornadas (id) on delete cascade,
  requisito_id uuid references public.requisitos (id) on delete cascade,
  actor text not null,
  rol text not null check (rol in ('eira', 'municipio', 'sistema')),
  tipo text not null,
  detalle text,
  creado_en timestamptz not null default now()
);

create index on public.jornadas (municipio_id);
create index on public.requisitos (jornada_id);
create index on public.entregas (requisito_id);
create index on public.eventos (jornada_id, creado_en desc);

-- El contenido de una entrega es inmutable: solo puede cambiar su revisión, y una sola vez.
create function public.proteger_entrega() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.requisito_id is distinct from old.requisito_id
     or new.version is distinct from old.version
     or new.archivos is distinct from old.archivos
     or new.datos is distinct from old.datos
     or new.nota is distinct from old.nota
     or new.autor is distinct from old.autor
     or new.creado_en is distinct from old.creado_en then
    raise exception 'El contenido de una entrega no se puede modificar; suba una nueva versión.';
  end if;
  if old.revision <> 'en_revision' then
    raise exception 'Esta entrega ya fue revisada.';
  end if;
  return new;
end $$;

create trigger entregas_inmutables before update on public.entregas
  for each row execute function public.proteger_entrega();

-- La bitácora solo admite inserciones.
create function public.bitacora_solo_insercion() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'La bitácora no se puede modificar.';
end $$;

create trigger eventos_solo_insercion before update on public.eventos
  for each row execute function public.bitacora_solo_insercion();

-- RLS activado sin políticas: ninguna llave pública puede leer ni escribir.
-- Todo el acceso pasa por el servidor de la aplicación, que valida rol y municipio.
alter table public.municipios enable row level security;
alter table public.jornadas enable row level security;
alter table public.requisitos enable row level security;
alter table public.entregas enable row level security;
alter table public.eventos enable row level security;

-- Archivos: bucket privado, máximo 10 MB, solo imágenes y PDF.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidencias', 'evidencias', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;
