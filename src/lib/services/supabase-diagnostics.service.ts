import { supabase } from "@/lib/supabase";

export type TableProbeResult = {
  table: string;
  ok: boolean;
  /** Código PostgREST / Postgres si aplica */
  code?: string;
  message?: string;
  /** Si la lectura devolvió al menos una fila (sin RLS que devuelva vacío silenciosamente). */
  sampleRow: boolean;
};

export type SupabaseConnectionDiagnostics = {
  envOk: boolean;
  /** Latencia aproximada de una petición REST mínima */
  latencyMs: number | null;
  tables: TableProbeResult[];
  /** Lectura acotada al tenant actual (requiere sesión OTEC). */
  tenantScoped?: {
    alumnosForOtec: TableProbeResult;
    cursosForOtec: TableProbeResult;
    certificadosForOtec: TableProbeResult;
  };
};

async function probeTable(table: string, columns: string): Promise<TableProbeResult> {
  const start = performance.now();
  try {
    const { data, error } = await supabase.from(table).select(columns).limit(1);
    const elapsed = performance.now() - start;
    if (error) {
      return {
        table,
        ok: false,
        code: error.code,
        message: error.message,
        sampleRow: false,
      };
    }
    return {
      table,
      ok: true,
      message: elapsed > 2000 ? `Respuesta lenta (~${Math.round(elapsed)} ms)` : undefined,
      sampleRow: Array.isArray(data) && data.length > 0,
    };
  } catch (e) {
    return {
      table,
      ok: false,
      message: e instanceof Error ? e.message : String(e),
      sampleRow: false,
    };
  }
}

/**
 * Fase 1 — comprobaciones de red contra PostgREST (tablas reales del MVP).
 * No modifica datos. Los fallos suelen indicar RLS, clave, URL o caché de esquema.
 */
export async function runSupabaseConnectionDiagnostics(
  otecId?: string | null
): Promise<SupabaseConnectionDiagnostics> {
  const t0 = performance.now();
  let latencyMs: number | null = null;
  try {
    await supabase.auth.getSession();
    latencyMs = Math.round(performance.now() - t0);
  } catch {
    latencyMs = null;
  }

  const tables = await Promise.all([
    probeTable("otec", "id"),
    probeTable("alumnos", "id,otec_id"),
    probeTable("cursos", "id,otec_id"),
    probeTable("certificados", "id,otec_id"),
  ]);

  const envOk = Boolean(import.meta.env.VITE_SUPABASE_URL?.toString().trim()) &&
    Boolean(
      (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY)
        ?.toString()
        .trim()
    );

  let tenantScoped: SupabaseConnectionDiagnostics["tenantScoped"];
  if (otecId) {
    const [alumnosForOtec, cursosForOtec, certificadosForOtec] = await Promise.all([
      probeScoped("alumnos", otecId),
      probeScoped("cursos", otecId),
      probeScoped("certificados", otecId),
    ]);
    tenantScoped = { alumnosForOtec, cursosForOtec, certificadosForOtec };
  }

  return { envOk, latencyMs, tables, tenantScoped };
}

async function probeScoped(
  table: "alumnos" | "cursos" | "certificados",
  otecId: string
): Promise<TableProbeResult> {
  const start = performance.now();
  try {
    const { data, error } = await supabase.from(table).select("id").eq("otec_id", otecId).limit(1);
    if (error) {
      return {
        table: `${table} (otec_id=${otecId.slice(0, 8)}…)`,
        ok: false,
        code: error.code,
        message: error.message,
        sampleRow: false,
      };
    }
    const elapsed = performance.now() - start;
    return {
      table: `${table} (tenant)`,
      ok: true,
      message: elapsed > 2000 ? `~${Math.round(elapsed)} ms` : undefined,
      sampleRow: Array.isArray(data) && data.length > 0,
    };
  } catch (e) {
    return {
      table: `${table} (tenant)`,
      ok: false,
      message: e instanceof Error ? e.message : String(e),
      sampleRow: false,
    };
  }
}
