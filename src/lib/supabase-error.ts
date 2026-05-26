/** Mensaje legible para errores de supabase-js / PostgREST / RPC y otros objetos con `message`. */
export function formatSupabaseUserError(err: unknown): string {
  if (err == null) return "Error desconocido";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    const base = err.message || "Error desconocido";
    const withCause = err as Error & { cause?: unknown };
    if (withCause.cause !== undefined && withCause.cause !== err) {
      const c = formatSupabaseUserError(withCause.cause);
      if (c && c !== "Error desconocido") return `${base} (${c})`;
    }
    return base;
  }
  if (typeof err === "object" && err !== null) {
    const e = err as { message?: string; details?: string; hint?: string; reason?: string };
    const parts = [e.message, e.details, e.hint, e.reason].filter((s) => typeof s === "string" && s.trim().length > 0);
    if (parts.length) return parts.join(" — ");
    try {
      const j = JSON.stringify(err);
      if (j && j !== "{}" && j.length < 480) return j;
    } catch {
      /* noop */
    }
  }
  try {
    return String(err);
  } catch {
    return "Error desconocido";
  }
}

/** Convierte error PostgREST de supabase-js en `Error` con mensaje legible. */
export function throwSupabaseError(
  error: { message?: string; details?: string; hint?: string; code?: string } | null,
  prefix: string
): void {
  if (error) {
    throw new Error(`${prefix}: ${formatSupabaseUserError(error)}`);
  }
}
