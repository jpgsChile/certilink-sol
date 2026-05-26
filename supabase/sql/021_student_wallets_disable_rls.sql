-- CertiLink — student_wallets: deshabilitar RLS (MVP con auth OTEC vía RPC, clave anon)
-- Si aparece: new row violates row-level security policy for table "student_wallets" (42501)
--
-- El script 017 deja RLS comentado; si se activó RLS sin políticas compatibles, este script lo corrige.

drop policy if exists student_wallets_tenant_all on public.student_wallets;
drop policy if exists student_wallets_anon_all on public.student_wallets;

alter table public.student_wallets disable row level security;

grant select, insert, update, delete on public.student_wallets to anon, authenticated, service_role;

notify pgrst, 'reload schema';
