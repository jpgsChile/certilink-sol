-- CertiLink — ampliar columnas blockchain (Solana base58)
-- Error típico: value too long for type character varying(42) al guardar tx_hash.
-- Firmas Solana ~88 caracteres; mint/program id ~44. Ejecutar en Supabase SQL Editor.

alter table public.certificados
  alter column tx_hash type character varying(128);

alter table public.certificados
  alter column token_id type character varying(128);

alter table public.certificados
  alter column contract_address type character varying(128);

alter table public.certificados
  alter column revoked_tx_hash type character varying(128);

alter table public.certificados
  alter column registry_tx_hash type character varying(128);

-- URLs IPFS/Pinata (si quedaron en varchar corto)
alter table public.certificados
  alter column ipfs_metadata_url type text;

alter table public.certificados
  alter column ipfs_image_url type text;

alter table public.certificados
  alter column ipfs_pdf_url type text;

notify pgrst, 'reload schema';
