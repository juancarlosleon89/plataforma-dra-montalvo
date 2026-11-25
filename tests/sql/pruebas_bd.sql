-- =====================================================================
-- Pruebas de base de datos (ejecutar en el editor SQL de Supabase).
-- Crea datos de prueba, verifica reglas y los elimina al final.
-- Resultado: una fila por prueba con OK / FALLO.
-- =====================================================================
create temp table if not exists resultados (n serial, prueba text, ok boolean, detalle text);
truncate resultados;
grant all on resultados to anon, authenticated;
grant usage on sequence resultados_n_seq to anon, authenticated;

do $$
declare
  v_serv uuid; v_lunes date; v_slot1 timestamptz; v_slot2 timestamptz; v_r jsonb; v_r2 jsonb;
  v_token text; v_cnt int; v_err text; v_lote jsonb; v_cola bigint; v_cita uuid;
begin
  select id into v_serv from servicios where slug = 'valoracion';
  v_lunes := current_date + ((8 - extract(dow from current_date)::int) % 7) + 7;   -- lunes de la próxima semana

  -- 1. Disponibilidad
  select count(*) into v_cnt from disponibilidad(v_serv, v_lunes);
  insert into resultados (prueba, ok, detalle) values ('1. Disponibilidad lunes (30 min, 09-13 y 15-17:30)', v_cnt = 13, v_cnt || ' horarios');
  select slot_inicio into v_slot1 from disponibilidad(v_serv, v_lunes) order by 1 limit 1;
  select slot_inicio into v_slot2 from disponibilidad(v_serv, v_lunes) order by 1 offset 3 limit 1;
  select count(*) into v_cnt from disponibilidad(v_serv, v_lunes - 1);
  insert into resultados (prueba, ok, detalle) values ('2. Domingo sin horarios', v_cnt = 0, v_cnt || ' horarios');

  -- 2. Reserva válida
  v_r := reservar_cita(v_serv, v_slot1, 'Prueba', 'Automática', '0999999999', 'prueba.auto@example.com', 'test', 'v1');
  v_token := v_r->>'token';
  insert into resultados (prueba, ok, detalle) values ('3. Reserva válida', v_r ? 'cita_id', 'código ' || (v_r->>'codigo') || ', estado ' || (v_r->>'estado'));

  -- 3. Duplicado
  begin
    v_r2 := reservar_cita(v_serv, v_slot1, 'Otra', 'Persona', '0988888888', 'otra.persona@example.com', null, 'v1');
    insert into resultados (prueba, ok, detalle) values ('4. Mismo horario rechazado', false, 'se permitió el duplicado');
  exception when others then
    insert into resultados (prueba, ok, detalle) values ('4. Mismo horario rechazado', sqlerrm = 'HORARIO_NO_DISPONIBLE', sqlerrm);
  end;

  -- 4. Restricción de exclusión (aunque se salte la función)
  begin
    insert into citas (paciente_id, servicio_id, inicio, fin)
    select paciente_id, servicio_id, inicio + interval '10 minutes', fin + interval '10 minutes' from citas where id = (v_r->>'cita_id')::uuid;
    insert into resultados (prueba, ok, detalle) values ('5. Restricción de solape en la tabla', false, 'se permitió el solape');
  exception when exclusion_violation then
    insert into resultados (prueba, ok, detalle) values ('5. Restricción de solape en la tabla', true, 'exclusion_violation');
  end;

  -- 5. El horario ocupado desaparece de la disponibilidad
  select count(*) into v_cnt from disponibilidad(v_serv, v_lunes) where slot_inicio = v_slot1;
  insert into resultados (prueba, ok, detalle) values ('6. Horario reservado ya no se ofrece', v_cnt = 0, v_cnt::text);

  -- 6. Validaciones
  begin
    perform reservar_cita(v_serv, v_slot2, 'X', 'Y', 'abc', 'no-es-correo', null, 'v1');
    insert into resultados (prueba, ok, detalle) values ('7. Datos inválidos rechazados', false, 'aceptado');
  exception when others then
    insert into resultados (prueba, ok, detalle) values ('7. Datos inválidos rechazados', sqlerrm like 'DATOS_INVALIDOS%', sqlerrm);
  end;
  begin
    perform reservar_cita(v_serv, v_slot2, 'X', 'Y', '0999999999', 'x@example.com', null, null);
    insert into resultados (prueba, ok, detalle) values ('8. Consentimiento obligatorio', false, 'aceptado');
  exception when others then
    insert into resultados (prueba, ok, detalle) values ('8. Consentimiento obligatorio', sqlerrm = 'CONSENTIMIENTO_REQUERIDO', sqlerrm);
  end;
  begin
    perform reservar_cita(v_serv, v_slot1 + interval '7 minutes', 'X', 'Y', '0999999999', 'x@example.com', null, 'v1');
    insert into resultados (prueba, ok, detalle) values ('9. Hora fuera de la grilla rechazada', false, 'aceptado');
  exception when others then
    insert into resultados (prueba, ok, detalle) values ('9. Hora fuera de la grilla rechazada', sqlerrm = 'HORARIO_NO_DISPONIBLE', sqlerrm);
  end;

  -- 7. Bloqueo de agenda
  insert into bloqueos_agenda (tipo, inicio, fin, motivo) values ('vacaciones', (v_lunes + time '15:00') at time zone 'America/Guayaquil', (v_lunes + time '18:00') at time zone 'America/Guayaquil', 'PRUEBA');
  select count(*) into v_cnt from disponibilidad(v_serv, v_lunes);
  insert into resultados (prueba, ok, detalle) values ('10. Bloqueo elimina la tarde', v_cnt = 7, v_cnt || ' horarios (8 de mañana - 1 reservado)');
  delete from bloqueos_agenda where motivo = 'PRUEBA';

  -- 8. Ocupado en Google Calendar
  perform sync_reemplazar_ocupados(v_lunes::timestamptz, (v_lunes + 1)::timestamptz,
    jsonb_build_array(jsonb_build_object('id', 'prueba-gcal', 'inicio', v_slot2, 'fin', v_slot2 + interval '1 hour')));
  select count(*) into v_cnt from disponibilidad(v_serv, v_lunes) where slot_inicio = v_slot2;
  insert into resultados (prueba, ok, detalle) values ('11. Evento de Google Calendar bloquea el horario', v_cnt = 0, v_cnt::text);
  delete from calendario_ocupado where google_event_id = 'prueba-gcal';

  -- 9. Cola de sincronización
  select count(*) into v_cnt from cola_sincronizacion where cita_id = (v_r->>'cita_id')::uuid and accion = 'crear';
  insert into resultados (prueba, ok, detalle) values ('12. Reserva encola "crear" para Calendar', v_cnt = 1, v_cnt::text);
  v_lote := sync_tomar_lote(50);
  select (e->>'cola_id')::bigint into v_cola from jsonb_array_elements(v_lote) e where e->'cita'->>'id' = v_r->>'cita_id';
  perform sync_resultado(v_cola, false, null, 'Error simulado');
  select count(*) into v_cnt from cola_sincronizacion where id = v_cola and estado = 'error' and proximo_intento > now();
  insert into resultados (prueba, ok, detalle) values ('13. Error de sincronización programa reintento', v_cnt = 1, 'reintento con espera exponencial');
  update cola_sincronizacion set proximo_intento = now() where id = v_cola;
  v_lote := sync_tomar_lote(50);
  select (e->>'cola_id')::bigint into v_cola from jsonb_array_elements(v_lote) e where e->'cita'->>'id' = v_r->>'cita_id';
  perform sync_resultado(v_cola, true, 'evento-prueba-123', null);
  select count(*) into v_cnt from citas where id = (v_r->>'cita_id')::uuid and google_event_id = 'evento-prueba-123' and sync_estado = 'ok';
  insert into resultados (prueba, ok, detalle) values ('14. Reintento exitoso guarda el ID del evento', v_cnt = 1, 'evento-prueba-123');

  -- 10. Gestión por token
  v_r2 := cita_por_token(v_token);
  insert into resultados (prueba, ok, detalle) values ('15. Consulta por enlace del paciente', (v_r2->>'puede_modificar')::boolean, v_r2->>'servicio');
  v_r2 := reprogramar_por_token(v_token, v_slot2);
  insert into resultados (prueba, ok, detalle) values ('16. Reprogramación por el paciente', v_r2->>'estado' = 'reprogramada', v_r2->>'inicio');
  select count(*) into v_cnt from disponibilidad(v_serv, v_lunes) where slot_inicio = v_slot1;
  insert into resultados (prueba, ok, detalle) values ('17. Horario anterior queda libre', v_cnt = 1, v_cnt::text);
  v_r2 := cancelar_por_token(v_token);
  select count(*) into v_cnt from cola_sincronizacion where cita_id = (v_r->>'cita_id')::uuid and accion = 'cancelar';
  insert into resultados (prueba, ok, detalle) values ('18. Cancelación por el paciente encola "cancelar"', v_r2->>'estado' = 'cancelada' and v_cnt = 1, v_cnt::text);
  begin
    perform cancelar_por_token(v_token);
    insert into resultados (prueba, ok, detalle) values ('19. Cita cancelada no se modifica de nuevo', false, 'permitido');
  exception when others then
    insert into resultados (prueba, ok, detalle) values ('19. Cita cancelada no se modifica de nuevo', sqlerrm = 'CITA_NO_MODIFICABLE', sqlerrm);
  end;
  select count(*) into v_cnt from disponibilidad(v_serv, v_lunes) where slot_inicio = v_slot2;
  insert into resultados (prueba, ok, detalle) values ('20. Cancelar libera el horario', v_cnt = 1, v_cnt::text);

  -- 11. Plazo de cancelación
  select id into v_cita from citas where id = (v_r->>'cita_id')::uuid;
  v_r2 := reservar_cita(v_serv, v_slot1, 'Prueba', 'Automática', '0999999999', 'prueba.auto@example.com', null, 'v1');
  update citas set inicio = now() + interval '2 hours', fin = now() + interval '150 minutes' where id = (v_r2->>'cita_id')::uuid;
  begin
    perform cancelar_por_token(v_r2->>'token');
    insert into resultados (prueba, ok, detalle) values ('21. Cancelación fuera de plazo rechazada', false, 'permitido');
  exception when others then
    insert into resultados (prueba, ok, detalle) values ('21. Cancelación fuera de plazo rechazada', sqlerrm = 'FUERA_DE_PLAZO', sqlerrm);
  end;

  -- 12. Límite anti-spam
  perform verificar_limite('prueba-ip', 3, 600); perform verificar_limite('prueba-ip', 3, 600); perform verificar_limite('prueba-ip', 3, 600);
  insert into resultados (prueba, ok, detalle) values ('22. Límite de solicitudes', not verificar_limite('prueba-ip', 3, 600), '4.ª solicitud bloqueada');
  delete from limites_solicitudes where clave = 'prueba-ip';

  -- Limpieza
  delete from citas where paciente_id in (select id from pacientes where email like '%@example.com');
  delete from pacientes where email like '%@example.com';
  delete from registro_errores where mensaje = 'Error simulado';
end $$;

-- 13. Seguridad por roles (RLS y permisos de funciones)
set role anon;
do $$ declare v int; begin
  select count(*) into v from public.servicios;
  insert into resultados (prueba, ok, detalle) values ('23. Público lee servicios activos', v > 0, v || ' servicios');
  select count(*) into v from public.pacientes;
  insert into resultados (prueba, ok, detalle) values ('24. Público NO ve pacientes', v = 0, v || ' filas');
  select count(*) into v from public.citas;
  insert into resultados (prueba, ok, detalle) values ('25. Público NO ve citas', v = 0, v || ' filas');
  begin
    perform public.reservar_cita(null, now(), 'a', 'b', '0999999999', 'a@b.co', null, 'v1');
    insert into resultados (prueba, ok, detalle) values ('26. Público NO puede llamar reservar_cita directamente', false, 'permitido');
  exception when insufficient_privilege then
    insert into resultados (prueba, ok, detalle) values ('26. Público NO puede llamar reservar_cita directamente', true, 'permiso denegado');
  end;
  begin
    insert into public.servicios (slug, nombre) values ('hack', 'hack');
    insert into resultados (prueba, ok, detalle) values ('27. Público NO puede crear servicios', false, 'permitido');
  exception when insufficient_privilege then
    insert into resultados (prueba, ok, detalle) values ('27. Público NO puede crear servicios', true, 'RLS');
  end;
  begin
    perform public.admin_indicadores();
    insert into resultados (prueba, ok, detalle) values ('28. Público NO accede a indicadores', false, 'permitido');
  exception when insufficient_privilege then
    insert into resultados (prueba, ok, detalle) values ('28. Público NO accede a indicadores', true, 'permiso denegado');
  end;
end $$;
reset role;

-- Usuario autenticado que NO es administrador
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', false);
set role authenticated;
do $$ declare v int; begin
  select count(*) into v from public.pacientes;
  insert into resultados (prueba, ok, detalle) values ('29. Usuario registrado sin rol NO ve pacientes', v = 0, v || ' filas');
  begin
    perform public.admin_indicadores();
    insert into resultados (prueba, ok, detalle) values ('30. Usuario sin rol NO accede al panel', false, 'permitido');
  exception when others then
    insert into resultados (prueba, ok, detalle) values ('30. Usuario sin rol NO accede al panel', sqlerrm = 'NO_AUTORIZADO', sqlerrm);
  end;
end $$;
reset role;
select set_config('request.jwt.claims', '', false);

select prueba, case when ok then 'OK' else 'FALLO' end as resultado, detalle from resultados order by n;

