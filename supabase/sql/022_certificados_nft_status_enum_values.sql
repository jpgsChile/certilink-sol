-- Valores adicionales para enum legacy certificado_nft_status (si 020 no convirtió a text).
-- Ejecutar solo si persistMintComprobante sigue fallando por enum tras mint en Solana.

do $$
declare
  lbl text;
begin
  if not exists (select 1 from pg_type where typname = 'certificado_nft_status') then
    return;
  end if;
  foreach lbl in array array['pending_onchain', 'retrying', 'minted', 'mint_failed'] loop
    if not exists (
      select 1 from pg_enum e
      join pg_type t on e.enumtypid = t.oid
      where t.typname = 'certificado_nft_status' and e.enumlabel = lbl
    ) then
      execute format('alter type public.certificado_nft_status add value %L', lbl);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
