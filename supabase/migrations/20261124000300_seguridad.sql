-- =====================================================================
-- 03 · Seguridad: Row Level Security, permisos de funciones y Storage
-- Principio: el público solo lee contenido publicado y la disponibilidad
-- (sin datos personales). Toda escritura pública pasa por el servidor.
-- =====================================================================

-- RLS en todas las tablas
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- ---------- Lectura pública de contenido ----------
create policy pub_config on public.configuracion_sitio for select to anon, authenticated using (true);
create policy pub_inst on public.informacion_institucional for select to anon, authenticated using (true);
create policy pub_agenda on public.configuracion_agenda for select to anon, authenticated using (true);
create policy pub_cat on public.categorias_tratamiento for select to anon, authenticated using (activa or public.es_staff());
create policy pub_serv on public.servicios for select to anon, authenticated using (activo or public.es_staff());
create policy pub_serv_dias on public.servicio_dias for select to anon, authenticated using (true);
create policy pub_horarios on public.horarios for select to anon, authenticated using (activo or public.es_staff());
create policy pub_galeria on public.galeria for select to anon, authenticated using (publicado or public.es_staff());
create policy pub_faq on public.faq for select to anon, authenticated using (publicado or public.es_staff());
create policy pub_portafolio on public.portafolio for select to anon, authenticated using (
  public.es_staff() or (publicado and exists (select 1 from public.autorizaciones_publicacion a
     where a.id = portafolio.autorizacion_id and a.estado = 'otorgada' and a.alcance in ('fotografias','ambos'))));
create policy pub_testimonios on public.testimonios for select to anon, authenticated using (
  public.es_staff() or (publicado and exists (select 1 from public.autorizaciones_publicacion a
     where a.id = testimonios.autorizacion_id and a.estado = 'otorgada' and a.alcance in ('testimonio','ambos'))));

-- ---------- Personal (recepción y admin): agenda y pacientes ----------
create policy staff_citas on public.citas for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_pacientes on public.pacientes for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_bloqueos on public.bloqueos_agenda for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_mensajes on public.mensajes_contacto for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_solicitudes on public.solicitudes_derechos for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_cola on public.cola_sincronizacion for select to authenticated using (public.es_staff());
create policy staff_ocupado on public.calendario_ocupado for select to authenticated using (public.es_staff());
create policy staff_errores on public.registro_errores for select to authenticated using (public.es_staff());

-- ---------- Solo administradores: configuración y contenido ----------
do $$ declare t text; begin
  foreach t in array array['configuracion_sitio','informacion_institucional','configuracion_agenda','categorias_tratamiento',
    'servicios','servicio_dias','horarios','galeria','faq','portafolio','testimonios','autorizaciones_publicacion'] loop
    execute format('create policy admin_ins_%1$s on public.%1$I for insert to authenticated with check (public.es_admin())', t);
    execute format('create policy admin_upd_%1$s on public.%1$I for update to authenticated using (public.es_admin()) with check (public.es_admin())', t);
    execute format('create policy admin_del_%1$s on public.%1$I for delete to authenticated using (public.es_admin())', t);
  end loop;
end $$;
create policy staff_lee_autorizaciones on public.autorizaciones_publicacion for select to authenticated using (public.es_staff());
create policy admin_actividad on public.registro_actividad for select to authenticated using (public.es_admin());
create policy admin_usuarios on public.administradores for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy yo_mismo on public.administradores for select to authenticated using (id = auth.uid());
-- limites_solicitudes: sin políticas (solo funciones internas)

-- ---------- Permisos de funciones ----------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.disponibilidad(uuid, date, uuid) to anon, authenticated;
grant execute on function public.dias_disponibles(uuid, date, date) to anon, authenticated;
-- Se usan dentro de las políticas, también para anon (devuelven false).
grant execute on function public.es_staff() to anon, authenticated;
grant execute on function public.es_admin() to anon, authenticated;
grant execute on function public.admin_reprogramar_cita(uuid, timestamptz, boolean) to authenticated;
grant execute on function public.admin_crear_cita(uuid, uuid, timestamptz, text, text, boolean) to authenticated;
grant execute on function public.admin_anonimizar_paciente(uuid) to authenticated;
grant execute on function public.admin_indicadores() to authenticated;
-- reservar_cita, *_por_token, verificar_limite y sync_* solo con la clave de servicio (service_role).
grant execute on all functions in schema public to service_role;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Las funciones de disparadores no deben poder llamarse desde la API
revoke all on table public.limites_solicitudes from anon, authenticated;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('publico', 'publico', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('privado', 'privado', false, 10485760, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy storage_admin_publico on storage.objects for all to authenticated
  using (bucket_id = 'publico' and public.es_admin()) with check (bucket_id = 'publico' and public.es_admin());
create policy storage_staff_privado on storage.objects for all to authenticated
  using (bucket_id = 'privado' and public.es_staff()) with check (bucket_id = 'privado' and public.es_staff());
