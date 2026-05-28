-- CertiLink — líneas académicas vía RPC (SECURITY DEFINER)
-- Motivo: login con certilink_otec_login usa rol anon sin JWT → RLS con auth.uid() bloquea INSERT/UPDATE/DELETE.
-- Patrón alineado con supabase/sql/015_curso_alumnos_rpc.sql
-- PREREQUISITO: supabase/sql/016_lineas_academicas.sql

CREATE OR REPLACE FUNCTION public.certilink_lineas_academicas_list(p_otec_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', la.id,
        'otec_id', la.otec_id,
        'nombre', la.nombre,
        'descripcion', la.descripcion,
        'sitio_web', la.sitio_web,
        'banner_url', la.banner_url,
        'created_at', la.created_at,
        'updated_at', la.updated_at
      )
      ORDER BY la.nombre ASC
    ),
    '[]'::jsonb
  )
  FROM public.lineas_academicas la
  WHERE la.otec_id = p_otec_id;
$$;

CREATE OR REPLACE FUNCTION public.certilink_lineas_academicas_create(
  p_otec_id uuid,
  p_nombre text,
  p_descripcion text DEFAULT NULL,
  p_sitio_web text DEFAULT NULL,
  p_banner_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.lineas_academicas%ROWTYPE;
BEGIN
  IF p_otec_id IS NULL OR trim(both from coalesce(p_nombre, '')) = '' THEN
    RAISE EXCEPTION 'invalid_arguments' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.otec o WHERE o.id = p_otec_id) THEN
    RAISE EXCEPTION 'otec_not_found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.lineas_academicas (
    otec_id,
    nombre,
    descripcion,
    sitio_web,
    banner_url
  )
  VALUES (
    p_otec_id,
    trim(both from p_nombre),
    nullif(trim(both from coalesce(p_descripcion, '')), ''),
    nullif(trim(both from coalesce(p_sitio_web, '')), ''),
    nullif(trim(both from coalesce(p_banner_url, '')), '')
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'otec_id', v_row.otec_id,
    'nombre', v_row.nombre,
    'descripcion', v_row.descripcion,
    'sitio_web', v_row.sitio_web,
    'banner_url', v_row.banner_url,
    'created_at', v_row.created_at,
    'updated_at', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.certilink_lineas_academicas_update(
  p_otec_id uuid,
  p_linea_id uuid,
  p_patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.lineas_academicas%ROWTYPE;
BEGIN
  IF p_otec_id IS NULL OR p_linea_id IS NULL OR p_patch IS NULL OR p_patch = '{}'::jsonb THEN
    RAISE EXCEPTION 'invalid_arguments' USING ERRCODE = '22023';
  END IF;

  UPDATE public.lineas_academicas la
  SET
    nombre = CASE
      WHEN p_patch ? 'nombre' THEN trim(both from p_patch->>'nombre')
      ELSE la.nombre
    END,
    descripcion = CASE
      WHEN p_patch ? 'descripcion' THEN nullif(trim(both from p_patch->>'descripcion'), '')
      ELSE la.descripcion
    END,
    sitio_web = CASE
      WHEN p_patch ? 'sitio_web' THEN nullif(trim(both from p_patch->>'sitio_web'), '')
      ELSE la.sitio_web
    END,
    banner_url = CASE
      WHEN p_patch ? 'banner_url' THEN nullif(trim(both from p_patch->>'banner_url'), '')
      ELSE la.banner_url
    END,
    updated_at = now()
  WHERE la.id = p_linea_id
    AND la.otec_id = p_otec_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'linea_not_found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'otec_id', v_row.otec_id,
    'nombre', v_row.nombre,
    'descripcion', v_row.descripcion,
    'sitio_web', v_row.sitio_web,
    'banner_url', v_row.banner_url,
    'created_at', v_row.created_at,
    'updated_at', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.certilink_lineas_academicas_delete(
  p_otec_id uuid,
  p_linea_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_otec_id IS NULL OR p_linea_id IS NULL THEN
    RAISE EXCEPTION 'invalid_arguments' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.lineas_academicas la
  WHERE la.id = p_linea_id
    AND la.otec_id = p_otec_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'linea_not_found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.certilink_lineas_academicas_list(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_lineas_academicas_list(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.certilink_lineas_academicas_create(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_lineas_academicas_create(uuid, text, text, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.certilink_lineas_academicas_update(uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_lineas_academicas_update(uuid, uuid, jsonb) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.certilink_lineas_academicas_delete(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_lineas_academicas_delete(uuid, uuid) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
