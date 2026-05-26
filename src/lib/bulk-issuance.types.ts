import type { MintStep, IssueCertificateParams } from "@/hooks/useMintCertificate";
import type { MintResult } from "@/lib/solana";

/** Estado de un trabajo en la cola de emisión masiva (preparado para jobs en background). */
export type BulkIssuanceJobStatus = "pending" | "processing" | "success" | "failed" | "retrying" | "skipped";

export interface BulkIssuanceJob {
  jobId: string;
  alumnoId: string;
  studentName: string;
  studentRut: string;
  status: BulkIssuanceJobStatus;
  step: MintStep;
  progress: number;
  error: string | null;
  result: MintResult | null;
  params: IssueCertificateParams;
  /** Certificado creado o reutilizado (retry). */
  certificadoId?: string | null;
  skipReason?: string | null;
}

export interface BulkIssuanceStats {
  total: number;
  pending: number;
  processing: number;
  retrying: number;
  success: number;
  failed: number;
  skipped: number;
}

export function computeBulkStats(jobs: BulkIssuanceJob[]): BulkIssuanceStats {
  return {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    processing: jobs.filter((j) => j.status === "processing").length,
    retrying: jobs.filter((j) => j.status === "retrying").length,
    success: jobs.filter((j) => j.status === "success").length,
    failed: jobs.filter((j) => j.status === "failed").length,
    skipped: jobs.filter((j) => j.status === "skipped").length,
  };
}
