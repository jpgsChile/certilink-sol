import { useCallback, useRef, useState } from "react";
import type { IssueCertificateOptions, IssueCertificateParams, MintStep } from "@/hooks/useMintCertificate";
import type { IssueCertificateOutcome } from "@/hooks/useMintCertificate";
import {
  type BulkIssuanceJob,
  type BulkIssuanceJobStatus,
  computeBulkStats,
} from "@/lib/bulk-issuance.types";

type IssueFn = (
  params: IssueCertificateParams,
  options?: IssueCertificateOptions
) => Promise<IssueCertificateOutcome>;

function newJobId(): string {
  return `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createBulkJob(input: {
  alumnoId: string;
  studentName: string;
  studentRut: string;
  params: IssueCertificateParams;
  certificadoId?: string | null;
  skipReason?: string | null;
  status?: BulkIssuanceJobStatus;
}): BulkIssuanceJob {
  return {
    jobId: newJobId(),
    alumnoId: input.alumnoId,
    studentName: input.studentName,
    studentRut: input.studentRut,
    params: input.params,
    certificadoId: input.certificadoId ?? null,
    skipReason: input.skipReason ?? null,
    status: input.status ?? "pending",
    step: "idle",
    progress: 0,
    error: null,
    result: null,
  };
}

export function useBulkIssuanceQueue(issueCertificate: IssueFn) {
  const [jobs, setJobs] = useState<BulkIssuanceJob[]>([]);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);
  const runningRef = useRef(false);

  const updateJob = useCallback((jobId: string, patch: Partial<BulkIssuanceJob>) => {
    setJobs((prev) => prev.map((j) => (j.jobId === jobId ? { ...j, ...patch } : j)));
  }, []);

  const enqueue = useCallback((items: BulkIssuanceJob[]) => {
    cancelRef.current = false;
    setJobs(items);
    return items;
  }, []);

  const processQueue = useCallback(
    async (initialJobs: BulkIssuanceJob[]) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setRunning(true);
      cancelRef.current = false;

      let queue = [...initialJobs];

      for (let i = 0; i < queue.length; i += 1) {
        if (cancelRef.current) break;

        const job = queue[i];
        if (job.status === "skipped" || job.status === "success") continue;

        updateJob(job.jobId, { status: "processing", step: "creating_record", progress: 0, error: null });

        const outcome = await issueCertificate(job.params, {
          suppressUiState: true,
          existingCertificadoId: job.certificadoId ?? undefined,
          onProgress: (step: MintStep, progress: number) => {
            const status: BulkIssuanceJobStatus =
              step === "retrying" ? "retrying" : step === "complete" ? "success" : "processing";
            updateJob(job.jobId, { step, progress, status: status === "success" ? "processing" : status });
          },
        });

        if (outcome.skippedDuplicate) {
          updateJob(job.jobId, {
            status: "skipped",
            skipReason: outcome.error ?? "Credencial ya emitida",
            certificadoId: outcome.certificadoId ?? job.certificadoId,
            step: "complete",
            progress: 100,
          });
          continue;
        }

        if (outcome.result) {
          updateJob(job.jobId, {
            status: "success",
            result: outcome.result,
            certificadoId: outcome.certificadoId ?? job.certificadoId,
            step: "complete",
            progress: 100,
            error: null,
          });
        } else {
          updateJob(job.jobId, {
            status: "failed",
            error: outcome.error ?? "Error desconocido",
            certificadoId: outcome.certificadoId ?? job.certificadoId,
            step: "error",
            progress: 0,
          });
        }

        queue = queue.map((j) => {
          if (j.jobId !== job.jobId) return j;
          if (outcome.skippedDuplicate) {
            return {
              ...j,
              status: "skipped" as const,
              skipReason: outcome.error ?? "Credencial ya emitida",
              certificadoId: outcome.certificadoId ?? j.certificadoId,
            };
          }
          if (outcome.result) {
            return { ...j, status: "success" as const, result: outcome.result, certificadoId: outcome.certificadoId };
          }
          return {
            ...j,
            status: "failed" as const,
            error: outcome.error,
            certificadoId: outcome.certificadoId ?? j.certificadoId,
          };
        });
      }

      runningRef.current = false;
      setRunning(false);
    },
    [issueCertificate, updateJob]
  );

  const enqueueAndStart = useCallback(
    async (items: BulkIssuanceJob[]) => {
      cancelRef.current = false;
      setJobs(items);
      await processQueue(items);
    },
    [processQueue]
  );

  const start = useCallback(async () => {
    if (jobs.length === 0 || runningRef.current) return;
    await processQueue(jobs);
  }, [jobs, processQueue]);

  const retryFailed = useCallback(async () => {
    if (runningRef.current) return;
    const retried = jobs.map((j) =>
      j.status === "failed"
        ? {
            ...j,
            status: "pending" as const,
            step: "idle" as MintStep,
            progress: 0,
            error: null,
          }
        : j
    );
    setJobs(retried);
    await processQueue(retried);
  }, [jobs, processQueue]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    runningRef.current = false;
    setRunning(false);
    setJobs([]);
  }, []);

  const stats = computeBulkStats(jobs);

  const overallProgress =
    jobs.length === 0
      ? 0
      : Math.round(
          jobs.reduce((acc, j) => {
            if (j.status === "success" || j.status === "skipped") return acc + 100;
            if (j.status === "failed") return acc + 100;
            if (j.status === "processing") return acc + j.progress;
            return acc;
          }, 0) / jobs.length
        );

  const activeJob = jobs.find((j) => j.status === "processing") ?? null;

  return {
    jobs,
    stats,
    running,
    activeJob,
    overallProgress,
    enqueue,
    enqueueAndStart,
    start,
    retryFailed,
    cancel,
    reset,
  };
}
