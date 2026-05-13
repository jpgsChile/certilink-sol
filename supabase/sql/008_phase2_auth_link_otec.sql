/*
  FASE 2 — Migración hacia Supabase Auth + otec.user_id
  ======================================================
  Objetivo: sesión JWT estándar (auth.users), RLS con auth.uid(), y tabla otec enlazada.

  Orden recomendado (revisar en staging antes de producción):

  1) Añadir columna (bloqueo breve en otec):
     ALTER TABLE public.otec
       ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

  2) Periodo dual (MVP actual + nuevo):
     - Mantener certilink_otec_login RPC para instituciones sin user_id.
     - Tras signUp/signIn con supabase.auth, actualizar otec.user_id para filas coincidentes por email:
       UPDATE public.otec o SET user_id = u.id
       FROM auth.users u
       WHERE lower(o.email) = lower(u.email) AND o.user_id IS NULL;

  3) Nuevos registros:
     - Tras supabase.auth.signUp, insertar/actualizar otec con user_id = auth.uid() (Edge Function o trigger).

  4) Cortar RPC (cuando todo otec activo tenga user_id):
     - Revocar EXECUTE en certilink_otec_login / register para rol anon.
     - Login solo con signInWithPassword + refresh otec por user_id.

  5) Frontend (sin romper arquitectura):
     - auth.service: preferir supabase.auth.getSession(); getOtec por .from('otec').select().eq('user_id', session.user.id).single()
     - sessionStorage solo como fallback durante migración.

  No ejecutar este archivo tal cual: es una guía. Genere migraciones versionadas en su pipeline.
*/
