-- =====================================================================
-- 04 · Datos iniciales (editables desde el panel)
-- Solo información verificada en el perfil público de la doctora.
-- Lo provisional queda marcado y se corrige desde el panel.
-- =====================================================================
insert into public.configuracion_sitio (id, nombre_comercial, especialidad, telefono, email, whatsapp_url, whatsapp_numero,
  mensaje_whatsapp, direccion, referencias, ciudad, maps_query, redes, hero_titulo, hero_subtitulo, hero_imagen_url)
values (1, 'Dra. Monserrath Montalvo', 'Prótesis & Rehabilitación Oral', null, null,
  'https://wa.me/message/R7ZAG666US2AF1', null,
  'Hola, Dra. Montalvo. Quisiera agendar una valoración.',
  'Edificio Movilab 2, calles Quito y Cuenca', 'Edificio de fachada de vidrio en la esquina de Quito y Cuenca.',
  'Ambato, Ecuador', 'Movilab 2, Quito y Cuenca, Ambato, Ecuador',
  '{"instagram":"https://www.instagram.com/dra.monsemontalvo/"}',
  'Una sonrisa que vuelve a funcionar, y a sentirse propia.',
  'Rehabilitación oral y prótesis dentales con un plan pensado para cada sonrisa.',
  '/img/doctora-bata.webp');

insert into public.informacion_institucional (id, propuesta, presentacion, diferenciadores,
  perfil_nombre, perfil_titulo, perfil_foto_url, perfil_especialidades, perfil_enfoque)
values (1,
  'Rehabilitación oral y prótesis dentales con un plan pensado para cada sonrisa.',
  'Consultorio especializado en rehabilitación oral, prótesis dentales, diseño de sonrisa y estética dental en Ambato. Cada tratamiento empieza con una valoración y un plan explicado con calma, paso a paso.',
  '[{"titulo":"Especialista en rehabilitación oral","texto":"La atención la dirige una especialista en prótesis y rehabilitación oral."},
    {"titulo":"Valoración antes de tratar","texto":"Ningún tratamiento empieza sin diagnóstico y un plan explicado al paciente."},
    {"titulo":"Consultorio propio en Ambato","texto":"Instalaciones nuevas en el centro de la ciudad, en Quito y Cuenca."}]',
  'Dra. Monserrath Montalvo', 'Especialista en Rehabilitación Oral', '/img/doctora-consultorio.webp',
  array['Prótesis dentales','Rehabilitación oral','Diseño de sonrisa','Estética dental'],
  'Escuchar primero, explicar cada opción y acompañar al paciente durante todo el tratamiento.');

insert into public.configuracion_agenda (id, politica_cancelacion, horarios_provisionales)
values (1, 'Puede cancelar o reprogramar su cita desde el enlace de su correo hasta 24 horas antes. Después de ese plazo, comuníquese por WhatsApp.', true);

-- Horarios PROVISIONALES: lun–vie 09:00–13:00 y 15:00–17:30; sábado 09:00–13:00
insert into public.horarios (dia_semana, hora_inicio, hora_fin)
select d, '09:00'::time, '13:00'::time from generate_series(1, 6) d
union all
select d, '15:00'::time, '17:30'::time from generate_series(1, 5) d;

with c as (
  insert into public.categorias_tratamiento (nombre, orden) values
    ('Consulta', 1), ('Rehabilitación y prótesis', 2), ('Estética dental', 3)
  returning id, nombre
)
insert into public.servicios (slug, categoria_id, nombre, descripcion, objetivo, beneficios, indicaciones, imagen_url,
                              duracion_minutos, destacado, orden)
select v.slug, c.id, v.nombre, v.descripcion, v.objetivo, v.beneficios, v.indicaciones, v.imagen, v.dur, v.dest, v.ord
from (values
  ('valoracion', 'Consulta', 'Valoración y plan de tratamiento',
   'Primera consulta para revisar el estado de la boca, escuchar lo que el paciente busca y definir un plan.',
   'Obtener un diagnóstico claro y un plan con opciones antes de iniciar cualquier tratamiento.',
   array['Diagnóstico personalizado','Opciones explicadas con claridad','Presupuesto antes de empezar'],
   'Recomendada para cualquier paciente nuevo.', '/img/doctora-consultorio.webp', 30, true, 1),
  ('protesis-fijas', 'Rehabilitación y prótesis', 'Prótesis fijas y coronas',
   'Restauraciones fijas que reemplazan o recubren piezas dentales dañadas o ausentes, incluidas las prótesis de circonio.',
   'Recuperar la función de masticar y la estética de los dientes de forma estable.',
   array['Aspecto natural','Materiales resistentes como el circonio','Mejor masticación'],
   'Dientes con gran desgaste, fracturas o piezas ausentes, según valoración.', '/img/protesis-circonio-detalle.webp', 60, true, 2),
  ('protesis-removibles', 'Rehabilitación y prótesis', 'Prótesis removibles y totales',
   'Prótesis que el paciente puede retirar para su limpieza, parciales o completas.',
   'Devolver dientes, soporte y confianza cuando faltan varias piezas.',
   array['Solución para varias piezas ausentes','Ajuste personalizado','Fácil higiene'],
   'Pacientes con pérdida parcial o total de dientes.', null, 60, false, 3),
  ('rehabilitacion-oral', 'Rehabilitación y prótesis', 'Rehabilitación oral integral',
   'Plan completo que combina varios tratamientos para recuperar la salud, la función y la estética de toda la boca.',
   'Resolver de forma ordenada casos complejos con varias necesidades a la vez.',
   array['Visión de conjunto','Tratamiento por etapas','Resultados duraderos'],
   'Casos con desgaste generalizado, varias piezas ausentes o problemas de mordida.', '/img/doctora-bata.webp', 60, true, 4),
  ('diseno-de-sonrisa', 'Estética dental', 'Diseño de sonrisa',
   'Planificación estética de la forma, el tamaño y el color de los dientes en armonía con el rostro.',
   'Lograr una sonrisa armónica y natural, planificada antes de tocar un diente.',
   array['Planificación previa','Resultado acorde al rostro','Mayor seguridad al sonreír'],
   'Pacientes que desean mejorar la estética de su sonrisa.', null, 60, true, 5),
  ('estetica-dental', 'Estética dental', 'Estética dental',
   'Tratamientos para mejorar color, forma y pequeños defectos de los dientes.',
   'Corregir detalles estéticos de forma conservadora.',
   array['Tratamientos conservadores','Mejora del color y la forma','Resultados naturales'],
   'Manchas, pequeñas fracturas o dientes con forma irregular.', null, 60, false, 6)
) as v(slug, cat, nombre, descripcion, objetivo, beneficios, indicaciones, imagen, dur, dest, ord)
join c on c.nombre = v.cat;

insert into public.galeria (imagen_url, titulo, descripcion, categoria, orden) values
  ('/img/recepcion.webp', 'Recepción', 'Recepción del consultorio con el muro de listones y el logotipo', 'recepcion', 1),
  ('/img/doctora-bata.webp', 'Área de atención', 'La doctora en la recepción del consultorio', 'consultorio', 2),
  ('/img/doctora-consultorio.webp', 'Consultorio', 'Espacio de atención del consultorio', 'consultorio', 3);

insert into public.faq (pregunta, respuesta, orden) values
  ('¿Cómo agendo una cita?', 'Desde la sección Agendar: elija el tratamiento, el día y un horario libre. Recibirá un correo con la confirmación y un enlace para gestionar su cita.', 1),
  ('¿Qué pasa en la primera consulta?', 'Se realiza una valoración: revisamos su caso, escuchamos lo que busca y le explicamos las opciones de tratamiento antes de empezar.', 2),
  ('¿Dónde está el consultorio?', 'En el edificio Movilab 2, en las calles Quito y Cuenca, en Ambato.', 3),
  ('¿Cómo me preparo para la consulta?', 'Llegue unos minutos antes y traiga, si los tiene, radiografías o tratamientos previos.', 4),
  ('¿Puedo cancelar o reprogramar?', 'Sí, desde el enlace de su correo hasta 24 horas antes de la cita. Después de ese plazo, escríbanos por WhatsApp.', 5),
  ('¿Qué datos personales piden y para qué?', 'Solo nombre, teléfono y correo, para gestionar su cita y contactarle. Puede consultar, corregir o eliminar sus datos desde la página de privacidad.', 6);
