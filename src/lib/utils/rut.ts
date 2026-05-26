/**
 * Utilidades centralizadas RUT chileno (personas naturales / jurídicas, dígito verificador 0–9 o K).
 * Único punto de verdad para limpieza, formato, validación y comparación.
 */

export const RUT_MESSAGES = {
  invalid: "RUT inválido",
  valid: "Formato correcto",
  required: "Ingrese un RUT",
} as const;

export type NormalizedRut = {
  /** Solo dígitos + dígito verificador (K mayúscula). Ej: 123456785 */
  cleaned: string;
  /** Formato oficial XX.XXX.XXX-V */
  formatted: string;
  /** Dígito verificador en mayúsculas (0-9 o K) */
  dv: string;
};

const SEP = /[.\-\s\u00A0]/g;

/** Elimina puntos, guiones, espacios y caracteres no válidos; conserva dígitos y K solo como DV final. */
export function cleanRut(input: string): string {
  if (input == null) return "";
  const upper = String(input).toUpperCase().replace(SEP, "");
  const trimmed = upper.replace(/[^0-9K]/g, "");
  if (!trimmed) return "";
  if (trimmed.endsWith("K")) {
    const digits = trimmed.slice(0, -1).replace(/[^0-9]/g, "").slice(0, 8);
    return digits.length > 0 ? `${digits}K` : "";
  }
  return trimmed.replace(/[^0-9]/g, "").slice(0, 9);
}

function dotBody(body: string): string {
  if (!body) return "";
  let res = "";
  let count = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) res = "." + res;
    res = body[i] + res;
    count++;
  }
  return res;
}

/** Separa cuerpo (7–8 dígitos) y dígito verificador según largo típico chileno. */
export function splitBodyDv(cleaned: string): { body: string; dv: string } {
  const u = cleanRut(cleaned);
  if (!u) return { body: "", dv: "" };
  if (u.endsWith("K")) {
    return { body: u.slice(0, -1), dv: "K" };
  }
  if (u.length <= 7) return { body: u, dv: "" };
  if (u.length === 8) return { body: u.slice(0, 7), dv: u.slice(7) };
  return { body: u.slice(0, 8), dv: u.slice(8) };
}

/** Calcula dígito verificador módulo 11 (0–9 o K). */
export function computeRutDv(body: string): string {
  if (!/^\d{7,8}$/.test(body)) return "";
  let sum = 0;
  let mult = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]!, 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return "0";
  if (rest === 10) return "K";
  return String(rest);
}

/**
 * Formato oficial chileno: XX.XXX.XXX-V
 * Con entrada incompleta, formatea solo el cuerpo con puntos (sin guión) hasta completar DV.
 */
export function formatRut(input: string): string {
  const { body, dv } = splitBodyDv(input);
  if (!body) return "";
  const dotted = dotBody(body);
  if (!dv) return dotted;
  return `${dotted}-${dv}`;
}

/** Valida dígito verificador (acepta K/k en entrada previa a clean). */
export function validateRut(input: string): boolean {
  const { body, dv } = splitBodyDv(input);
  if (!body || !dv) return false;
  if (!/^\d{7,8}$/.test(body)) return false;
  const dvUpper = dv.toUpperCase();
  if (!/^[0-9K]$/.test(dvUpper)) return false;
  return computeRutDv(body) === dvUpper;
}

/**
 * Normaliza: limpia, formatea y deja el DV en mayúscula.
 * `cleaned` = cuerpo+DV sin separadores; `formatted` = con puntos y guión si hay DV.
 */
export function normalizeRut(input: string): NormalizedRut {
  const { body, dv } = splitBodyDv(input);
  const dvUpper = dv ? dv.toUpperCase() : "";
  const cleaned = body && dvUpper ? `${body}${dvUpper}` : body;
  const formatted = dvUpper && body.length >= 7 ? formatRut(`${body}${dvUpper}`) : body ? dotBody(body) : "";
  return { cleaned, formatted, dv: dvUpper };
}

/**
 * Valor mostrado mientras el usuario escribe: aplica limpieza interna y formato progresivo.
 */
export function formatRutWhileTyping(input: string): string {
  return formatRut(input);
}

/** Texto para tablas: formato oficial si es válido; si no, el valor recibido. */
export function displayRut(raw: string | null | undefined): string {
  if (raw == null || !String(raw).trim()) return "—";
  const s = String(raw).trim();
  if (validateRut(s)) return normalizeRut(s).formatted;
  return s;
}

/** Comparación estable entre dos RUT (ignora puntos, guiones, espacios y case de K). */
export function rutsEqual(a: string, b: string): boolean {
  const ca = cleanRut(a);
  const cb = cleanRut(b);
  if (!ca || !cb) return ca === cb;
  return ca === cb;
}

/**
 * Coincidencia para búsquedas: tolera distintos formatos.
 * Si `query` no aporta dígitos/K, devuelve false (el llamador puede combinar con otros campos).
 */
export function rutMatchesSearch(storedRut: string, query: string): boolean {
  const q = cleanRut(query);
  if (!q) return false;
  const s = cleanRut(storedRut);
  if (!s) return false;
  return s.includes(q) || storedRut.replace(SEP, "").toUpperCase().includes(q);
}
