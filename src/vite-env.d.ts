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
  /** Clave AES-256-GCM derivada por SHA-256 del texto (Fase 2 custodial en cliente; preferir KMS/Edge en prod). */
  readonly VITE_STUDENT_WALLET_ENCRYPTION_KEY?: string;
  /** Secreto compartido con la Edge Function `student-wallet-custody` (header x-certilink-custody-secret). */
  readonly VITE_EDGE_WALLET_INVOKER_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
