-- ============================================================
-- consumer_preferences
-- Preferencias e instrucciones persistentes del consumidor
-- para personalizar las recomendaciones del chatbot de IA.
--
-- UNIQUE constraint en user_id: una sola fila (un conjunto de
-- preferencias) por consumidor. Se usa upsert para insertar
-- o actualizar.
--
-- RLS: cada consumidor solo puede SELECT/INSERT/UPDATE/DELETE
-- sobre su propia fila (user_id = auth.uid()).
-- ============================================================

create table if not exists public.consumer_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Índice para búsqueda rápida por usuario (aunque unique ya lo cubre,
-- se añade por claridad y para el filtrado por user_id).
create index if not exists consumer_preferences_user_id_idx
  on public.consumer_preferences (user_id);

-- Trigger para mantener updated_at actualizado en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists consumer_preferences_set_updated_at
  on public.consumer_preferences;

create trigger consumer_preferences_set_updated_at
  before update on public.consumer_preferences
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.consumer_preferences enable row level security;

drop policy if exists "Consumidor lee sus propias preferencias"
  on public.consumer_preferences;
create policy "Consumidor lee sus propias preferencias"
  on public.consumer_preferences
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Consumidor inserta sus propias preferencias"
  on public.consumer_preferences;
create policy "Consumidor inserta sus propias preferencias"
  on public.consumer_preferences
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Consumidor actualiza sus propias preferencias"
  on public.consumer_preferences;
create policy "Consumidor actualiza sus propias preferencias"
  on public.consumer_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Consumidor elimina sus propias preferencias"
  on public.consumer_preferences;
create policy "Consumidor elimina sus propias preferencias"
  on public.consumer_preferences
  for delete to authenticated
  using (user_id = auth.uid());
