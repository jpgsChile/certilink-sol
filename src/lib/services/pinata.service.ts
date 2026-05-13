/**
 * Cliente Pinata (JWT) para IPFS — pensado para MVP; en producción conviene proxy backend.
 */

const PINATA_PIN_FILE = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export function isPinataConfigured(): boolean {
  return Boolean(import.meta.env.VITE_PINATA_JWT?.trim());
}

export function getPinataJwt(): string {
  const jwt = import.meta.env.VITE_PINATA_JWT?.trim();
  if (!jwt) {
    throw new Error(
      "Configure VITE_PINATA_JWT en .env para subir la credencial a almacenamiento descentralizado (IPFS)."
    );
  }
  return jwt;
}

export function ipfsCidToGatewayUrl(cid: string): string {
  const clean = cid.replace(/^ipfs:\/\//, "");
  return `https://gateway.pinata.cloud/ipfs/${clean}`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < attempts - 1) {
        await sleep(400 * (i + 1));
      }
    }
  }
  throw last instanceof Error ? last : new Error(`${label}: error desconocido`);
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

    xhr.onerror = () => reject(new Error("Red: no se pudo contactar a Pinata"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText) as { IpfsHash?: string };
          if (!json.IpfsHash) reject(new Error("Pinata: respuesta sin IpfsHash"));
          else resolve({ IpfsHash: json.IpfsHash });
        } catch {
          reject(new Error("Pinata: respuesta inválida"));
        }
      } else {
        reject(new Error(`Pinata (${xhr.status}): ${xhr.responseText?.slice(0, 200) || "sin cuerpo"}`));
      }
    };

    xhr.send(fd);
  });
}

export async function pinataPinFile(
  blob: Blob,
  filename: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const jwt = getPinataJwt();
  const { IpfsHash } = await withRetry("Pinata archivo", () =>
    xhrUploadFile(blob, filename, jwt, onProgress)
  );
  return ipfsCidToGatewayUrl(IpfsHash);
}

export async function pinataPinJson(
  body: Record<string, unknown>,
  pinName: string
): Promise<string> {
  const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
  return pinataPinFile(blob, `${pinName}.json`);
}
