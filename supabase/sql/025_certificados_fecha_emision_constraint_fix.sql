-- Corrige filas legacy donde fecha_emision < fecha_fin (viola chk_certificados_fecha_emision_mayor_igual_fin).
-- Ejecutar en Supabase SQL Editor si la emisión falla al actualizar certificados existentes.

update public.certificados
set
  fecha_emision = fecha_fin,
  updated_at = now()
where fecha_fin is not null
  and fecha_emision < fecha_fin;
