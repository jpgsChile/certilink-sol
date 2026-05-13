-- CertiLink — inscripciones curso–alumno vía RPC (SECURITY DEFINER)
-- Motivo: login institucional con `certilink_otec_login` usa rol anon sin JWT → RLS con auth.uid() no aplica.
-- Patrón alineado con supabase/sql/012_certilink_otec_wallet_rpc.sql (conocer p_otec_id es el requisito MVP).
-- Prerrequisito: tabla public.curso_alumnos (014_curso_alumnos.sql).

CREATE OR REPLACE FUNCTION public.certilink_curso_alumnos_list(
  p_otec_id uuid,
  p_curso_id uuid,
  p_solo_aprobados boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', ca.id,
        'curso_id', ca.curso_id,
        'alumno_id', ca.alumno_id,
        'otec_id', ca.otec_id,
        'estado', ca.estado,
        'nota', ca.nota,
        'asistencia', ca.asistencia,
        'aprobado', ca.aprobado,
        'fecha_inscripcion', ca.fecha_inscripcion,
        'created_at', ca.created_at,
        'updated_at', ca.updated_at,
        'alumnos', jsonb_build_object(
          'id', a.id,
          'nombre', a.nombre,
          'apellido', a.apellido,
          'rut', a.rut,
          'email', a.email
        )
      )
      ORDER BY ca.fecha_inscripcion DESC NULLS LAST, ca.created_at DESC NULLS LAST
    ),
    '[]'::jsonb
  )
  FROM public.curso_alumnos ca
  INNER JOIN public.alumnos a
    ON a.id = ca.alumno_id AND a.otec_id = p_otec_id
  WHERE ca.otec_id = p_otec_id
    AND ca.curso_id = p_curso_id
    AND EXISTS (SELECT 1 FROM public.cursos c WHERE c.id = p_curso_id AND c.otec_id = p_otec_id)
    AND (NOT p_solo_aprobados OR ca.aprobado = true);
$$;

CREATE OR REPLACE FUNCTION public.certilink_curso_alumnos_enroll(
  p_otec_id uuid,
  p_curso_id uuid,
  p_alumno_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_otec_id IS NULL OR p_curso_id IS NULL OR p_alumno_id IS NULL THEN
    RAISE EXCEPTION 'invalid_arguments' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cursos c WHERE c.id = p_curso_id AND c.otec_id = p_otec_id) THEN
    RAISE EXCEPTION 'curso_no_autorizado' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.alumnos a WHERE a.id = p_alumno_id AND a.otec_id = p_otec_id) THEN
    RAISE EXCEPTION 'alumno_no_autorizado' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.curso_alumnos (
    curso_id,
    alumno_id,
    otec_id,
    estado,
    nota,
    asistencia,
    aprobado,
    fecha_inscripcion
  )
  VALUES (
    p_curso_id,
    p_alumno_id,
    p_otec_id,
    'inscrito',
    NULL,
    NULL,
    false,
    (timezone('utc', now()))::date
  )
  RETURNING id INTO v_id;

  RETURN (
    SELECT jsonb_build_object(
      'id', ca.id,
      'curso_id', ca.curso_id,
      'alumno_id', ca.alumno_id,
      'otec_id', ca.otec_id,
      'estado', ca.estado,
      'nota', ca.nota,
      'asistencia', ca.asistencia,
      'aprobado', ca.aprobado,
      'fecha_inscripcion', ca.fecha_inscripcion,
      'created_at', ca.created_at,
      'updated_at', ca.updated_at,
      'alumnos', jsonb_build_object(
        'id', a.id,
        'nombre', a.nombre,
        'apellido', a.apellido,
        'rut', a.rut,
        'email', a.email
      )
    )
    FROM public.curso_alumnos ca
    INNER JOIN public.alumnos a ON a.id = ca.alumno_id AND a.otec_id = p_otec_id
    WHERE ca.id = v_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.certilink_curso_alumnos_update(
  p_otec_id uuid,
  p_id uuid,
  p_patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok uuid;
BEGIN
  IF p_otec_id IS NULL OR p_id IS NULL OR p_patch IS NULL THEN
    RAISE EXCEPTION 'invalid_arguments' USING ERRCODE = '22023';
  END IF;

  UPDATE public.curso_alumnos ca
  SET
    estado = CASE WHEN p_patch ? 'estado' THEN (p_patch->>'estado')::text ELSE ca.estado END,
    nota = CASE WHEN p_patch ? 'nota' AND p_patch->'nota' = 'null'::jsonb THEN NULL
               WHEN p_patch ? 'nota' THEN (p_patch->>'nota')::numeric ELSE ca.nota END,
    asistencia = CASE WHEN p_patch ? 'asistencia' AND p_patch->'asistencia' = 'null'::jsonb THEN NULL
                      WHEN p_patch ? 'asistencia' THEN (p_patch->>'asistencia')::numeric ELSE ca.asistencia END,
    aprobado = CASE WHEN p_patch ? 'aprobado' THEN (p_patch->>'aprobado')::boolean ELSE ca.aprobado END,
    fecha_inscripcion = CASE
      WHEN p_patch ? 'fecha_inscripcion' AND p_patch->>'fecha_inscripcion' IS NOT NULL
      THEN (p_patch->>'fecha_inscripcion')::date
      ELSE ca.fecha_inscripcion
    END
  WHERE ca.id = p_id AND ca.otec_id = p_otec_id
  RETURNING ca.id INTO v_ok;

  IF v_ok IS NULL THEN
    RAISE EXCEPTION 'inscripcion_no_encontrada' USING ERRCODE = 'P0002';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'id', ca.id,
      'curso_id', ca.curso_id,
      'alumno_id', ca.alumno_id,
      'otec_id', ca.otec_id,
      'estado', ca.estado,
      'nota', ca.nota,
      'asistencia', ca.asistencia,
      'aprobado', ca.aprobado,
      'fecha_inscripcion', ca.fecha_inscripcion,
      'created_at', ca.created_at,
      'updated_at', ca.updated_at,
      'alumnos', jsonb_build_object(
        'id', a.id,
        'nombre', a.nombre,
        'apellido', a.apellido,
        'rut', a.rut,
        'email', a.email
      )
    )
    FROM public.curso_alumnos ca
    INNER JOIN public.alumnos a ON a.id = ca.alumno_id AND a.otec_id = p_otec_id
    WHERE ca.id = p_id AND ca.otec_id = p_otec_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.certilink_curso_alumnos_delete(p_otec_id uuid, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok uuid;
BEGIN
  IF p_otec_id IS NULL OR p_id IS NULL THEN
    RAISE EXCEPTION 'invalid_arguments' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.curso_alumnos ca
  WHERE ca.id = p_id AND ca.otec_id = p_otec_id
  RETURNING ca.id INTO v_ok;

  IF v_ok IS NULL THEN
    RAISE EXCEPTION 'inscripcion_no_encontrada' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.certilink_curso_alumnos_get_aprobado(
  p_otec_id uuid,
  p_curso_id uuid,
  p_alumno_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', ca.id,
    'curso_id', ca.curso_id,
    'alumno_id', ca.alumno_id,
    'otec_id', ca.otec_id,
    'estado', ca.estado,
    'nota', ca.nota,
    'asistencia', ca.asistencia,
    'aprobado', ca.aprobado,
    'fecha_inscripcion', ca.fecha_inscripcion,
    'created_at', ca.created_at,
    'updated_at', ca.updated_at
  )
  FROM public.curso_alumnos ca
  WHERE ca.otec_id = p_otec_id
    AND ca.curso_id = p_curso_id
    AND ca.alumno_id = p_alumno_id
    AND ca.aprobado = true
    AND EXISTS (SELECT 1 FROM public.cursos c WHERE c.id = p_curso_id AND c.otec_id = p_otec_id)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.certilink_curso_alumnos_list(uuid, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_curso_alumnos_list(uuid, uuid, boolean) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.certilink_curso_alumnos_enroll(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_curso_alumnos_enroll(uuid, uuid, uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.certilink_curso_alumnos_update(uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_curso_alumnos_update(uuid, uuid, jsonb) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.certilink_curso_alumnos_delete(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_curso_alumnos_delete(uuid, uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.certilink_curso_alumnos_get_aprobado(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certilink_curso_alumnos_get_aprobado(uuid, uuid, uuid) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
