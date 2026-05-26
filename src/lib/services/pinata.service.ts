/**
 * Cliente Pinata (JWT) para IPFS — pensado para MVP; en producción conviene proxy backend.
 */

import { withOperationalRetry } from "@/lib/operational/retry";
import { classifyIssuanceError } from "@/lib/operational/issuance-errors";
import { operationalLog } from "@/lib/operational/operational-log.service";

const PINATA_PIN_FILE = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export function isPinataConfigured(): boolean {
  const jwt = import.meta.env.VITE_PINATA_JWT?.trim();
  if (!jwt) return false;
  return jwt.split(".").length === 3;
}

function assertValidPinataJwt(jwt: string): void {
  const parts = jwt.split(".");
  if (parts.length !== 3 || parts.some((part) => !part.length)) {
    throw new Error(
      "VITE_PINATA_JWT no es un JWT válido: debe tener tres partes separadas por puntos (ej. eyJhbG….eyJ1c2….abc123). En app.pinata.cloud → API Keys → New Key, copie el JWT completo en una sola línea en .env y reinicie pnpm dev."
    );
  }
}

export function getPinataJwt(): string {
  const jwt = import.meta.env.VITE_PINATA_JWT?.trim();
  if (!jwt) {
    throw new Error(
      "Configure VITE_PINATA_JWT en .env para subir la credencial a almacenamiento descentralizado (IPFS)."
    );
  }
  assertValidPinataJwt(jwt);
  return jwt;
}

export function ipfsCidToGatewayUrl(cid: string): string {
  const clean = cid.replace(/^ipfs:\/\//, "");
  return `https://gateway.pinata.cloud/ipfs/${clean}`;
}

function xhrUploadFile(
  blob: Blob,
  filename: string,
  jwt: string,
  onProgress?: (pct: number) => void
): Promise<{ IpfsHash: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", blob, filename);

    xhr.open("POST", PINATA_PIN_FILE);
    xhr.setRequestHeader("Authorization", `Bearer ${jwt}`);

    xhr.upload.onprogress = (ev) => {
      if (!onProgress || !ev.lengthComputable) return;
      onProgress(Math.round((ev.loaded / ev.total) * 100));
    };

    xhr.onerror = () => reject(new Error("Red: no se pudo contactar al servicio de almacenamiento IPFS"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText) as { IpfsHash?: string };
          if (!json.IpfsHash) reject(new Error("IPFS: respuesta del servicio incompleta"));
          else resolve({ IpfsHash: json.IpfsHash });
        } catch {
          reject(new Error("IPFS: respuesta del servicio inválida"));
        }
      } else {
        reject(
          new Error(
            xhr.status === 401 || xhr.status === 403
              ? "IPFS: credenciales de Pinata inválidas o expiradas"
              : `IPFS: el servicio respondió con error (${xhr.status})`
          )
        );
      }
    };

    xhr.send(fd);
  });
}

export async function pinataPinFile(
  blob: Blob,
  filename: string,
  onProgress?: (pct: number) => void,
  context?: { certificadoId?: string }
): Promise<string> {
  const jwt = getPinataJwt();

  operationalLog.log({
    type: "ipfs_upload",
    severity: "info",
    message: `Subiendo ${filename} al almacenamiento seguro (IPFS)…`,
    certificadoId: context?.certificadoId,
  });

  const { IpfsHash } = await withOperationalRetry(
    () => xhrUploadFile(blob, filename, jwt, onProgress),
    {
      label: "Subida IPFS",
      maxAttempts: 3,
      initialBackoffMs: 800,
      retryable: (err) => classifyIssuanceError(err).retryable,
      onRetry: ({ attempt, maxAttempts, error, delayMs }) => {
        const classified = classifyIssuanceError(error);
        operationalLog.log({
          type: "ipfs_retry",
          severity: "warning",
          message: classified.userMessage,
          certificadoId: context?.certificadoId,
          attempt: attempt + 1,
          maxAttempts,
          technicalDetail: classified.technical,
          meta: { delayMs: String(delayMs) },
        });
      },
    }
  );

  operationalLog.log({
    type: "ipfs_upload",
    severity: "success",
    message: "Archivo almacenado correctamente en IPFS.",
    certificadoId: context?.certificadoId,
  });

  return ipfsCidToGatewayUrl(IpfsHash);
}

export async function pinataPinJson(
  body: Record<string, unknown>,
  pinName: string,
  context?: { certificadoId?: string }
): Promise<string> {
  const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
  return pinataPinFile(blob, `${pinName}.json`, undefined, context);
}
