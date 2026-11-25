-- =====================================================================
-- 02 · Funciones, reglas de negocio y disparadores
-- =====================================================================

-- ---------- Roles ----------
create or replace function public.es_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.administradores where id = auth.uid() and activo);
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.administradores where id = auth.uid() and activo and rol = 'admin');
$$;

-- ---------- Fecha de actualización ----------
create or replace function public.tocar_actualizado() returns trigger
language plpgsql set search_path = public as $$
begin new.actualizado_en := now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['configuracion_sitio','informacion_institucional','configuracion_agenda','servicios','pacientes','citas'] loop
    execute format('create trigger tocar_%1$s before update on public.%1$I for each row execute function public.tocar_actualizado()', t);
  end loop;
end $$;

-- ---------- Auditoría ----------
create or replace function public.auditar() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_antes jsonb; v_despues jsonb; v_id text;
begin
  if tg_op <> 'INSERT' then v_antes := to_jsonb(old) - 'token_hash'; end if;
  if tg_op <> 'DELETE' then v_despues := to_jsonb(new) - 'token_hash'; end if;
  v_id := coalesce(v_despues->>'id', v_antes->>'id', v_despues->>'servicio_id');
  insert into public.registro_actividad (usuario_id, usuario_email, tabla, registro_id, accion, antes, despues)
  values (auth.uid(), auth.jwt()->>'email', tg_table_name, v_id, lower(tg_op), v_antes, v_despues);
  return coalesce(new, old);
end $$;

do $$ declare t text; begin
  foreach t in array array['administradores','configuracion_sitio','informacion_institucional','configuracion_agenda',
    'categorias_tratamiento','servicios','servicio_dias','horarios','bloqueos_agenda','pacientes','solicitudes_derechos',
    'autorizaciones_publicacion','portafolio','galeria','testimonios','faq'] loop
    execute format('create trigger auditar_%1$s after insert or update or delete on public.%1$I for each row execute function public.auditar()', t);
  end loop;
end $$;
-- En citas solo se auditan los cambios de negocio (no los de sincronización).
create trigger auditar_citas_ins after insert or delete on public.citas for each row execute function public.auditar();
create trigger auditar_citas_upd after update of inicio, fin, estado, servicio_id, observaciones_admin, paciente_id
  on public.citas for each row execute function public.auditar();
create trigger auditar_mensajes after update of estado on public.mensajes_contacto for each row execute function public.auditar();

-- ---------- Encolar sincronización con Google Calendar ----------
create or replace function public.encolar_sincronizacion() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_accion text;
begin
  if tg_op = 'INSERT' then v_accion := 'crear';
  elsif new.estado = 'cancelada' then v_accion := 'cancelar';
  else v_accion := 'actualizar';
  end if;
  insert into public.cola_sincronizacion (cita_id, accion) values (new.id, v_accion);
  update public.citas set sync_estado = 'pendiente' where id = new.id and sync_estado <> 'pendiente';
  return new;
end $$;

create trigger sincronizar_cita_ins after insert on public.citas
  for each row execute function public.encolar_sincronizacion();
create trigger sincronizar_cita_upd after update of inicio, fin, estado, servicio_id on public.citas
  for each row when (old.inicio is distinct from new.inicio or old.fin is distinct from new.fin
                     or old.estado is distinct from new.estado or old.servicio_id is distinct from new.servicio_id)
  execute function public.encolar_sincronizacion();

-- ---------- Límite de solicitudes ----------
create or replace function public.verificar_limite(p_clave text, p_maximo int, p_ventana_segundos int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_ventana timestamptz := to_timestamp(floor(extract(epoch from now()) / p_ventana_segundos) * p_ventana_segundos);
        v_conteo int;
begin
  insert into public.limites_solicitudes (clave, ventana, conteo) values (p_clave, v_ventana, 1)
  on conflict (clave, ventana) do update set conteo = limites_solicitudes.conteo + 1
  returning conteo into v_conteo;
  delete from public.limites_solicitudes where ventana < now() - interval '1 day';
  return v_conteo <= p_maximo;
end $$;

-- ---------- Disponibilidad ----------
-- Devuelve los horarios libres de un servicio en una fecha (hora local del consultorio).
-- Considera: horarios por día (con descansos), días del servicio, duración, intervalo,
-- anticipación mínima/máxima, citas activas, bloqueos y ocupados de Google Calendar.
create or replace function public.disponibilidad(p_servicio uuid, p_fecha date, p_ignorar_cita uuid default null)
returns table (slot_inicio timestamptz, slot_fin timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  cfg public.configuracion_agenda%rowtype;
  v_duracion int;
  v_dow int := extract(dow from p_fecha)::int;
begin
  select * into cfg from public.configuracion_agenda where id = 1;
  select s.duracion_minutos into v_duracion from public.servicios s
   where s.id = p_servicio and s.activo and s.reservable;
  if v_duracion is null then return; end if;

  if exists (select 1 from public.servicio_dias d where d.servicio_id = p_servicio)
     and not exists (select 1 from public.servicio_dias d where d.servicio_id = p_servicio and d.dia_semana = v_dow) then
    return;
  end if;

  return query
  with tramos as (
    select (p_fecha + h.hora_inicio) at time zone cfg.zona_horaria as t0,
           (p_fecha + h.hora_fin)    at time zone cfg.zona_horaria as t1
      from public.horarios h
     where h.activo and h.dia_semana = v_dow
  ), candidatos as (
    select g as s, g + make_interval(mins => v_duracion) as e
      from tramos t,
           generate_series(t.t0, t.t1 - make_interval(mins => v_duracion), make_interval(mins => cfg.intervalo_minutos)) g
  )
  select distinct c.s, c.e
    from candidatos c
   where c.s >= now() + make_interval(hours => cfg.anticipacion_minima_horas)
     and c.s <= now() + make_interval(days => cfg.anticipacion_maxima_dias)
     and not exists (select 1 from public.citas x
                      where x.estado in ('pendiente','confirmada','reprogramada')
                        and x.id is distinct from p_ignorar_cita
                        and tstzrange(x.inicio, x.fin, '[)') && tstzrange(c.s, c.e, '[)'))
     and not exists (select 1 from public.bloqueos_agenda b
                      where tstzrange(b.inicio, b.fin, '[)') && tstzrange(c.s, c.e, '[)'))
     and not exists (select 1 from public.calendario_ocupado o
                      where tstzrange(o.inicio, o.fin, '[)') && tstzrange(c.s, c.e, '[)')
                        and not exists (select 1 from public.citas y where y.google_event_id = o.google_event_id))
   order by c.s;
end $$;

-- Días con al menos un horario libre (para pintar el calendario del paciente)
create or replace function public.dias_disponibles(p_servicio uuid, p_desde date, p_hasta date)
returns table (fecha date, libres int)
language sql stable security definer set search_path = public as $$
  select d::date, (select count(*)::int from public.disponibilidad(p_servicio, d::date))
    from generate_series(p_desde, least(p_hasta, p_desde + 62), interval '1 day') d
$$;

-- ---------- Utilidades internas ----------
create or replace function public._hash_token(p_token text) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex')
$$;

create or replace function public._limpiar(p text, p_max int) returns text
language sql immutable as $$
  select nullif(left(regexp_replace(trim(coalesce(p, '')), '[[:cntrl:]<>]', '', 'g'), p_max), '')
$$;

-- ---------- Reserva pública ----------
-- Llamada SOLO desde el servidor (API de Next.js con la clave de servicio).
-- El candado transaccional serializa las reservas y la restricción de exclusión
-- es la última barrera: dos personas no pueden obtener el mismo horario.
create or replace function public.reservar_cita(
  p_servicio uuid, p_inicio timestamptz,
  p_nombres text, p_apellidos text, p_telefono text, p_email text,
  p_observaciones text, p_consentimiento_version text
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  cfg public.configuracion_agenda%rowtype;
  v_fin timestamptz; v_paciente uuid; v_cita public.citas%rowtype;
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
  v_nombres text := public._limpiar(p_nombres, 80);
  v_apellidos text := public._limpiar(p_apellidos, 80);
  v_tel text := public._limpiar(p_telefono, 20);
  v_email text := lower(public._limpiar(p_email, 160));
begin
  if v_nombres is null or v_apellidos is null then raise exception 'DATOS_INVALIDOS: nombre' using errcode = 'P0001'; end if;
  if v_tel is null or v_tel !~ '^\+?[0-9 ()-]{7,20}$' then raise exception 'DATOS_INVALIDOS: telefono' using errcode = 'P0001'; end if;
  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'DATOS_INVALIDOS: email' using errcode = 'P0001'; end if;
  if public._limpiar(p_consentimiento_version, 20) is null then raise exception 'CONSENTIMIENTO_REQUERIDO' using errcode = 'P0001'; end if;

  select * into cfg from public.configuracion_agenda where id = 1;
  perform pg_advisory_xact_lock(hashtext('agenda-citas'));

  select d.slot_fin into v_fin
    from public.disponibilidad(p_servicio, (p_inicio at time zone cfg.zona_horaria)::date) d
   where d.slot_inicio = p_inicio;
  if v_fin is null then raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001'; end if;

  select id into v_paciente from public.pacientes where lower(email) = v_email and estado <> 'anonimizado';
  if v_paciente is null then
    insert into public.pacientes (nombres, apellidos, telefono, email, consentimiento_en, consentimiento_version)
    values (v_nombres, v_apellidos, v_tel, v_email, now(), p_consentimiento_version)
    returning id into v_paciente;
  else
    update public.pacientes set consentimiento_en = now(), consentimiento_version = p_consentimiento_version,
           estado = 'activo' where id = v_paciente;
    if (select count(*) from public.citas where paciente_id = v_paciente and inicio > now()
          and estado in ('pendiente','confirmada','reprogramada')) >= 3 then
      raise exception 'LIMITE_CITAS' using errcode = 'P0001';
    end if;
  end if;

  insert into public.citas (paciente_id, servicio_id, inicio, fin, estado, origen, observaciones_paciente, token_hash)
  values (v_paciente, p_servicio, p_inicio, v_fin,
          case when cfg.confirmacion_automatica then 'confirmada' else 'pendiente' end,
          'web', public._limpiar(p_observaciones, 500), public._hash_token(v_token))
  returning * into v_cita;

  return jsonb_build_object('cita_id', v_cita.id, 'codigo', v_cita.codigo, 'token', v_token,
                            'inicio', v_cita.inicio, 'fin', v_cita.fin, 'estado', v_cita.estado);
exception when exclusion_violation then
  raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001';
end $$;

-- ---------- Gestión de la cita por el paciente (enlace con token) ----------
create or replace function public.cita_por_token(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r record; cfg public.configuracion_agenda%rowtype;
begin
  select * into cfg from public.configuracion_agenda where id = 1;
  select c.id, c.codigo, c.inicio, c.fin, c.estado, c.servicio_id, s.nombre as servicio, p.nombres
    into r from public.citas c join public.servicios s on s.id = c.servicio_id join public.pacientes p on p.id = c.paciente_id
   where c.token_hash = public._hash_token(p_token);
  if not found then return null; end if;
  return jsonb_build_object('codigo', r.codigo, 'inicio', r.inicio, 'fin', r.fin, 'estado', r.estado,
    'servicio_id', r.servicio_id, 'servicio', r.servicio, 'nombres', r.nombres,
    'puede_modificar', r.estado in ('pendiente','confirmada','reprogramada')
                       and r.inicio - now() >= make_interval(hours => cfg.cancelacion_minima_horas),
    'puede_reprogramar', cfg.permite_reprogramar,
    'horas_minimas', cfg.cancelacion_minima_horas);
end $$;

create or replace function public.cancelar_por_token(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_cita public.citas%rowtype; cfg public.configuracion_agenda%rowtype;
begin
  select * into cfg from public.configuracion_agenda where id = 1;
  select * into v_cita from public.citas where token_hash = public._hash_token(p_token) for update;
  if not found then raise exception 'CITA_NO_ENCONTRADA' using errcode = 'P0001'; end if;
  if v_cita.estado not in ('pendiente','confirmada','reprogramada') then raise exception 'CITA_NO_MODIFICABLE' using errcode = 'P0001'; end if;
  if v_cita.inicio - now() < make_interval(hours => cfg.cancelacion_minima_horas) then raise exception 'FUERA_DE_PLAZO' using errcode = 'P0001'; end if;
  update public.citas set estado = 'cancelada', cancelada_por = 'paciente' where id = v_cita.id;
  return jsonb_build_object('codigo', v_cita.codigo, 'estado', 'cancelada');
end $$;

create or replace function public.reprogramar_por_token(p_token text, p_nuevo_inicio timestamptz) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_cita public.citas%rowtype; cfg public.configuracion_agenda%rowtype; v_fin timestamptz;
begin
  select * into cfg from public.configuracion_agenda where id = 1;
  if not cfg.permite_reprogramar then raise exception 'REPROGRAMACION_DESACTIVADA' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('agenda-citas'));
  select * into v_cita from public.citas where token_hash = public._hash_token(p_token) for update;
  if not found then raise exception 'CITA_NO_ENCONTRADA' using errcode = 'P0001'; end if;
  if v_cita.estado not in ('pendiente','confirmada','reprogramada') then raise exception 'CITA_NO_MODIFICABLE' using errcode = 'P0001'; end if;
  if v_cita.inicio - now() < make_interval(hours => cfg.cancelacion_minima_horas) then raise exception 'FUERA_DE_PLAZO' using errcode = 'P0001'; end if;
  select d.slot_fin into v_fin from public.disponibilidad(v_cita.servicio_id, (p_nuevo_inicio at time zone cfg.zona_horaria)::date, v_cita.id) d
   where d.slot_inicio = p_nuevo_inicio;
  if v_fin is null then raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001'; end if;
  update public.citas set inicio = p_nuevo_inicio, fin = v_fin, estado = 'reprogramada' where id = v_cita.id;
  return jsonb_build_object('codigo', v_cita.codigo, 'estado', 'reprogramada', 'inicio', p_nuevo_inicio, 'fin', v_fin);
exception when exclusion_violation then
  raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001';
end $$;

-- ---------- Acciones del panel ----------
create or replace function public.admin_reprogramar_cita(p_cita uuid, p_nuevo_inicio timestamptz, p_forzar boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cita public.citas%rowtype; cfg public.configuracion_agenda%rowtype; v_fin timestamptz; v_dur int;
begin
  if not public.es_staff() then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  select * into cfg from public.configuracion_agenda where id = 1;
  perform pg_advisory_xact_lock(hashtext('agenda-citas'));
  select * into v_cita from public.citas where id = p_cita for update;
  if not found then raise exception 'CITA_NO_ENCONTRADA' using errcode = 'P0001'; end if;
  if p_forzar then
    select duracion_minutos into v_dur from public.servicios where id = v_cita.servicio_id;
    v_fin := p_nuevo_inicio + make_interval(mins => v_dur);
  else
    select d.slot_fin into v_fin from public.disponibilidad(v_cita.servicio_id, (p_nuevo_inicio at time zone cfg.zona_horaria)::date, v_cita.id) d
     where d.slot_inicio = p_nuevo_inicio;
    if v_fin is null then raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001'; end if;
  end if;
  update public.citas set inicio = p_nuevo_inicio, fin = v_fin, estado = 'reprogramada' where id = p_cita;
  return jsonb_build_object('id', p_cita, 'inicio', p_nuevo_inicio, 'fin', v_fin);
exception when exclusion_violation then
  raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001';
end $$;

create or replace function public.admin_crear_cita(
  p_paciente uuid, p_servicio uuid, p_inicio timestamptz, p_origen text, p_observaciones text, p_forzar boolean default false
) returns uuid language plpgsql security definer set search_path = public as $$
declare cfg public.configuracion_agenda%rowtype; v_fin timestamptz; v_dur int; v_id uuid;
begin
  if not public.es_staff() then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  select * into cfg from public.configuracion_agenda where id = 1;
  perform pg_advisory_xact_lock(hashtext('agenda-citas'));
  if p_forzar then
    select duracion_minutos into v_dur from public.servicios where id = p_servicio;
    v_fin := p_inicio + make_interval(mins => v_dur);
  else
    select d.slot_fin into v_fin from public.disponibilidad(p_servicio, (p_inicio at time zone cfg.zona_horaria)::date) d where d.slot_inicio = p_inicio;
    if v_fin is null then raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001'; end if;
  end if;
  insert into public.citas (paciente_id, servicio_id, inicio, fin, estado, origen, observaciones_admin)
  values (p_paciente, p_servicio, p_inicio, v_fin, 'confirmada', coalesce(p_origen, 'panel'), p_observaciones)
  returning id into v_id;
  return v_id;
exception when exclusion_violation then
  raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001';
end $$;

-- Derecho de eliminación (LOPDP): anonimiza al titular y conserva las citas
-- solo como registro estadístico sin datos personales.
create or replace function public.admin_anonimizar_paciente(p_paciente uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  update public.citas set observaciones_paciente = null, token_hash = null where paciente_id = p_paciente;
  update public.pacientes set nombres = 'Titular', apellidos = 'anonimizado', telefono = '0000000',
         email = 'anonimizado-' || id || '@invalid.local', notas_admin = null, estado = 'anonimizado'
   where id = p_paciente;
  delete from public.registro_actividad where tabla = 'pacientes' and registro_id = p_paciente::text and accion <> 'update';
  update public.registro_actividad set antes = null, despues = null where tabla = 'pacientes' and registro_id = p_paciente::text;
end $$;

-- ---------- Sincronización (Apps Script, clave de servicio) ----------
create or replace function public.sync_tomar_lote(p_limite int default 20) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  -- Solo la acción más reciente de cada cita; las anteriores quedan descartadas.
  update public.cola_sincronizacion q set estado = 'descartado', procesado_en = now()
   where q.estado in ('pendiente','error')
     and exists (select 1 from public.cola_sincronizacion n where n.cita_id = q.cita_id and n.id > q.id and n.estado in ('pendiente','error'));

  with lote as (
    select id from public.cola_sincronizacion
     where estado in ('pendiente','error') and proximo_intento <= now() and intentos < 8
     order by id limit p_limite for update skip locked
  ), marcado as (
    update public.cola_sincronizacion q set estado = 'procesando', intentos = q.intentos + 1
      from lote where q.id = lote.id returning q.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'cola_id', m.id, 'accion', m.accion, 'intento', m.intentos,
      'cita', jsonb_build_object('id', c.id, 'codigo', c.codigo, 'inicio', c.inicio, 'fin', c.fin, 'estado', c.estado,
                                 'google_event_id', c.google_event_id, 'origen', c.origen),
      'servicio', s.nombre,
      'paciente', jsonb_build_object('nombre', p.nombres || ' ' || p.apellidos, 'email', p.email, 'telefono', p.telefono)
    ) order by m.id), '[]'::jsonb) into v
    from marcado m join public.citas c on c.id = m.cita_id
    join public.servicios s on s.id = c.servicio_id join public.pacientes p on p.id = c.paciente_id;
  return v;
end $$;

create or replace function public.sync_resultado(p_cola_id bigint, p_ok boolean, p_google_event_id text default null, p_error text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_cita uuid; v_intentos int;
begin
  select cita_id, intentos into v_cita, v_intentos from public.cola_sincronizacion where id = p_cola_id;
  if v_cita is null then return; end if;
  if p_ok then
    update public.cola_sincronizacion set estado = 'ok', procesado_en = now(), ultimo_error = null where id = p_cola_id;
    update public.citas set google_event_id = coalesce(p_google_event_id, google_event_id), sync_estado = 'ok' where id = v_cita;
  else
    update public.cola_sincronizacion
       set estado = 'error', ultimo_error = left(p_error, 1000),
           proximo_intento = now() + make_interval(mins => least(power(2, v_intentos)::int, 240))
     where id = p_cola_id;
    update public.citas set sync_estado = 'error' where id = v_cita;
    insert into public.registro_errores (origen, mensaje, detalle)
    values ('apps-script', left(coalesce(p_error, 'Error de sincronización'), 500),
            jsonb_build_object('cola_id', p_cola_id, 'cita_id', v_cita, 'intento', v_intentos));
  end if;
end $$;

-- Reemplaza los ocupados de Google Calendar en un rango (eventos ajenos a la plataforma).
create or replace function public.sync_reemplazar_ocupados(p_desde timestamptz, p_hasta timestamptz, p_eventos jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  delete from public.calendario_ocupado where inicio < p_hasta and fin > p_desde;
  insert into public.calendario_ocupado (google_event_id, inicio, fin)
  select e->>'id', (e->>'inicio')::timestamptz, (e->>'fin')::timestamptz
    from jsonb_array_elements(coalesce(p_eventos, '[]'::jsonb)) e
   where (e->>'fin')::timestamptz > (e->>'inicio')::timestamptz
  on conflict (google_event_id) do update set inicio = excluded.inicio, fin = excluded.fin, actualizado_en = now();
  get diagnostics v = row_count;
  return v;
end $$;

-- Citas de un rango para la reconciliación (Supabase manda sobre los eventos de la plataforma).
create or replace function public.sync_citas_rango(p_desde timestamptz, p_hasta timestamptz) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'codigo', codigo, 'inicio', inicio, 'fin', fin,
                                               'estado', estado, 'google_event_id', google_event_id)), '[]'::jsonb)
    from public.citas where inicio < p_hasta and fin > p_desde
$$;

create or replace function public.sync_reencolar(p_cita uuid, p_accion text) returns void
language sql security definer set search_path = public as $$
  insert into public.cola_sincronizacion (cita_id, accion) values (p_cita, p_accion);
$$;

-- ---------- Indicadores del panel ----------
create or replace function public.admin_indicadores() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_staff() then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  return jsonb_build_object(
    'total', (select count(*) from public.citas),
    'pendientes', (select count(*) from public.citas where estado = 'pendiente'),
    'confirmadas', (select count(*) from public.citas where estado in ('confirmada','reprogramada')),
    'canceladas', (select count(*) from public.citas where estado = 'cancelada'),
    'atendidas', (select count(*) from public.citas where estado = 'atendida'),
    'no_asistio', (select count(*) from public.citas where estado = 'no_asistio'),
    'proximas', (select count(*) from public.citas where inicio >= now() and estado in ('pendiente','confirmada','reprogramada')),
    'pacientes', (select count(*) from public.pacientes where estado <> 'anonimizado'),
    'mensajes_pendientes', (select count(*) from public.mensajes_contacto where estado = 'pendiente'),
    'solicitudes_pendientes', (select count(*) from public.solicitudes_derechos where estado in ('recibida','en_proceso')),
    'sync_errores', (select count(*) from public.citas where sync_estado = 'error'),
    'por_semana', (select coalesce(jsonb_agg(w order by w->>'semana'), '[]'::jsonb) from (
        select jsonb_build_object('semana', to_char(date_trunc('week', inicio at time zone 'America/Guayaquil'), 'YYYY-MM-DD'),
                                  'atendidas', count(*) filter (where estado = 'atendida'),
                                  'activas', count(*) filter (where estado in ('pendiente','confirmada','reprogramada')),
                                  'canceladas', count(*) filter (where estado in ('cancelada','no_asistio'))) w
          from public.citas where inicio >= now() - interval '8 weeks' and inicio < now() + interval '4 weeks'
         group by date_trunc('week', inicio at time zone 'America/Guayaquil')) x),
    'por_servicio', (select coalesce(jsonb_agg(jsonb_build_object('servicio', s.nombre, 'total', t.n) order by t.n desc), '[]'::jsonb)
        from (select servicio_id, count(*) n from public.citas where estado <> 'cancelada' group by servicio_id) t
        join public.servicios s on s.id = t.servicio_id)
  );
end $$;
