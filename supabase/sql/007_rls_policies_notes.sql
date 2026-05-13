/*
  CertiLink — notas RLS y fases de endurecimiento
  ================================================

  Fase 1 (operativa): validar conexión y lecturas con la página /diagnostico (dev o
  VITE_ENABLE_SUPABASE_DIAGNOSTICS=true) y el servicio supabase-diagnostics.service.ts.

  Fase 2: guía de migración Auth + otec.user_id → supabase/sql/008_phase2_auth_link_otec.sql

  Fase 3: políticas multi-tenant (ejemplo, no permisivas) → supabase/sql/009_rls_tenant_isolation.sql
           Ejecutar solo con JWT de Supabase Auth y columna user_id en otec.

  Fase 4: tabla student_wallets y RLS → supabase/sql/010_student_wallets.sql

  Billetera institucional (UPDATE con anon / RLS): RPC → supabase/sql/012_certilink_otec_wallet_rpc.sql

  Fase 5: checklist TypeScript sin I/O → src/lib/certificado-blockchain-readiness.ts

  Tras crear o modificar tablas o funciones en el Dashboard SQL:
    NOTIFY pgrst, 'reload schema';
  o Settings → API → Reload schema.
*/
