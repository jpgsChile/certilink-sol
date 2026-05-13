-- CertiLink — Solana base58 ~43–44 caracteres; varchar(42) provoca error 22001 al guardar.
-- Ejecutar en Supabase → SQL Editor (producción / staging).

ALTER TABLE public.otec
  ALTER COLUMN wallet_address TYPE character varying(128);

-- Opcional: alinear student_wallets.wallet_address si también está en 42
-- ALTER TABLE public.student_wallets
--   ALTER COLUMN wallet_address TYPE character varying(128);

NOTIFY pgrst, 'reload schema';
