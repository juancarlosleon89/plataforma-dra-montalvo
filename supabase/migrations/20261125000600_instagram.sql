-- Sección de Instagram en el inicio: enlaces de publicaciones elegidas desde el panel.
alter table public.configuracion_sitio
  add column if not exists instagram_publicaciones text[] not null default '{}';

update public.configuracion_sitio set instagram_publicaciones = array[
  'https://www.instagram.com/reel/DgEK9_9iSuR/',
  'https://www.instagram.com/reel/Df3YhG0HBaP/',
  'https://www.instagram.com/reel/De-pvunjFkw/',
  'https://www.instagram.com/p/DeNpl_ZAQvg/',
  'https://www.instagram.com/p/Dd-TWPzlGY_/',
  'https://www.instagram.com/p/Dd5HAYmjCAz/'
] where cardinality(instagram_publicaciones) = 0;
