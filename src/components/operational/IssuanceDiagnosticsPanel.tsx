import { Activity, AlertCircle, CheckCircle2, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOperationalLog } from "@/hooks/useOperationalLog";
import { OPERATIONAL_STATUS_LABELS } from "@/lib/operational";

type IssuanceDiagnosticsPanelProps = {
  mintFailedCount?: number;
  pendingOnChainCount?: number;
  emitidosOnChainCount?: number;
};

const EVENT_LABELS: Record<string, string> = {
  issuance_started: "Emisión iniciada",
  issuance_step: "Paso de emisión",
  issuance_success: "Emisión completada",
  issuance_failed: "Emisión fallida",
  mint_attempt: "Intento blockchain",
  mint_retry: "Reintento blockchain",
  ipfs_upload: "Subida IPFS",
  ipfs_retry: "Reintento IPFS",
  blockchain_event: "Evento blockchain",
  retry_scheduled: "Reintento programado",
  operational_alert: "Alerta operacional",
};

export function IssuanceDiagnosticsPanel({
  mintFailedCount = 0,
  pendingOnChainCount = 0,
  emitidosOnChainCount = 0,
}: IssuanceDiagnosticsPanelProps) {
  const { events, clear } = useOperationalLog(40);

  return (
    <section className="card-enterprise p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Diagnóstico de emisión
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Historial operacional de la sesión · estados: {OPERATIONAL_STATUS_LABELS.pending},{" "}
            {OPERATIONAL_STATUS_LABELS.processing}, {OPERATIONAL_STATUS_LABELS.retrying}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={clear}>
          <Trash2 className="h-3.5 w-3.5" />
          Limpiar historial
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <MetricChip label="En cadena" value={emitidosOnChainCount} tone="success" />
        <MetricChip label="Pendientes on-chain" value={pendingOnChainCount} tone="warning" />
        <MetricChip label="Fallidas (reintento)" value={mintFailedCount} tone="danger" />
      </div>

      {mintFailedCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-900 dark:text-amber-200 flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Hay credenciales con registro blockchain incompleto. Use <strong>Reintentar fallidas</strong> en emisión masiva
            o vuelva a emitir desde Certificados.
          </span>
        </div>
      )}

      <div className="rounded-lg border border-border max-h-64 overflow-y-auto divide-y divide-border">
        {events.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">Sin eventos operacionales en esta sesión.</p>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="px-3 py-2.5 text-xs">
              <div className="flex items-start gap-2">
                <EventIcon severity={ev.severity} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium text-foreground">{EVENT_LABELS[ev.type] ?? ev.type}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {new Date(ev.timestamp).toLocaleTimeString("es-CL")}
                    </span>
                    {ev.attempt != null && ev.maxAttempts != null && (
                      <span className="text-[10px] text-muted-foreground">
                        intento {ev.attempt}/{ev.maxAttempts}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">{ev.message}</p>
                  {ev.technicalDetail && (
                    <p className="text-[10px] text-muted-foreground/80 mt-1 font-mono break-all leading-relaxed">
                      {ev.technicalDetail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function MetricChip({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "danger" }) {
  const tones = {
    success: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    warning: "bg-amber-500/10 text-amber-900 dark:text-amber-200",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <div className={`rounded-lg px-3 py-2 ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function EventIcon({ severity }: { severity: string }) {
  if (severity === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />;
  if (severity === "error") return <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />;
  if (severity === "warning") return <RotateCcw className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />;
  return <Loader2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />;
}
