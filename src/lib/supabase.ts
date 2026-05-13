/**
 * Cliente Supabase único del proyecto (instancia en `@/utils/supabase`).
 * Importar siempre desde aquí o desde `@/lib/supabase` en servicios/hooks.
 */
export {
  supabase,
  getSupabaseEnvDiagnostics,
  isSupabaseDiagnosticsEnabled,
} from "@/utils/supabase";
export type { SupabaseEnvDiagnostics } from "@/utils/supabase";
