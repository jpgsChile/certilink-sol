-- CertiLink — perfil institucional vía RPC (SECURITY DEFINER)
-- Motivo: login con certilink_otec_login usa rol anon sin JWT → RLS con auth.uid() no aplica.
-- Patrón alineado con supabase/sql/012_certilink_otec_wallet_rpc.sql
-- PREREQUISITO: supabase/sql/024_institution_profiles.sql

CREATE OR REPLACE FUNCTION public.certilink_institution_profile_get(p_otec_id uuid)
RETURNS SETOF public.institution_profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.institution_profiles ip
  WHERE ip.otec_id = p_otec_id
    AND ip.deleted_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.certilink_institution_profile_get_or_create(p_otec_id uuid)
RETURNS SETOF public.institution_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.institution_profiles%ROWTYPE;
BEGIN
  IF p_otec_id IS NULL THEN
    RAISE EXCEPTION 'invalid_otec_id' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row
  FROM public.institution_profiles ip
  WHERE ip.otec_id = p_otec_id
    AND ip.deleted_at IS NULL
  LIMIT 1;

  IF FOUND THEN
    RETURN NEXT v_row;
    RETURN;
  END IF;

  INSERT INTO public.institution_profiles (
    otec_id,
    institution_name,
    legal_name,
    rut,
    email,
    phone,
    address,
    wallet_address,
    issuer_display_name
  )
  SELECT
    o.id,
    o.nombre,
    o.nombre,
    o.rut,
    o.email,
    o.telefono,
    o.direccion,
    o.wallet_address,
    o.nombre
  FROM public.otec o
  WHERE o.id = p_otec_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'otec_not_found' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.institution_profiles ip
  WHERE ip.otec_id = p_otec_id
    AND ip.deleted_at IS NULL
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.certilink_institution_profile_update(
  p_otec_id uuid,
  p_patch jsonb
)
RETURNS SETOF public.institution_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.institution_profiles%ROWTYPE;
BEGIN
  IF p_otec_id IS NULL OR p_patch IS NULL OR p_patch = '{}'::jsonb THEN
    RAISE EXCEPTION 'invalid_arguments' USING ERRCODE = '22023';
  END IF;

  -- Asegurar fila existente
  PERFORM public.certilink_institution_profile_get_or_create(p_otec_id);

  UPDATE public.institution_profiles ip
  SET
    institution_name = CASE WHEN p_patch ? 'institution_name' THEN nullif(trim(both from p_patch->>'institution_name'), '') ELSE ip.institution_name END,
    legal_name = CASE WHEN p_patch ? 'legal_name' THEN nullif(trim(both from p_patch->>'legal_name'), '') ELSE ip.legal_name END,
    rut = CASE WHEN p_patch ? 'rut' THEN nullif(trim(both from p_patch->>'rut'), '') ELSE ip.rut END,
    description = CASE WHEN p_patch ? 'description' THEN nullif(trim(both from p_patch->>'description'), '') ELSE ip.description END,
    email = CASE WHEN p_patch ? 'email' THEN nullif(trim(both from p_patch->>'email'), '') ELSE ip.email END,
    phone = CASE WHEN p_patch ? 'phone' THEN nullif(trim(both from p_patch->>'phone'), '') ELSE ip.phone END,
    website = CASE WHEN p_patch ? 'website' THEN nullif(trim(both from p_patch->>'website'), '') ELSE ip.website END,
    address = CASE WHEN p_patch ? 'address' THEN nullif(trim(both from p_patch->>'address'), '') ELSE ip.address END,
    logo_url = CASE WHEN p_patch ? 'logo_url' THEN p_patch->>'logo_url' ELSE ip.logo_url END,
    primary_color = CASE WHEN p_patch ? 'primary_color' THEN coalesce(nullif(trim(both from p_patch->>'primary_color'), ''), ip.primary_color) ELSE ip.primary_color END,
    secondary_color = CASE WHEN p_patch ? 'secondary_color' THEN coalesce(nullif(trim(both from p_patch->>'secondary_color'), ''), ip.secondary_color) ELSE ip.secondary_color END,
    certificate_accent_color = CASE WHEN p_patch ? 'certificate_accent_color' THEN coalesce(nullif(trim(both from p_patch->>'certificate_accent_color'), ''), ip.certificate_accent_color) ELSE ip.certificate_accent_color END,
    issuer_display_name = CASE WHEN p_patch ? 'issuer_display_name' THEN nullif(trim(both from p_patch->>'issuer_display_name'), '') ELSE ip.issuer_display_name END,
    signature_name = CASE WHEN p_patch ? 'signature_name' THEN nullif(trim(both from p_patch->>'signature_name'), '') ELSE ip.signature_name END,
    signature_role = CASE WHEN p_patch ? 'signature_role' THEN nullif(trim(both from p_patch->>'signature_role'), '') ELSE ip.signature_role END,
    signature_image_url = CASE WHEN p_patch ? 'signature_image_url' THEN p_patch->>'signature_image_url' ELSE ip.signature_image_url END,
    legal_text = CASE WHEN p_patch ? 'legal_text' THEN nullif(trim(both from p_patch->>'legal_text'), '') ELSE ip.legal_text END,
    show_blockchain_badge = CASE WHEN p_patch ? 'show_blockchain_badge' THEN (p_patch->>'show_blockchain_badge')::boolean ELSE ip.show_blockchain_badge END,
    verification_domain = CASE WHEN p_patch ? 'verification_domain' THEN nullif(trim(both from p_patch->>'verification_domain'), '') ELSE ip.verification_domain END,
    wallet_address = CASE WHEN p_patch ? 'wallet_address' THEN nullif(trim(both from p_patch->>'wallet_address'), '') ELSE ip.wallet_address END,
    updated_at = now()
  WHERE ip.otec_id = p_otec_id
    AND ip.deleted_at IS NULL
  RETURNING * INTO v_row;

  RETURN NEXT v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.certilink_institution_profile_get(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_institution_profile_get(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.certilink_institution_profile_get_or_create(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_institution_profile_get_or_create(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.certilink_institution_profile_update(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_institution_profile_update(uuid, jsonb) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
