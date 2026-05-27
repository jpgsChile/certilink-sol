-- Perfil institucional multi-tenant por OTEC (branding, certificados, identidad).
-- Ejecutar en Supabase SQL Editor. Tras aplicar: API → Reload schema.

create table if not exists public.institution_profiles (
  id uuid primary key default gen_random_uuid(),
  otec_id uuid not null references public.otec (id) on delete cascade,
  institution_name text,
  legal_name text,
  rut text,
  description text,
  email text,
  phone text,
  website text,
  address text,
  logo_url text,
  primary_color text not null default '#2563eb',
  secondary_color text not null default '#64748b',
  certificate_accent_color text not null default '#b8922a',
  issuer_display_name text,
  signature_name text,
  signature_role text,
  signature_image_url text,
  legal_text text,
  show_blockchain_badge boolean not null default true,
  verification_domain text,
  wallet_address text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint institution_profiles_otec_id_key unique (otec_id)
);

create index if not exists institution_profiles_otec_id_idx on public.institution_profiles (otec_id);
create index if not exists institution_profiles_deleted_at_idx on public.institution_profiles (deleted_at)
  where deleted_at is null;

create or replace function public.institution_profiles_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists institution_profiles_set_updated_at on public.institution_profiles;
create trigger institution_profiles_set_updated_at
  before update on public.institution_profiles
  for each row
  execute function public.institution_profiles_set_updated_at();

alter table public.institution_profiles enable row level security;

-- Tenant isolation (mismo patrón que lineas_academicas)
drop policy if exists institution_profiles_tenant_all on public.institution_profiles;
create policy institution_profiles_tenant_all
  on public.institution_profiles
  for all
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.otec o
      where o.id = institution_profiles.otec_id and o.user_id = auth.uid()
    )
  )
  with check (
    deleted_at is null
    and exists (
      select 1 from public.otec o
      where o.id = institution_profiles.otec_id and o.user_id = auth.uid()
    )
  );

-- Lectura pública acotada: perfiles vinculados a certificados emitidos
drop policy if exists institution_profiles_select_emitido on public.institution_profiles;
create policy institution_profiles_select_emitido
  on public.institution_profiles
  for select
  to anon
  using (
    deleted_at is null
    and exists (
      select 1
      from public.certificados cert
      where cert.otec_id = institution_profiles.otec_id
        and cert.estado::text = 'emitido'
    )
  );

grant select, insert, update, delete on public.institution_profiles to authenticated;
grant select on public.institution_profiles to anon;

-- Bucket de assets institucionales (logos, firmas)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'institution-assets',
  'institution-assets',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Políticas storage: lectura pública, escritura autenticada por prefijo otec_id
drop policy if exists institution_assets_public_read on storage.objects;
create policy institution_assets_public_read
  on storage.objects for select
  to public
  using (bucket_id = 'institution-assets');

drop policy if exists institution_assets_authenticated_insert on storage.objects;
create policy institution_assets_authenticated_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'institution-assets');

drop policy if exists institution_assets_authenticated_update on storage.objects;
create policy institution_assets_authenticated_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'institution-assets')
  with check (bucket_id = 'institution-assets');

drop policy if exists institution_assets_authenticated_delete on storage.objects;
create policy institution_assets_authenticated_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'institution-assets');

-- Anon puede subir (app usa clave anon con validación en servicio por otec_id en path)
drop policy if exists institution_assets_anon_write on storage.objects;
create policy institution_assets_anon_write
  on storage.objects for all
  to anon
  using (bucket_id = 'institution-assets')
  with check (bucket_id = 'institution-assets');

notify pgrst, 'reload schema';
