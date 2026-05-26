-- CertiLink — nft_status: enum legacy (certificado_nft_status) → text
-- La app usa valores como pending_onchain, retrying, minted, mint_failed.
-- Ejecutar en Supabase SQL Editor si aparece:
--   invalid input value for enum certificado_nft_status: "pending_onchain"

do $$
begin
  if exists (
    select 1
    from pg_attribute a
    join pg_class c on a.attrelid = c.oid
    join pg_namespace n on c.relnamespace = n.oid
    join pg_type t on a.atttypid = t.oid
    where n.nspname = 'public'
      and c.relname = 'certificados'
      and a.attname = 'nft_status'
      and not a.attisdropped
      and t.typname = 'certificado_nft_status'
  ) then
    alter table public.certificados alter column nft_status drop default;
    alter table public.certificados
      alter column nft_status type text using nft_status::text;
  end if;
end $$;

comment on column public.certificados.nft_status is
  'Estado on-chain: pending_onchain, retrying, minted, mint_failed (texto libre; legacy enum convertido).';

notify pgrst, 'reload schema';
