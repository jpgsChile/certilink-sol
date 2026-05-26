-- CertiLink — columnas de registro digital / blockchain en certificados
-- Ejecutar en Supabase SQL Editor después de public.certificados.
-- Orden sugerido: 016 → 017 → 018 → 019

alter table public.certificados
  add column if not exists ipfs_metadata_url text,
  add column if not exists ipfs_image_url text,
  add column if not exists ipfs_pdf_url text,
  add column if not exists nft_status text,
  add column if not exists nft_issued_at timestamptz,
  add column if not exists last_blockchain_error text,
  add column if not exists blockchain_retry_count integer not null default 0,
  add column if not exists mint_attempted_at timestamptz,
  add column if not exists token_id text,
  add column if not exists metadata jsonb,
  add column if not exists contract_address text,
  add column if not exists chain_id integer,
  add column if not exists revoked_at timestamptz,
  add column if not exists revocation_reason text,
  add column if not exists revoked_tx_hash text,
  add column if not exists registry_tx_hash text,
  add column if not exists registry_contract_address text,
  add column if not exists registry_chain_id integer;

comment on column public.certificados.nft_status is
  'Estado del ciclo on-chain: pending_onchain, retrying, minted, mint_failed, etc.';

create index if not exists certificados_nft_status_idx
  on public.certificados (otec_id, nft_status)
  where nft_status is not null;

notify pgrst, 'reload schema';
