import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseEnvDiagnostics } from "@/lib/supabase";
import {
  runSupabaseConnectionDiagnostics,
  type SupabaseConnectionDiagnostics,
  type TableProbeResult,
} from "@/lib/services/supabase-diagnostics.service";

function Row({ r }: { r: TableProbeResult }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
      <span className="font-mono text-xs text-muted-foreground">{r.table}</span>
      <div className="flex flex-col items-end gap-0.5 text-right">
        <span className="flex items-center gap-1 font-medium">
          {r.ok ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              OK
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-destructive" />
              Error
            </>
          )}
        </span>
        {r.code && <span className="text-[11px] text-muted-foreground">Código: {r.code}</span>}
        {r.message && <span className="max-w-md text-[11px] text-destructive">{r.message}</span>}
        <span className="text-[11px] text-muted-foreground">
          Muestra de fila: {r.sampleRow ? "sí" : "no (RLS o tabla vacía)"}
        </span>
      </div>
    </div>
  );
}

export default function Diagnostics() {
  const { otec, user } = useAuth();
  const [env] = useState(() => getSupabaseEnvDiagnostics());
  const [conn, setConn] = useState<SupabaseConnectionDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const result = await runSupabaseConnectionDiagnostics(otec?.id ?? null);
      setConn(result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al ejecutar diagnósticos");
    } finally {
      setLoading(false);
    }
  }, [otec?.id]);

  useEffect(() => {
    void run();
  }, [run]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Diagnóstico Supabase"
        description="Validación de conexión, variables y lectura de tablas (no modifica datos)."
      />

      <div className="mb-4 flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void run()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Re-ejecutar</span>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-enterprise p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldAlert className="h-4 w-4 text-warning" />
            Variables de entorno
          </h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>URL configurada: {env.hasUrl ? "sí" : "no"}</li>
            <li>Host: {env.urlHost ?? "—"}</li>
            <li>Clave: {env.hasPublishableOrAnonKey ? "sí" : "no"} ({env.keyKind})</li>
            <li>Sufijo clave (referencia): {env.keySuffix ?? "—"}</li>
          </ul>
          {env.warnings.length > 0 && (
            <ul className="mt-3 list-inside list-disc text-xs text-destructive">
              {env.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-enterprise p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Sesión OTEC (AuthProvider)</h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>Usuario (contexto): {user?.email ?? "—"}</li>
            <li>OTEC id: {otec?.id ?? "—"}</li>
            <li>Institución: {otec?.nombre ?? "—"}</li>
          </ul>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      {conn && (
        <div className="mt-6 space-y-6">
          <div className="card-enterprise p-5">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Conexión PostgREST</h3>
            <p className="text-xs text-muted-foreground">
              Latencia aproximada (primer head): {conn.latencyMs != null ? `${conn.latencyMs} ms` : "—"}
            </p>
            <div className="mt-3">
              {conn.tables.map((r) => (
                <Row key={r.table} r={r} />
              ))}
            </div>
          </div>

          {conn.tenantScoped && (
            <div className="card-enterprise p-5">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Lecturas con aislamiento por otec_id</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Usa el <code className="rounded bg-secondary px-1">otec_id</code> de la sesión actual. Fallos aquí
                suelen ser RLS o datos vacíos para esa institución.
              </p>
              <Row r={conn.tenantScoped.alumnosForOtec} />
              <Row r={conn.tenantScoped.cursosForOtec} />
              <Row r={conn.tenantScoped.certificadosForOtec} />
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
