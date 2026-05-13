import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ""
).trim();

if (import.meta.env.DEV && (!supabaseUrl || !supabaseKey)) {
  console.error(
    "[Supabase] Faltan variables en .env: define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY (o la clave JWT legada VITE_SUPABASE_ANON_KEY). Tras editar .env, reinicia `pnpm dev`."
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

/** Indica si la página de diagnóstico Supabase está habilitada (dev o flag explícita). */
export function isSupabaseDiagnosticsEnabled(): boolean {
  return (
    import.meta.env.DEV === true ||
    import.meta.env.VITE_ENABLE_SUPABASE_DIAGNOSTICS === "true"
  );
}

export type SupabaseEnvDiagnostics = {
  hasUrl: boolean;
  hasPublishableOrAnonKey: boolean;
  urlHost: string | null;
  /** Últimos 6 caracteres de la clave (solo para comprobar que cargó; no es secreto completo). */
  keySuffix: string | null;
  keyKind: "publishable" | "anon" | "unknown" | "missing";
  warnings: string[];
};

/**
 * Validación local de variables (sin red). No registra la clave completa.
 */
export function getSupabaseEnvDiagnostics(): SupabaseEnvDiagnostics {
  const warnings: string[] = [];
  const rawPub = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const rawAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasUrl = Boolean(supabaseUrl);
  const hasPublishableOrAnonKey = Boolean(supabaseKey);

  if (!hasUrl) warnings.push("Falta VITE_SUPABASE_URL.");
  if (!hasPublishableOrAnonKey) {
    warnings.push("Falta VITE_SUPABASE_PUBLISHABLE_KEY o VITE_SUPABASE_ANON_KEY.");
  }

  let urlHost: string | null = null;
  try {
    if (supabaseUrl) urlHost = new URL(supabaseUrl).host;
  } catch {
    warnings.push("VITE_SUPABASE_URL no es una URL válida.");
  }

  let keyKind: SupabaseEnvDiagnostics["keyKind"] = "missing";
  if (rawPub && String(rawPub).trim()) keyKind = "publishable";
  else if (rawAnon && String(rawAnon).trim()) keyKind = "anon";
  else if (supabaseKey) keyKind = "unknown";

  const keySuffix =
    supabaseKey.length >= 6 ? supabaseKey.slice(-6) : supabaseKey.length > 0 ? supabaseKey : null;

  if (hasUrl && urlHost && !urlHost.includes("supabase.co")) {
    warnings.push("El host de la URL no parece un proyecto Supabase (supabase.co). Verifique el valor.");
  }

  return {
    hasUrl,
    hasPublishableOrAnonKey,
    urlHost,
    keySuffix,
    keyKind,
    warnings,
  };
}

if (import.meta.env.DEV) {
  const d = getSupabaseEnvDiagnostics();
  if (d.warnings.length === 0 && d.hasUrl && d.hasPublishableOrAnonKey) {
    console.info("[CertiLink][Supabase] Variables cargadas", {
      host: d.urlHost,
      keyKind: d.keyKind,
    });
  }
}
