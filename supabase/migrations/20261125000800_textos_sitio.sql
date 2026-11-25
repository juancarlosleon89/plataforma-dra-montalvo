-- Textos editables del sitio (títulos, frases entre bloques, botones, menús, formularios).
-- Solo se guardan los textos que el administrador cambia; el resto usa el valor por defecto del código.
create table if not exists public.textos_sitio (
  id text primary key check (id ~ '^[a-z0-9_.]+$'),
  valor text not null check (char_length(valor) <= 4000),
  actualizado_en timestamptz not null default now()
);

alter table public.textos_sitio enable row level security;
create policy textos_lectura_publica on public.textos_sitio for select using (true);
create policy textos_admin_insert on public.textos_sitio for insert to authenticated with check (public.es_admin());
create policy textos_admin_update on public.textos_sitio for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy textos_admin_delete on public.textos_sitio for delete to authenticated using (public.es_admin());
grant select on public.textos_sitio to anon, authenticated;
grant insert, update, delete on public.textos_sitio to authenticated;

create trigger auditar_textos_sitio after insert or update or delete on public.textos_sitio
  for each row execute function public.auditar();
