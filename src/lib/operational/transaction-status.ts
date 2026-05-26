/** Estados operacionales unificados para emisión y colas. */
export type OperationalStatus = "pending" | "processing" | "success" | "failed" | "retrying" | "skipped";

export type MintPipelinePhase =
  | "idle"
  | "creating_record"
  | "generating_diploma"
  | "uploading_ipfs"
  | "registering_metadata"
  | "blockchain_emission"
  | "retrying"
  | "final_confirmation"
  | "complete"
  | "error";

export function phaseToOperationalStatus(phase: MintPipelinePhase): OperationalStatus {
  switch (phase) {
    case "idle":
    case "creating_record":
      return "pending";
    case "generating_diploma":
    case "uploading_ipfs":
    case "registering_metadata":
    case "blockchain_emission":
    case "final_confirmation":
      return "processing";
    case "retrying":
      return "retrying";
    case "complete":
      return "success";
    case "error":
      return "failed";
    default:
      return "processing";
  }
}

export const OPERATIONAL_STATUS_LABELS: Record<OperationalStatus, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  success: "Completado",
  failed: "Fallido",
  retrying: "Reintentando",
  skipped: "Omitido",
};
