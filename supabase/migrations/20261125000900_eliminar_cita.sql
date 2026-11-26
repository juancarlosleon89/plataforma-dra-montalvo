-- Eliminar citas desde el panel (solo administración).
-- Paso 1 (admin_preparar_eliminacion): si la cita sigue activa y tiene evento en Google Calendar,
--   se marca cancelada para que el Apps Script borre el evento. La acción encolada se registra como
--   'actualizar' para que el script NO envíe al paciente el correo de cancelación.
-- Paso 2 (admin_eliminar_cita): borra la cita (su cola se borra en cascada). Si el evento no alcanzó
--   a borrarse, la reconciliación horaria del script elimina los eventos huérfanos de la plataforma.
create or replace function public.admin_preparar_eliminacion(p_cita uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_estado text; v_evento text;
begin
  if not public.es_admin() then raise exception 'SIN_PERMISO'; end if;
  select estado, google_event_id into v_estado, v_evento from public.citas where id = p_cita for update;
  if not found then raise exception 'CITA_NO_ENCONTRADA'; end if;
  if v_evento is null then return false; end if;
  if v_estado <> 'cancelada' then
    update public.citas set estado = 'cancelada', cancelada_por = 'consultorio' where id = p_cita;
    update public.cola_sincronizacion set accion = 'actualizar'
     where id = (select max(id) from public.cola_sincronizacion where cita_id = p_cita and estado = 'pendiente');
  end if;
  return true;
end $$;

create or replace function public.admin_eliminar_cita(p_cita uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_codigo text;
begin
  if not public.es_admin() then raise exception 'SIN_PERMISO'; end if;
  delete from public.citas where id = p_cita returning codigo into v_codigo;
  if v_codigo is null then raise exception 'CITA_NO_ENCONTRADA'; end if;
  return v_codigo;
end $$;

revoke all on function public.admin_preparar_eliminacion(uuid) from public, anon;
revoke all on function public.admin_eliminar_cita(uuid) from public, anon;
grant execute on function public.admin_preparar_eliminacion(uuid) to authenticated;
grant execute on function public.admin_eliminar_cita(uuid) to authenticated;
