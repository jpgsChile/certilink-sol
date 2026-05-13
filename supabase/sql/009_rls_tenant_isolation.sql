/*
  FASE 3 — RLS multi-tenant (sin políticas permisivas "allow all")
  =================================================================
  PREREQUISITOS (obligatorios antes de descomentar y ejecutar):
    - public.otec.user_id uuid UNIQUE REFERENCES auth.users(id)
    - Login vía Supabase Auth (JWT con auth.uid() disponible en requests)
    - Sin user_id + sin JWT, estas políticas bloquean el acceso (comportamiento correcto).

  Verificación pública de certificados: NO usar SELECT anon amplio sobre certificados.
  Patrón recomendado: RPC SECURITY DEFINER acotada (solo filas necesarias) o Edge Function.

  ---------------------------------------------------------------------------
  Ejemplo de políticas (ajustar nombres de FK si difieren en su proyecto):
  ---------------------------------------------------------------------------

  ALTER TABLE public.otec ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;

  -- OTEC: cada usuario institucional ve/edita solo su fila
  CREATE POLICY otec_self_select ON public.otec
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

  CREATE POLICY otec_self_update ON public.otec
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

  -- ALUMNOS: aislamiento por otec_id perteneciente al usuario
  CREATE POLICY alumnos_tenant_all ON public.alumnos
    FOR ALL TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.otec o WHERE o.id = alumnos.otec_id AND o.user_id = auth.uid())
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.otec o WHERE o.id = alumnos.otec_id AND o.user_id = auth.uid())
    );

  -- CURSOS: mismo patrón
  CREATE POLICY cursos_tenant_all ON public.cursos
    FOR ALL TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.otec o WHERE o.id = cursos.otec_id AND o.user_id = auth.uid())
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.otec o WHERE o.id = cursos.otec_id AND o.user_id = auth.uid())
    );

  -- CERTIFICADOS: mismo patrón
  CREATE POLICY certificados_tenant_all ON public.certificados
    FOR ALL TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.otec o WHERE o.id = certificados.otec_id AND o.user_id = auth.uid())
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.otec o WHERE o.id = certificados.otec_id AND o.user_id = auth.uid())
    );

  Revocar permisos directos de anon/authenticated si aplica su modelo endurecido.

  NOTA: student_wallets (fase 4) debe seguir el mismo patrón vía alumno_id → otec.
*/
