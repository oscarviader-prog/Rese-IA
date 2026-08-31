-- ============================================================
-- consumer_favorites
-- Establecimientos favoritos del consumidor para que el chatbot
-- de IA personalice sus sugerencias/recomendaciones.
--
-- UNIQUE constraint en (user_id, place_id): evita duplicados del
-- mismo establecimiento (identificado por su Google Place ID) para
-- un mismo consumidor. Se usa upsert o insert con onConflict.
--
-- place_name / place_address / place_category / place_rating /
-- place_user_rating_count: instantánea de presentación capturada
-- al guardar el favorito. El identificador canónico es place_id.
--
-- RLS: cada consumidor solo puede SELECT/INSERT/DELETE sobre sus
-- propias filas (user_id = auth.uid()).
-- ============================================================

create table if not exists public.consumer_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  place_id text not null,
  place_name text not null default '',
  place_address text not null default '',
  place_category text not null default '',
  place_rating numeric,
  place_user_rating_count integer,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

-- Índice para búsqueda rápida por usuario (cubierto por el unique,
-- se añade por claridad y para el filtrado por user_id).
create index if not exists consumer_favorites_user_id_idx
  on public.consumer_favorites (user_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.consumer_favorites enable row level security;

drop policy if exists "Consumidor lee sus propios favoritos"
  on public.consumer_favorites;
create policy "Consumidor lee sus propios favoritos"
  on public.consumer_favorites
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Consumidor añade sus propios favoritos"
  on public.consumer_favorites;
create policy "Consumidor añade sus propios favoritos"
  on public.consumer_favorites
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Consumidor elimina sus propios favoritos"
  on public.consumer_favorites;
create policy "Consumidor elimina sus propios favoritos"
  on public.consumer_favorites
  for delete to authenticated
  using (user_id = auth.uid());
