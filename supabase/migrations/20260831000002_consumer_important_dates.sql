-- ============================================================
-- consumer_important_dates
-- Fechas importantes del consumidor (perspectiva consumidor).
--
-- Almacena fechas señaladas (ej. aniversarios, cumpleaños, fechas
-- únicas) junto con los gustos/categorías asociados a cada ocasión,
-- para poder recordarle al consumidor cuando se acerquen y recomendarle
-- establecimientos adecuados.
--
-- Campos:
--   name            : nombre de la fecha (obligatorio, ej. "Aniversario con Ana")
--   day / month     : día y mes de la celebración (obligatorios y validados)
--   year            : AÑO SOLO para fechas únicas (occurrence_type = 'unica').
--                     Para fechas anuales (occurrence_type = 'anual') se deja
--                     NULL porque se repiten cada año. No se inventa un año
--                     ficticio.
--   occurrence_type : 'anual' | 'unica'
--   gustos          : text[] con las categorías/gustos asociados a la ocasión
--                     (lista controlada en el frontend). Opcional.
--
-- Restricciones:
--   - day entre 1 y 31, month entre 1 y 12 (validez profunda por mes se
--     valida en el frontend; aquí garantizamos rangos básicos).
--   - Para fechas únicas, year es obligatorio.
--   - Para fechas anuales, year debe ser NULL.
--
-- RLS: cada consumidor solo puede SELECT/INSERT/UPDATE/DELETE sobre sus
-- propias filas (user_id = auth.uid()).
-- ============================================================

create table if not exists public.consumer_important_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  day integer not null check (day between 1 and 31),
  month integer not null check (month between 1 and 12),
  year integer,
  occurrence_type text not null default 'anual'
    check (occurrence_type in ('anual', 'unica')),
  gustos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (occurrence_type = 'unica' and year is not null)
    or
    (occurrence_type = 'anual' and year is null)
  )
);

-- Índice para búsqueda rápida por usuario.
create index if not exists consumer_important_dates_user_id_idx
  on public.consumer_important_dates (user_id);

-- Trigger para mantener updated_at actualizado en cada UPDATE.
create or replace function public.set_updated_at_important_dates()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists consumer_important_dates_set_updated_at
  on public.consumer_important_dates;

create trigger consumer_important_dates_set_updated_at
  before update on public.consumer_important_dates
  for each row execute function public.set_updated_at_important_dates();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.consumer_important_dates enable row level security;

drop policy if exists "Consumidor lee sus propias fechas"
  on public.consumer_important_dates;
create policy "Consumidor lee sus propias fechas"
  on public.consumer_important_dates
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Consumidor inserta sus propias fechas"
  on public.consumer_important_dates;
create policy "Consumidor inserta sus propias fechas"
  on public.consumer_important_dates
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Consumidor actualiza sus propias fechas"
  on public.consumer_important_dates;
create policy "Consumidor actualiza sus propias fechas"
  on public.consumer_important_dates
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Consumidor elimina sus propias fechas"
  on public.consumer_important_dates;
create policy "Consumidor elimina sus propias fechas"
  on public.consumer_important_dates
  for delete to authenticated
  using (user_id = auth.uid());
