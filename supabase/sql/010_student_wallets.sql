/*
  FASE 4 — Infraestructura student_wallets (custodial, Solana, NFT futuro)
  =======================================================================
  Objetivo: no guardar secretos en public.alumnos; cifrado en servidor o vault.

  Descomentar y ejecutar cuando defina KMS / pgsodium / Vault en Supabase.

  ---------------------------------------------------------------------------

  CREATE TABLE IF NOT EXISTS public.student_wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    chain text NOT NULL DEFAULT 'solana-devnet',
    public_key text NOT NULL,
    -- Cifrado con clave gestionada fuera de la fila (KMS) o pgsodium:
    encrypted_secret bytea NOT NULL,
    key_id text,
    derivation_info jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (alumno_id, chain)
  );

  CREATE INDEX IF NOT EXISTS student_wallets_alumno_idx ON public.student_wallets (alumno_id);

  ALTER TABLE public.student_wallets ENABLE ROW LEVEL SECURITY;

  -- Mismo aislamiento tenant vía alumno → otec → user_id (tras fase 2)
  CREATE POLICY student_wallets_tenant_all ON public.student_wallets
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.alumnos a
        JOIN public.otec o ON o.id = a.otec_id
        WHERE a.id = student_wallets.alumno_id AND o.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.alumnos a
        JOIN public.otec o ON o.id = a.otec_id
        WHERE a.id = student_wallets.alumno_id AND o.user_id = auth.uid()
      )
    );

  ---------------------------------------------------------------------------
  Frontend: servicio dedicado student-wallets.service.ts (Edge Function recomendada
  para descifrar/firmar; el cliente nunca recibe private key en claro en producción).
*/
