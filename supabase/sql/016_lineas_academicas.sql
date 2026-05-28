-- Líneas académicas por OTEC + extensión de cursos (programa URL, FK línea).
-- Ejecutar en Supabase SQL Editor. Tras aplicar: API → Reload schema.
-- Cliente con login RPC (`certilink_otec_login`, rol anon sin JWT): aplicar también
-- supabase/sql/026_lineas_academicas_rpc.sql para CRUD vía SECURITY DEFINER.

create table if not exists public.lineas_academicas (
  id uuid primary key default gen_random_uuid(),
  otec_id uuid not null references public.otec (id) on delete cascade,
  nombre text not null,
  descripcion text,
  sitio_web text,
  banner_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lineas_academicas_otec_id_idx on public.lineas_academicas (otec_id);

alter table public.cursos
  add column if not exists linea_academica_id uuid references public.lineas_academicas (id) on delete set null;

alter table public.cursos
  add column if not exists programa_url text;

create index if not exists cursos_linea_academica_id_idx on public.cursos (linea_academica_id);

alter table public.lineas_academicas enable row level security;

drop policy if exists "lineas_academicas_tenant_all" on public.lineas_academicas;
create policy "lineas_academicas_tenant_all"
  on public.lineas_academicas
  for all
  to authenticated
  using (
    exists (
      select 1 from public.otec o
      where o.id = lineas_academicas.otec_id and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.otec o
      where o.id = lineas_academicas.otec_id and o.user_id = auth.uid()
    )
  );

-- Lectura acotada para verificación pública (anon): solo filas vinculadas a certificados emitidos.
drop policy if exists "lineas_academicas_select_emitido" on public.lineas_academicas;
create policy "lineas_academicas_select_emitido"
  on public.lineas_academicas
  for select
  to anon
  using (
    exists (
      select 1
      from public.cursos c
      inner join public.certificados cert on cert.curso_id = c.id and cert.otec_id = c.otec_id
      where c.linea_academica_id = lineas_academicas.id
        and cert.estado::text = 'emitido'
    )
  );

grant select, insert, update, delete on public.lineas_academicas to authenticated;
grant select on public.lineas_academicas to anon;

notify pgrst, 'reload schema';
