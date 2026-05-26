-- CertiLink — Fase 5: extensiones para grafo de competencias / interoperabilidad (sin motor de reputación)
-- Ejecutar en Supabase SQL Editor. Mantiene el flujo actual de certificados (columna nullable con default).

alter table public.certificados
  add column if not exists credential_extensions jsonb not null default '{}'::jsonb;

comment on column public.certificados.credential_extensions is
  'Metadatos académicos extensibles (skills, competencias, categorías, logros). Ver tipos CredentialExtensionsV1 en el cliente.';

create index if not exists certificados_credential_extensions_gin
  on public.certificados using gin (credential_extensions jsonb_path_ops);
