import type { ElementType } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  CheckCircle2,
  Loader2,
  XCircle,
  SkipForward,
  RotateCcw,
  Clock,
} from "lucide-react";
import { getStepLabel, type MintStep } from "@/hooks/useMintCertificate";
import type { BulkIssuanceJob, BulkIssuanceStats } from "@/lib/bulk-issuance.types";
import { displayRut } from "@/lib/utils/rut";

const STEP_LABELS_BULK: Partial<Record<MintStep, string>> = {
  creating_record: "Registro académico",
  generating_diploma: "Generando diploma",
  uploading_ipfs: "Subiendo a IPFS",
  registering_metadata: "Registrando metadata",
  blockchain_emission: "Registro blockchain",
  retrying: "Reintentando registro blockchain",
  final_confirmation: "Confirmación final",
  complete: "Completado",
};

function bulkStepLabel(step: MintStep): string {
  return STEP_LABELS_BULK[step] ?? getStepLabel(step) ?? "En cola";
}

type BulkIssuanceDashboardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: BulkIssuanceJob[];
  stats: BulkIssuanceStats;
  running: boolean;
  overallProgress: number;
  activeJob: BulkIssuanceJob | null;
  courseLabel?: string;
  onRetryFailed: () => void;
  onClose: () => void;
};

export function BulkIssuanceDashboard({
  open,
  onOpenChange,
  jobs,
  stats,
  running,
  overallProgress,
  activeJob,
  courseLabel,
  onRetryFailed,
  onClose,
}: BulkIssuanceDashboardProps) {
  const finished = !running && jobs.length > 0;
  const hasFailures = stats.failed > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && running) return;
        onOpenChange(o);
      }}
    >
      <DialogContent
        className="sm:max-w-2xl max-h-[92vh] flex flex-col"
        onPointerDownOutside={(e) => {
          if (running) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Emisión masiva de credenciales
          </DialogTitle>
          <DialogDescription>
            {courseLabel ? `${courseLabel} · ` : ""}
            Procesamiento en cola secuencial. Puede autorizar cada registro blockchain en su billetera institucional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 min-h-0 flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <StatChip label="Pendientes" value={stats.pending} icon={Clock} tone="muted" />
            <StatChip label="En proceso" value={stats.processing} icon={Loader2} tone="primary" spin={stats.processing > 0} />
            <StatChip label="Reintentando" value={stats.retrying} icon={RotateCcw} tone="warning" spin={stats.retrying > 0} />
            <StatChip label="Completadas" value={stats.success} icon={CheckCircle2} tone="success" />
            <StatChip label="Fallidas" value={stats.failed} icon={XCircle} tone="danger" />
          </div>

          {stats.skipped > 0 && (
            <p className="text-xs text-muted-foreground">
              {stats.skipped} omitida{stats.skipped !== 1 ? "s" : ""} (credencial ya existente).
            </p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{running ? "Emisión en proceso" : finished ? "Proceso finalizado" : "Listo para iniciar"}</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {activeJob && running && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
              <p className="font-medium text-foreground">{activeJob.studentName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bulkStepLabel(activeJob.step)} · {activeJob.progress}%
              </p>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border divide-y divide-border max-h-[min(40vh,320px)]">
            {jobs.map((job) => (
              <JobRow key={job.jobId} job={job} />
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 shrink-0">
          {finished && hasFailures && (
            <Button type="button" variant="outline" className="gap-2" onClick={onRetryFailed} disabled={running}>
              <RotateCcw className="h-4 w-4" />
              Reintentar fallidas
            </Button>
          )}
          <Button type="button" onClick={onClose} disabled={running} className="sm:min-w-[120px]">
            {running ? "Procesando…" : "Cerrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatChip({
  label,
  value,
  icon: Icon,
  tone,
  spin,
}: {
  label: string;
  value: number;
  icon: ElementType;
  tone: "muted" | "primary" | "success" | "danger" | "warning";
  spin?: boolean;
}) {
  const tones = {
    muted: "bg-muted/60 text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    danger: "bg-destructive/10 text-destructive",
    warning: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  };
  return (
    <div className={`rounded-lg px-3 py-2 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
        <Icon className={`h-3 w-3 ${spin ? "animate-spin" : ""}`} />
        {label}
      </div>
      <p className="text-lg font-bold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function JobRow({ job }: { job: BulkIssuanceJob }) {
  const statusConfig = {
    pending: { icon: Clock, label: "Pendiente", className: "text-muted-foreground" },
    processing: { icon: Loader2, label: bulkStepLabel(job.step), className: "text-primary" },
    retrying: { icon: RotateCcw, label: bulkStepLabel(job.step), className: "text-amber-700 dark:text-amber-300" },
    success: { icon: CheckCircle2, label: "Registro blockchain completado", className: "text-emerald-600" },
    failed: { icon: XCircle, label: job.error ?? "Fallida", className: "text-destructive" },
    skipped: { icon: SkipForward, label: job.skipReason ?? "Omitida", className: "text-amber-600" },
  }[job.status];

  const Icon = statusConfig.icon;

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 text-sm">
      <Icon
        className={`h-4 w-4 shrink-0 mt-0.5 ${statusConfig.className} ${job.status === "processing" || job.status === "retrying" ? "animate-spin" : ""}`}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground truncate">{job.studentName}</p>
        <p className="text-xs text-muted-foreground">{displayRut(job.studentRut)}</p>
        <p className={`text-xs mt-1 line-clamp-2 ${statusConfig.className}`}>{statusConfig.label}</p>
        {job.status === "success" && job.result?.verificationCode && (
          <p className="text-[11px] font-mono text-muted-foreground mt-1">{job.result.verificationCode}</p>
        )}
      </div>
      {job.status === "processing" || job.status === "retrying" ? (
        <span className="text-xs tabular-nums text-muted-foreground shrink-0">{job.progress}%</span>
      ) : null}
    </div>
  );
}
