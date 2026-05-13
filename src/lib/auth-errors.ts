/** Mensajes legibles para errores de autenticación y PostgREST. */
export function getAuthErrorMessage(err: unknown): string {
  const raw =
    err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
      ? (err as { message: string }).message
      : err instanceof Error
        ? err.message
        : "";

  const lower = raw.toLowerCase();

  if (lower.includes("could not find the") && lower.includes("function")) {
    return "Falta ejecutar las funciones SQL en Supabase (supabase/sql/006_certilink_otec_auth_rpc.sql): certilink_otec_login y certilink_otec_register.";
  }
  if (lower.includes("password_too_short")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (lower.includes("duplicate key") || lower.includes("unique constraint") || lower.includes("already exists")) {
    return "Ya existe una institución registrada con este correo.";
  }
  if (lower.includes("could not find the table") || lower.includes("schema cache")) {
    return "La tabla indicada no existe o PostgREST no ha recargado el esquema. Revise que existan public.otec, public.alumnos, public.cursos y public.certificados; en API → Reload schema.";
  }
  if (lower.includes("credenciales incorrectas")) {
    return "Correo o contraseña incorrectos.";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (lower.includes("email not confirmed")) {
    return "Debes confirmar el correo antes de iniciar sesión.";
  }
  if (lower.includes("user already registered")) {
    return "Ya existe una cuenta con este correo.";
  }
  if (lower.includes("jwt") || lower.includes("apikey") || lower.includes("invalid api")) {
    return "La clave pública del proyecto no coincide con la URL (revisa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY o VITE_SUPABASE_ANON_KEY en .env y reinicia Vite).";
  }

  return raw || "Error al procesar la solicitud";
}
