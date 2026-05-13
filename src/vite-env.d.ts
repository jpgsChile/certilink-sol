/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** @deprecated Usar VITE_SUPABASE_PUBLISHABLE_KEY */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Habilita ruta /diagnostico y enlace en sidebar (además de modo dev). */
  readonly VITE_ENABLE_SUPABASE_DIAGNOSTICS?: string;
  /** JWT de Pinata (subida IPFS desde el cliente — en producción usar backend). */
  readonly VITE_PINATA_JWT?: string;
  /** URL pública de la app (metadata / enlaces). Por defecto `window.location.origin`. */
  readonly VITE_PUBLIC_APP_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
