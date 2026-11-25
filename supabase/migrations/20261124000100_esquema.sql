-- =====================================================================
-- 01 · Esquema base · Plataforma Dra. Monserrath Montalvo
-- Supabase = fuente de verdad de las citas. Google Calendar = calendario
-- operativo (se sincroniza mediante la cola `cola_sincronizacion`).
-- Zona horaria del negocio: America/Guayaquil (UTC-5, sin horario de verano).
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

-- ---------- Administradores ----------
create table public.administradores (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nombre text not null,
  rol text not null default 'recepcion' check (rol in ('admin','recepcion')),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
comment on table public.administradores is 'Usuarios del panel. admin = todo; recepcion = agenda y pacientes, sin configuración ni usuarios.';

-- ---------- Configuración del sitio (fila única) ----------
create table public.configuracion_sitio (
  id smallint primary key default 1 check (id = 1),
  nombre_comercial text not null,
  especialidad text,
  logotipo_url text,
  color_acento text not null default '#1d5c66' check (color_acento ~ '^#[0-9a-fA-F]{6}$'),
  telefono text, email text,
  whatsapp_url text, whatsapp_numero text, mensaje_whatsapp text,
  direccion text, referencias text, ciudad text, maps_query text,
  redes jsonb not null default '{}'::jsonb,
  hero_titulo text, hero_subtitulo text, hero_imagen_url text,
  actualizado_en timestamptz not null default now()
);

-- ---------- Información institucional y perfil (fila única) ----------
create table public.informacion_institucional (
  id smallint primary key default 1 check (id = 1),
  propuesta text, presentacion text, historia text, mision text, vision text,
  valores text[] not null default '{}',
  diferenciadores jsonb not null default '[]'::jsonb,       -- [{titulo, texto}]
  perfil_nombre text, perfil_titulo text, perfil_biografia text, perfil_experiencia text,
  perfil_foto_url text,
  perfil_especialidades text[] not null default '{}',
  perfil_formacion jsonb not null default '[]'::jsonb,     -- [{titulo, institucion, anio}]
  perfil_certificaciones text[] not null default '{}',
  perfil_cursos text[] not null default '{}',
  perfil_enfoque text,
  actualizado_en timestamptz not null default now()
);

-- ---------- Configuración de agenda (fila única) ----------
create table public.configuracion_agenda (
  id smallint primary key default 1 check (id = 1),
  zona_horaria text not null default 'America/Guayaquil',
  intervalo_minutos int not null default 30 check (intervalo_minutos between 5 and 240),
  anticipacion_minima_horas int not null default 4 check (anticipacion_minima_horas >= 0),
  anticipacion_maxima_dias int not null default 60 check (anticipacion_maxima_dias between 1 and 365),
  cancelacion_minima_horas int not null default 24 check (cancelacion_minima_horas >= 0),
  permite_reprogramar boolean not null default true,
  confirmacion_automatica boolean not null default false,   -- false: la cita entra como "pendiente"
  politica_cancelacion text,
  horarios_provisionales boolean not null default true,
  actualizado_en timestamptz not null default now()
);

-- ---------- Tratamientos ----------
create table public.categorias_tratamiento (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  orden int not null default 0,
  activa boolean not null default true
);

create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  categoria_id uuid references public.categorias_tratamiento(id) on delete set null,
  nombre text not null,
  descripcion text, objetivo text,
  beneficios text[] not null default '{}',
  indicaciones text,
  imagen_url text,
  duracion_minutos int not null default 30 check (duracion_minutos between 10 and 480),
  precio numeric(10,2) check (precio >= 0),
  mostrar_precio boolean not null default false,
  reservable boolean not null default true,
  destacado boolean not null default false,
  activo boolean not null default true,
  orden int not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Días en que se ofrece cada servicio (sin filas = todos los días laborables)
create table public.servicio_dias (
  servicio_id uuid not null references public.servicios(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  primary key (servicio_id, dia_semana)
);

-- ---------- Horarios y bloqueos ----------
-- Varios tramos por día: el espacio entre tramos es el descanso.
create table public.horarios (
  id uuid primary key default gen_random_uuid(),
  dia_semana smallint not null check (dia_semana between 0 and 6),   -- 0 = domingo
  hora_inicio time not null,
  hora_fin time not null,
  activo boolean not null default true,
  check (hora_fin > hora_inicio)
);
create index on public.horarios (dia_semana) where activo;

create table public.bloqueos_agenda (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'bloqueo' check (tipo in ('bloqueo','vacaciones','feriado','no_laborable')),
  inicio timestamptz not null,
  fin timestamptz not null,
  motivo text,
  creado_en timestamptz not null default now(),
  check (fin > inicio)
);
create index on public.bloqueos_agenda using gist (tstzrange(inicio, fin));

-- Horas ocupadas en el Google Calendar de la doctora (eventos no creados por
-- la plataforma). Las escribe Apps Script; la disponibilidad las respeta.
create table public.calendario_ocupado (
  google_event_id text primary key,
  inicio timestamptz not null,
  fin timestamptz not null,
  actualizado_en timestamptz not null default now(),
  check (fin > inicio)
);
create index on public.calendario_ocupado using gist (tstzrange(inicio, fin));

-- ---------- Pacientes ----------
create table public.pacientes (
  id uuid primary key default gen_random_uuid(),
  nombres text not null check (char_length(nombres) between 1 and 80),
  apellidos text not null check (char_length(apellidos) between 1 and 80),
  telefono text not null check (telefono ~ '^\+?[0-9 ()-]{7,20}$'),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  estado text not null default 'activo' check (estado in ('activo','inactivo','anonimizado')),
  consentimiento_en timestamptz,
  consentimiento_version text,
  notas_admin text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create unique index pacientes_email_unico on public.pacientes (lower(email)) where estado <> 'anonimizado';
create index on public.pacientes (telefono);
create index on public.pacientes (lower(apellidos), lower(nombres));

-- ---------- Citas ----------
create table public.citas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  servicio_id uuid not null references public.servicios(id) on delete restrict,
  inicio timestamptz not null,
  fin timestamptz not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','confirmada','reprogramada','cancelada','atendida','no_asistio')),
  origen text not null default 'web' check (origen in ('web','panel','telefono','whatsapp','presencial')),
  observaciones_paciente text check (char_length(observaciones_paciente) <= 500),
  observaciones_admin text,
  google_event_id text,
  sync_estado text not null default 'pendiente' check (sync_estado in ('pendiente','ok','error')),
  token_hash text unique,              -- hash del enlace de gestión que recibe el paciente
  cancelada_por text check (cancelada_por in ('paciente','consultorio')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (fin > inicio)
);
-- Garantía final contra reservas duplicadas: dos citas activas no pueden solaparse.
alter table public.citas add constraint citas_sin_solape
  exclude using gist (tstzrange(inicio, fin, '[)') with &&)
  where (estado in ('pendiente','confirmada','reprogramada'));
create index on public.citas (inicio);
create index on public.citas (paciente_id);
create index on public.citas (estado);

-- ---------- Cola de sincronización con Google Calendar ----------
create table public.cola_sincronizacion (
  id bigint generated always as identity primary key,
  cita_id uuid not null references public.citas(id) on delete cascade,
  accion text not null check (accion in ('crear','actualizar','cancelar')),
  estado text not null default 'pendiente' check (estado in ('pendiente','procesando','ok','error','descartado')),
  intentos int not null default 0,
  ultimo_error text,
  proximo_intento timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  procesado_en timestamptz
);
create index on public.cola_sincronizacion (estado, proximo_intento);

-- ---------- Registro de actividad administrativa ----------
create table public.registro_actividad (
  id bigint generated always as identity primary key,
  usuario_id uuid,
  usuario_email text,
  tabla text not null,
  registro_id text,
  accion text not null,
  antes jsonb,
  despues jsonb,
  fecha timestamptz not null default now()
);
create index on public.registro_actividad (fecha desc);

-- ---------- Errores de integración ----------
create table public.registro_errores (
  id bigint generated always as identity primary key,
  origen text not null,             -- 'apps-script', 'api-reservas', ...
  mensaje text not null,
  detalle jsonb,
  fecha timestamptz not null default now()
);

-- ---------- Protección de datos (LOPDP) ----------
create table public.solicitudes_derechos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references public.pacientes(id) on delete set null,
  nombre text not null,
  email text not null,
  telefono text,
  tipo text not null check (tipo in ('acceso','rectificacion','eliminacion','oposicion','portabilidad','suspension')),
  detalle text check (char_length(detalle) <= 2000),
  estado text not null default 'recibida' check (estado in ('recibida','en_proceso','resuelta','rechazada')),
  respuesta text,
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz
);

-- ---------- Límite de solicitudes (anti-spam) ----------
create table public.limites_solicitudes (
  clave text not null,
  ventana timestamptz not null,
  conteo int not null default 0,
  primary key (clave, ventana)
);

-- ---------- Contenido comercial ----------
create table public.autorizaciones_publicacion (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references public.pacientes(id) on delete set null,
  titular text not null,                 -- nombre de quien autoriza
  alcance text not null check (alcance in ('fotografias','testimonio','ambos')),
  documento_path text,                   -- consentimiento firmado (bucket privado)
  estado text not null default 'pendiente' check (estado in ('pendiente','otorgada','revocada')),
  fecha_firma date, fecha_revocacion date, observaciones text,
  creado_en timestamptz not null default now()
);

create table public.portafolio (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid references public.servicios(id) on delete set null,
  titulo text,
  imagen_antes_url text not null,
  imagen_despues_url text not null,
  descripcion text, periodo text,
  autorizacion_id uuid references public.autorizaciones_publicacion(id) on delete set null,
  publicado boolean not null default false,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

create table public.galeria (
  id uuid primary key default gen_random_uuid(),
  imagen_url text not null,
  titulo text not null,
  descripcion text,
  categoria text not null default 'otros'
    check (categoria in ('fachada','recepcion','espera','consultorio','equipamiento','otros')),
  orden int not null default 0,
  publicado boolean not null default true
);

create table public.testimonios (
  id uuid primary key default gen_random_uuid(),
  nombre_autorizado text not null,
  comentario text not null,
  servicio_id uuid references public.servicios(id) on delete set null,
  autorizacion_id uuid references public.autorizaciones_publicacion(id) on delete set null,
  publicado boolean not null default false,
  creado_en timestamptz not null default now()
);

create table public.faq (
  id uuid primary key default gen_random_uuid(),
  pregunta text not null,
  respuesta text not null,
  orden int not null default 0,
  publicado boolean not null default true
);

create table public.mensajes_contacto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) <= 120),
  telefono text not null check (char_length(telefono) <= 30),
  email text check (char_length(email) <= 160),
  motivo text check (char_length(motivo) <= 120),
  mensaje text not null check (char_length(mensaje) <= 2000),
  estado text not null default 'pendiente' check (estado in ('pendiente','atendido')),
  recibido_en timestamptz not null default now()
);
create index on public.mensajes_contacto (recibido_en desc);
