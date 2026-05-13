-- CertiLink — autenticación institucional contra la tabla `public.otec` (password_hash con pgcrypto).
-- Ejecutar en Supabase → SQL Editor (proyecto de producción).
-- Requisito: columna `otec.password_hash` con bcrypt (crypt + gen_salt), coherente con los registros existentes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.certilink_otec_login(p_email text, p_password text)
RETURNS TABLE (
  id uuid,
  rut text,
  nombre text,
  direccion text,
  telefono text,
  email text,
  wallet_address text,
  estado text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT o.id,
         o.rut,
         o.nombre,
         o.direccion,
         o.telefono,
         o.email,
         o.wallet_address,
         o.estado::text,
         o.created_at,
         o.updated_at
  FROM public.otec o
  CROSS JOIN LATERAL (
    SELECT
      CASE
        WHEN o.password_hash::text LIKE '$2y$%' OR o.password_hash::text LIKE '$2b$%' THEN
          replace(replace(o.password_hash::text, '$2y$', '$2a$'), '$2b$', '$2a$')
        ELSE o.password_hash::text
      END AS bcrypt_salt
  ) norm
  WHERE lower(trim(both from o.email)) = lower(trim(both from p_email))
    AND o.password_hash IS NOT NULL
    -- PHP / otras libs suelen guardar $2y$ o $2b$; pgcrypto compara de forma fiable con prefijo $2a$.
    AND norm.bcrypt_salt = extensions.crypt(trim(both from p_password)::text, norm.bcrypt_salt)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.certilink_otec_register(
  p_nombre text,
  p_email text,
  p_password text,
  p_rut text DEFAULT NULL,
  p_direccion text DEFAULT NULL,
  p_telefono text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  rut text,
  nombre text,
  direccion text,
  telefono text,
  email text,
  wallet_address text,
  estado text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_rut text;
BEGIN
  IF length(trim(both from p_password)) < 6 THEN
    RAISE EXCEPTION 'password_too_short';
  END IF;

  v_rut := coalesce(nullif(trim(both from p_rut), ''), 'PENDIENTE-RUT');

  RETURN QUERY
  INSERT INTO public.otec (
    rut,
    nombre,
    direccion,
    telefono,
    email,
    password_hash,
    estado
  )
  VALUES (
    v_rut,
    trim(both from p_nombre),
    coalesce(nullif(trim(both from p_direccion), ''), ''),
    coalesce(nullif(trim(both from p_telefono), ''), ''),
    lower(trim(both from p_email)),
    extensions.crypt(trim(both from p_password)::text, extensions.gen_salt('bf', 8)),
    'activo'
  )
  RETURNING
    id,
    rut,
    nombre,
    direccion,
    telefono,
    email,
    wallet_address,
    estado,
    created_at,
    updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.certilink_otec_login(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_otec_login(text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.certilink_otec_register(text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_otec_register(text, text, text, text, text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
