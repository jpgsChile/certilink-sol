import type { Certificado } from "@/lib/database.types";

/** Campos del esquema real usados en el ciclo NFT / registro on-chain. */
export const CERTIFICADO_BLOCKCHAIN_FIELDS = [
  "tx_hash",
  "token_id",
  "metadata",
  "ipfs_metadata_url",
  "ipfs_image_url",
  "ipfs_pdf_url",
  "nft_status",
  "nft_issued_at",
  "revoked_at",
  "revocation_reason",
  "revoked_tx_hash",
  "last_blockchain_error",
  "blockchain_retry_count",
  "mint_attempted_at",
  "contract_address",
  "chain_id",
] as const;

export type CertificadoBlockchainIssue = {
  field: string;
  severity: "info" | "warning";
  message: string;
};

/**
 * FASE 5 — comprobaciones declarativas sobre un registro (sin I/O).
 * Útil en QA y para validar payloads antes/después de mint.
 */
export function analyzeCertificadoBlockchainReadiness(
  cert: Partial<Certificado> | null | undefined
): CertificadoBlockchainIssue[] {
  const issues: CertificadoBlockchainIssue[] = [];
  if (!cert) {
    issues.push({ field: "_", severity: "warning", message: "Certificado ausente." });
    return issues;
  }

  if (!cert.hash_sha256) {
    issues.push({
      field: "hash_sha256",
      severity: "warning",
      message: "Falta hash_sha256 (verificación off-chain).",
    });
  }

  if (cert.tx_hash && !cert.token_id) {
    issues.push({
      field: "token_id",
      severity: "info",
      message: "Hay tx_hash pero no token_id (mint address).",
    });
  }

  if (cert.token_id && !cert.tx_hash) {
    issues.push({
      field: "tx_hash",
      severity: "info",
      message: "Hay token_id pero no tx_hash (explorador / trazabilidad incompleta).",
    });
  }

  if (cert.nft_status === "minted" && !cert.nft_issued_at) {
    issues.push({
      field: "nft_issued_at",
      severity: "info",
      message: "Estado minted sin marca de tiempo nft_issued_at.",
    });
  }

  if (cert.revoked_at && !cert.revocation_reason) {
    issues.push({
      field: "revocation_reason",
      severity: "info",
      message: "Revocación sin motivo documentado.",
    });
  }

  if (cert.last_blockchain_error && (cert.blockchain_retry_count ?? 0) === 0) {
    issues.push({
      field: "blockchain_retry_count",
      severity: "info",
      message: "Hay last_blockchain_error pero reintentos en cero.",
    });
  }

  return issues;
}
