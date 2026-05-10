import { createClient } from "@supabase/supabase-js";

function resolveSupabaseConfig(): { url: string; key: string } {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (url && key) {
    return { url, key };
  }

  console.warn(
    "[CertiLink] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Use .env.example → .env. Mientras tanto se usa un cliente placeholder: la UI carga; auth y API no funcionan."
  );

  return {
    url: url ?? "https://placeholder.supabase.co",
    key: key ?? "sb-placeholder-anon-key-not-configured",
  };
}

const { url, key } = resolveSupabaseConfig();

export const supabase = createClient(url, key);
