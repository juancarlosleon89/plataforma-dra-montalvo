-- 05 · Ajustes tras el análisis de seguridad de Supabase
alter function public._limpiar(text, int) set search_path = public;

-- Envoltorio público: sin el parámetro interno p_ignorar_cita.
create or replace function public.disponibilidad_publica(p_servicio uuid, p_fecha date)
returns table (slot_inicio timestamptz, slot_fin timestamptz)
language sql stable security definer set search_path = public as $$
  select * from public.disponibilidad(p_servicio, p_fecha, null)
$$;
revoke execute on function public.disponibilidad(uuid, date, uuid) from anon, authenticated;
revoke execute on function public.disponibilidad_publica(uuid, date) from public;
grant execute on function public.disponibilidad_publica(uuid, date) to anon, authenticated;

-- dias_disponibles: máximo 62 días por consulta (ya limitado) y sin acceso al parámetro interno.
create or replace function public.dias_disponibles(p_servicio uuid, p_desde date, p_hasta date)
returns table (fecha date, libres int)
language sql stable security definer set search_path = public as $$
  select d::date, (select count(*)::int from public.disponibilidad(p_servicio, d::date, null))
    from generate_series(greatest(p_desde, current_date), least(p_hasta, p_desde + 62), interval '1 day') d
$$;

comment on table public.limites_solicitudes is 'Sin políticas a propósito: solo la usa verificar_limite() con la clave de servicio.';
