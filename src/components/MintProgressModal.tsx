// Progreso de emisión de credencial digital — terminología institucional

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Award,
  Copy,
  Check,
} from "lucide-react";
import type { MintStep } from "@/hooks/useMintCertificate";
import { getStepLabel } from "@/hooks/useMintCertificate";
import type { MintResult } from "@/lib/solana";

interface MintProgressModalProps {
  open: boolean;
  onClose: () => void;
  step: MintStep;
  progress: number;
  result: MintResult | null;
  error: string | null;
  onRetry?: () => void;
}

const STEPS: { key: MintStep; label: string }[] = [
  { key: "creating_record", label: "Registro académico" },
  { key: "generating_diploma", label: "Generando diploma" },
  { key: "uploading_ipfs", label: "Subiendo a IPFS" },
  { key: "registering_metadata", label: "Registrando metadata" },
  { key: "blockchain_emission", label: "Emisión blockchain" },
  { key: "final_confirmation", label: "Confirmación final" },
];

const STEP_ORDER: MintStep[] = [
  "creating_record",
  "generating_diploma",
  "uploading_ipfs",
  "registering_metadata",
  "blockchain_emission",
  "final_confirmation",
  "complete",
];

export function MintProgressModal({
  open,
  onClose,
  step,
  progress,
  result,
  error,
  onRetry,
}: MintProgressModalProps) {
  const [copied, setCopied] = useState(false);

  const currentIdx = STEP_ORDER.indexOf(step);

  const handleCopyCode = () => {
    if (result?.verificationCode) {
      navigator.clipboard.writeText(result.verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && (step === "complete" || step === "error")) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (step !== "complete" && step !== "error") e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Emisión verificada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {step !== "complete" && step !== "error" && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">{getStepLabel(step) || "Iniciando…"}</p>
            </div>
          )}

          {step !== "complete" && step !== "error" && (
            <div className="space-y-2.5">
              {STEPS.map((s, idx) => {
                const stepIdx = STEP_ORDER.indexOf(s.key);
                const isActive = step === s.key;
                const isDone = currentIdx > stepIdx;

                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        isDone
                          ? "bg-accent text-accent-foreground"
                          : isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : isActive ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="text-[10px] font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        isActive
                          ? "text-foreground font-medium"
                          : isDone
                            ? "text-muted-foreground"
                            : "text-muted-foreground/60"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {step === "complete" && result && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center py-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted mb-3">
                  <CheckCircle className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Credencial emitida</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Diploma, documento PDF y registro blockchain quedaron vinculados a esta certificación.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground mb-1.5">Código de verificación</p>
                <div className="flex items-center justify-between">
                  <code className="text-base font-bold font-mono text-foreground">{result.verificationCode}</code>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Registro digital</p>
                <div className="text-[11px] text-muted-foreground space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0">Credencial:</span>
                    <span className="font-mono truncate text-right">{result.mintAddress}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" asChild>
                  <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir transacción en explorador
                  </a>
                </Button>
                {result.explorerMintUrl && (
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" asChild>
                    <a href={result.explorerMintUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver credencial en explorador
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 text-xs"
                  onClick={onClose}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center py-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-3">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No se pudo completar</h3>
                <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-left text-sm text-muted-foreground">
                  {error || "Ocurrió un error en la emisión verificada"}
                </p>
              </div>

              <div className="flex gap-2">
                {onRetry && (
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onRetry}>
                    Reintentar
                  </Button>
                )}
                <Button size="sm" className={`flex-1 text-xs ${onRetry ? "" : "w-full"}`} variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
