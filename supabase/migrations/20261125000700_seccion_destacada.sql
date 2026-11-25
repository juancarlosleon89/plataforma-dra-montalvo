-- Sección destacada del inicio (antes «Prótesis de circonio»), editable en Configuración.
alter table public.configuracion_sitio
  add column if not exists destacado_visible boolean not null default true,
  add column if not exists destacado_imagen_url text,
  add column if not exists destacado_rotulo text,
  add column if not exists destacado_titulo text,
  add column if not exists destacado_texto text,
  add column if not exists destacado_boton_texto text,
  add column if not exists destacado_boton_enlace text;

update public.configuracion_sitio set
  destacado_imagen_url = coalesce(destacado_imagen_url, '/img/protesis-circonio-detalle.webp'),
  destacado_rotulo = coalesce(destacado_rotulo, 'Materiales'),
  destacado_titulo = coalesce(destacado_titulo, 'Prótesis de circonio: resistencia y un aspecto natural.'),
  destacado_texto = coalesce(destacado_texto, 'El circonio permite restauraciones fijas resistentes y de color similar al diente natural. La valoración define si es la opción adecuada para cada caso.'),
  destacado_boton_texto = coalesce(destacado_boton_texto, 'Agendar valoración'),
  destacado_boton_enlace = coalesce(destacado_boton_enlace, '/agendar?servicio=valoracion')
where id = 1;
