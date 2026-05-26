-- CertiLink — Fase 2: billeteras académicas custodiales (student_wallets) + propiedad de credenciales
-- Ejecutar en Supabase SQL Editor después de public.alumnos y public.certificados.
--
-- Notas:
-- - Mantiene public.alumnos.wallet_address como compatibilidad con el MVP.
-- - El secreto se almacena en encrypted_private_key (cifrado en cliente con VITE_STUDENT_WALLET_ENCRYPTION_KEY;
--   en producción avanzada migrar a Edge Function + KMS).
-- - RLS: deshabilitado para alinear con el acceso actual vía clave anon del MVP; endurecer cuando auth.uid() esté unificado.

create table if not exists public.student_wallets (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos (id) on delete cascade,
  otec_id uuid not null references public.otec (id) on delete cascade,
  wallet_address text not null,
  encrypted_private_key text not null,
  blockchain text not null default 'solana',
  network text not null default 'devnet',
  provider text not null default 'certilink-custodial',
  is_custodial boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_wallets_status_chk check (status in ('active', 'rotated', 'revoked')),
  constraint student_wallets_network_chk check (network in ('devnet', 'mainnet-beta', 'localnet')),
  constraint student_wallets_blockchain_chk check (blockchain in ('solana'))
);

create unique index if not exists student_wallets_one_active_per_alumno_network
  on public.student_wallets (alumno_id, network)
  where status = 'active';

create index if not exists student_wallets_alumno_id_idx on public.student_wallets (alumno_id);
create index if not exists student_wallets_otec_id_idx on public.student_wallets (otec_id);
create index if not exists student_wallets_wallet_address_idx on public.student_wallets (wallet_address);

create or replace function public.student_wallets_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists student_wallets_set_updated_at on public.student_wallets;
create trigger student_wallets_set_updated_at
  before update on public.student_wallets
  for each row
  execute function public.student_wallets_set_updated_at ();

-- Propiedad de credencial: qué fila student_wallets recibió el token al emitir (nullable para certificados legacy)
alter table public.certificados
  add column if not exists owner_student_wallet_id uuid references public.student_wallets (id) on delete set null;

create index if not exists certificados_owner_student_wallet_id_idx
  on public.certificados (owner_student_wallet_id)
  where owner_student_wallet_id is not null;

grant select, insert, update, delete on public.student_wallets to anon, authenticated;
grant select, insert, update, delete on public.student_wallets to service_role;

alter table public.student_wallets disable row level security;
