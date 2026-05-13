-- CertiLink — actualizar / leer billetera institucional cuando RLS bloquea UPDATE/SELECT con rol anon.
-- Ejecutar en Supabase → SQL Editor tras 006.
-- NOTA MVP: actualizar solo por `p_otec_id` (conocer UUID es requisito). Endurecer con auth.uid() + otec.user_id en fase Auth.

CREATE OR REPLACE FUNCTION public.certilink_otec_update_wallet(
  p_otec_id uuid,
  p_wallet_address text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_otec_id IS NULL OR trim(both from p_wallet_address) = '' THEN
    RAISE EXCEPTION 'invalid_arguments' USING ERRCODE = '22023';
  END IF;

  UPDATE public.otec
  SET
    wallet_address = trim(both from p_wallet_address),
    updated_at = now()
  WHERE id = p_otec_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'otec_not_found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.certilink_otec_get_wallet(p_otec_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.wallet_address::text
  FROM public.otec o
  WHERE o.id = p_otec_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.certilink_otec_update_wallet(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_otec_update_wallet(uuid, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.certilink_otec_get_wallet(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_otec_get_wallet(uuid) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
