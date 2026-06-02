/** URL pública de la app (QR, metadata, enlaces compartidos). */
export function getPublicAppBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_APP_BASE_URL?.trim();
  const raw = fromEnv || (typeof window !== "undefined" ? window.location.origin : "");
  if (!raw) return "";

  // Normalizar a SOLO origen (esquema + host + puerto). Las rutas públicas
  // (p. ej. /verificar) viven en la raíz del dominio, así que una
  // VITE_PUBLIC_APP_BASE_URL mal configurada con ruta (p. ej.
  // "https://certilink-sol.vercel.app/login") produciría enlaces rotos como
  // "/login/verificar/...". Reducimos siempre la base a su origen.
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol).origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

export function buildVerifyPageUrl(verificationCode: string): string {
  const code = verificationCode.trim();
  const base = getPublicAppBaseUrl();
  if (!base) return `/verificar/${encodeURIComponent(code)}`;
  return `${base}/verificar/${encodeURIComponent(code)}`;
}
