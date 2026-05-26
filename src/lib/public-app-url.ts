/** URL pública de la app (QR, metadata, enlaces compartidos). */
export function getPublicAppBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_APP_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
  return "";
}

export function buildVerifyPageUrl(verificationCode: string): string {
  const code = verificationCode.trim();
  const base = getPublicAppBaseUrl();
  if (!base) return `/verificar/${encodeURIComponent(code)}`;
  return `${base}/verificar/${encodeURIComponent(code)}`;
}
