-- ============================================================
-- consumer_alert_config
-- Configuración de alertas y notificaciones del consumidor.
--
-- Permite elegir qué alertas están activas, por qué canal se
-- reciben (email / in_app / ambas) y con qué frecuencia
-- (immediate / daily / weekly), de forma persistente por usuario.
--
-- UNIQUE en (user_id, alert_type): una única fila (un conjunto de
-- opciones) por tipo de alerta y consumidor. Se usa upsert.
--
-- consumer_no_molestar
-- Modo global "No molestar": pausa todas las alertas durante un
-- periodo [start_date, end_date]. Al terminar el periodo se reanuda
-- automáticamente (la detección se hace por fecha, sin desactivar
-- manualmente). UNIQUE en user_id: una única fila por consumidor.
--
-- RLS: cada consumidor solo puede SELECT/INSERT/UPDATE/DELETE sobre
-- su propia configuración (user_id = auth.uid()).
-- ============================================================

-- ------------------------------------------------------------
-- consumer_alert_config
-- ------------------------------------------------------------
create table if not exists public.consumer_alert_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  alert_type text not null
    check (alert_type in (
      'important_date_reminder', -- recordatorio de fecha importante
      'favorite_news'            -- novedades de establecimientos favoritos
    )),
  enabled boolean not null default true,
  channels text[] not null default '{in_app}'
    check (
      cardinality(channels) > 0
      and channels <@ array['email', 'in_app']::text[]
    ),
  frequency text not null default 'immediate'
    check (frequency in ('immediate', 'daily', 'weekly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, alert_type)
);

create index if not exists consumer_alert_config_user_id_idx
  on public.consumer_alert_config (user_id);

create or replace function public.set_updated_at_alert_config()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists consumer_alert_config_set_updated_at
  on public.consumer_alert_config;

create trigger consumer_alert_config_set_updated_at
  before update on public.consumer_alert_config
  for each row execute function public.set_updated_at_alert_config();

-- ------------------------------------------------------------
-- consumer_no_molestar
-- ------------------------------------------------------------
create table if not exists public.consumer_no_molestar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  -- Si está activo, ambas fechas deben estar presentes.
  check (not enabled or (start_date is not null and end_date is not null)),
  -- La fecha de fin no puede ser anterior a la de inicio.
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index if not exists consumer_no_molestar_user_id_idx
  on public.consumer_no_molestar (user_id);

create or replace function public.set_updated_at_no_molestar()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists consumer_no_molestar_set_updated_at
  on public.consumer_no_molestar;

create trigger consumer_no_molestar_set_updated_at
  before update on public.consumer_no_molestar
  for each row execute function public.set_updated_at_no_molestar();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.consumer_alert_config enable row level security;
alter table public.consumer_no_molestar enable row level security;

drop policy if exists "Consumidor lee su propia config de alertas"
  on public.consumer_alert_config;
create policy "Consumidor lee su propia config de alertas"
  on public.consumer_alert_config
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Consumidor inserta su propia config de alertas"
  on public.consumer_alert_config;
create policy "Consumidor inserta su propia config de alertas"
  on public.consumer_alert_config
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Consumidor actualiza su propia config de alertas"
  on public.consumer_alert_config;
create policy "Consumidor actualiza su propia config de alertas"
  on public.consumer_alert_config
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Consumidor elimina su propia config de alertas"
  on public.consumer_alert_config;
create policy "Consumidor elimina su propia config de alertas"
  on public.consumer_alert_config
  for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "Consumidor lee su propio no molestar"
  on public.consumer_no_molestar;
create policy "Consumidor lee su propio no molestar"
  on public.consumer_no_molestar
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Consumidor inserta su propio no molestar"
  on public.consumer_no_molestar;
create policy "Consumidor inserta su propio no molestar"
  on public.consumer_no_molestar
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Consumidor actualiza su propio no molestar"
  on public.consumer_no_molestar;
create policy "Consumidor actualiza su propio no molestar"
  on public.consumer_no_molestar
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Consumidor elimina su propio no molestar"
  on public.consumer_no_molestar;
create policy "Consumidor elimina su propio no molestar"
  on public.consumer_no_molestar
  for delete to authenticated
  using (user_id = auth.uid());
