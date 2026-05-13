-- ⚠️ DEPRECADO: el producto usa la tabla singular `public.otec` del esquema de producción.
-- No ejecutar en proyectos alineados con el esquema real (ver supabase/sql/006_*.sql).
--
-- CertiLink — tabla esperada por la app (public.otecs)
-- La tabla "otec" del editor es otra: este proyecto usa Supabase Auth + fila en otecs por usuario.
-- Ejecuta todo el bloque en: Supabase Dashboard → SQL Editor → New query → Run.

create table if not exists public.otecs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  wallet_address text,
  created_at timestamptz not null default now(),
  constraint otecs_user_id_key unique (user_id)
);

create index if not exists otecs_user_id_idx on public.otecs (user_id);

alter table public.otecs enable row level security;

drop policy if exists "otecs_select_own" on public.otecs;
drop policy if exists "otecs_insert_own" on public.otecs;
drop policy if exists "otecs_update_own" on public.otecs;

create policy "otecs_select_own"
  on public.otecs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "otecs_insert_own"
  on public.otecs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "otecs_update_own"
  on public.otecs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Refrescar caché de esquema de PostgREST (si falla el permiso, en Dashboard: Settings → API → Reload schema)
NOTIFY pgrst, 'reload schema';
