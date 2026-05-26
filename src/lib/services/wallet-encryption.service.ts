/**
 * Cifrado AES-256-GCM en el navegador — **solo fallback** si no está activa la custodia Edge
 * (`VITE_EDGE_WALLET_INVOKER_SECRET` + función `student-wallet-custody`).
 * En producción use Edge + `STUDENT_WALLET_CUSTODY_AES_KEY` en Supabase.
 */

const PLAIN_PREFIX = "plaintext-v1:";
const V1_PREFIX = "v1.";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function deriveAesKey(): Promise<CryptoKey> {
  const raw = import.meta.env.VITE_STUDENT_WALLET_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      "Falta VITE_STUDENT_WALLET_ENCRYPTION_KEY en .env (texto secreto; se usa SHA-256 como clave AES-256)."
    );
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export function isStudentWalletEncryptionConfigured(): boolean {
  return Boolean(import.meta.env.VITE_STUDENT_WALLET_ENCRYPTION_KEY?.trim());
}

/** Material en claro (secret key bs58) → payload para columna encrypted_private_key */
export async function encryptWalletPrivateMaterial(plainBs58: string): Promise<string> {
  if (!isStudentWalletEncryptionConfigured()) {
    return `${PLAIN_PREFIX}${bytesToBase64(new TextEncoder().encode(plainBs58))}`;
  }
  const key = await deriveAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pt = new TextEncoder().encode(plainBs58);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, pt));
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return `${V1_PREFIX}${bytesToBase64(combined)}`;
}

/** Recupera secret key bs58 desde encrypted_private_key */
export async function decryptWalletPrivateMaterial(stored: string): Promise<string> {
  if (stored.startsWith(PLAIN_PREFIX)) {
    const raw = base64ToBytes(stored.slice(PLAIN_PREFIX.length));
    return new TextDecoder().decode(raw);
  }
  if (stored.startsWith(V1_PREFIX)) {
    if (!isStudentWalletEncryptionConfigured()) {
      throw new Error(
        "Este perfil digital está cifrado. Añada VITE_STUDENT_WALLET_ENCRYPTION_KEY (la misma usada al crearlo)."
      );
    }
    const combined = base64ToBytes(stored.slice(V1_PREFIX.length));
    if (combined.length < 13) throw new Error("Payload cifrado inválido");
    const iv = combined.slice(0, 12);
    const ct = combined.slice(12);
    const key = await deriveAesKey();
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(pt);
  }
  throw new Error("Formato de material cifrado no reconocido");
}
