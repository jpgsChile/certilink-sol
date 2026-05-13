-- CertiLink — inscripciones curso ↔ alumno (operación OTEC)
-- Ejecutar en Supabase SQL Editor tras alinear esquema con public.otec, public.cursos, public.alumnos.
--
-- Cliente con login RPC (`certilink_otec_login`, rol anon sin JWT): aplicar también
-- supabase/sql/015_curso_alumnos_rpc.sql para listar/inscribir/actualizar vía SECURITY DEFINER.

create table if not exists public.curso_alumnos (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.cursos (id) on delete cascade,
  alumno_id uuid not null references public.alumnos (id) on delete cascade,
  otec_id uuid not null references public.otec (id) on delete cascade,
  estado text not null default 'inscrito',
  nota numeric(5, 2),
  asistencia numeric(5, 2),
  aprobado boolean not null default false,
  fecha_inscripcion date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curso_alumnos_curso_alumno_key unique (curso_id, alumno_id),
  constraint curso_alumnos_estado_chk check (
    estado in ('inscrito', 'en_curso', 'finalizado', 'retirado')
  ),
  constraint curso_alumnos_asistencia_chk check (asistencia is null or (asistencia >= 0 and asistencia <= 100))
);

create index if not exists curso_alumnos_curso_id_idx on public.curso_alumnos (curso_id);
create index if not exists curso_alumnos_alumno_id_idx on public.curso_alumnos (alumno_id);
create index if not exists curso_alumnos_otec_id_idx on public.curso_alumnos (otec_id);
create index if not exists curso_alumnos_otec_aprobado_idx on public.curso_alumnos (otec_id, curso_id) where aprobado = true;

create or replace function public.curso_alumnos_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists curso_alumnos_set_updated_at on public.curso_alumnos;
create trigger curso_alumnos_set_updated_at
  before update on public.curso_alumnos
  for each row
  execute function public.curso_alumnos_set_updated_at ();

alter table public.curso_alumnos enable row level security;

-- Aislamiento por tenant: mismo patrón que cursos / alumnos (otec.user_id = auth.uid())
drop policy if exists curso_alumnos_tenant_select on public.curso_alumnos;
drop policy if exists curso_alumnos_tenant_insert on public.curso_alumnos;
drop policy if exists curso_alumnos_tenant_update on public.curso_alumnos;
drop policy if exists curso_alumnos_tenant_delete on public.curso_alumnos;

create policy curso_alumnos_tenant_select
  on public.curso_alumnos for select
  to authenticated
  using (
    exists (
      select 1 from public.otec o
      where o.id = curso_alumnos.otec_id and o.user_id = auth.uid()
    )
  );

create policy curso_alumnos_tenant_insert
  on public.curso_alumnos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.otec o
      where o.id = curso_alumnos.otec_id and o.user_id = auth.uid()
    )
    and exists (
      select 1 from public.cursos c
      where c.id = curso_alumnos.curso_id and c.otec_id = curso_alumnos.otec_id
    )
    and exists (
      select 1 from public.alumnos a
      where a.id = curso_alumnos.alumno_id and a.otec_id = curso_alumnos.otec_id
    )
  );

create policy curso_alumnos_tenant_update
  on public.curso_alumnos for update
  to authenticated
  using (
    exists (
      select 1 from public.otec o
      where o.id = curso_alumnos.otec_id and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.otec o
      where o.id = curso_alumnos.otec_id and o.user_id = auth.uid()
    )
    and exists (
      select 1 from public.cursos c
      where c.id = curso_alumnos.curso_id and c.otec_id = curso_alumnos.otec_id
    )
    and exists (
      select 1 from public.alumnos a
      where a.id = curso_alumnos.alumno_id and a.otec_id = curso_alumnos.otec_id
    )
  );

create policy curso_alumnos_tenant_delete
  on public.curso_alumnos for delete
  to authenticated
  using (
    exists (
      select 1 from public.otec o
      where o.id = curso_alumnos.otec_id and o.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.curso_alumnos to authenticated;

notify pgrst, 'reload schema';
