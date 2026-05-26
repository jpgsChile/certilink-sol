import { supabase } from "@/lib/supabase";
import type { Otec } from "@/lib/database.types";
import type { CertilinkAuthUser } from "@/lib/database.types";

const SESSION_KEY = "certilink.otec.session.v1";

export interface SignUpPayload {
  email: string;
  password: string;
  institucion: string;
  /** RUT institucional en formato oficial (opcional). */
  rut?: string | null;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface OtecAuthResult {
  user: CertilinkAuthUser;
  otec: Otec;
}

function parseOtec(raw: unknown): Otec | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : "";
  const email = o.email != null ? String(o.email) : "";
  if (!id || !email) return null;
  return { ...(o as object), id, email } as Otec;
}

export function readPersistedOtec(): Otec | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return parseOtec(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Persiste la fila OTEC en sessionStorage (sesión institucional). */
export function writeOtecSession(otec: Otec) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(otec));
}

function persistOtec(otec: Otec) {
  writeOtecSession(otec);
}

function clearPersistedOtec() {
  sessionStorage.removeItem(SESSION_KEY);
}

function rpcOtecRows(data: unknown): Otec[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data.map((r) => parseOtec(r)).filter(Boolean) as Otec[];
  const one = parseOtec(data);
  return one ? [one] : [];
}

export const authService = {
  readPersistedOtec,

  /** Registro vía RPC (hash bcrypt en servidor). */
  async signUp({ email, password, institucion, rut }: SignUpPayload): Promise<OtecAuthResult> {
    const { data, error } = await supabase.rpc("certilink_otec_register", {
      p_nombre: institucion.trim(),
      p_email: email.trim(),
      p_password: password,
      p_rut: rut?.trim() || null,
      p_direccion: null,
      p_telefono: null,
    });

    if (error) throw error;
    const rows = rpcOtecRows(data);
    const otec = rows[0];
    if (!otec) throw new Error("No se pudo crear la institución");

    persistOtec(otec);
    return {
      user: { id: otec.id, email: otec.email },
      otec,
    };
  },

  /** Login vía RPC (compara password con password_hash en BD). */
  async signIn({ email, password }: SignInPayload): Promise<OtecAuthResult> {
    const { data, error } = await supabase.rpc("certilink_otec_login", {
      p_email: email.trim(),
      p_password: password.trim(),
    });

    if (error) throw error;
    const rows = rpcOtecRows(data);
    const otec = rows[0];
    if (!otec) throw new Error("Credenciales incorrectas");

    persistOtec(otec);
    return {
      user: { id: otec.id, email: otec.email },
      otec,
    };
  },

  async signOut() {
    clearPersistedOtec();
    await supabase.auth.signOut();
  },

  /** Compatibilidad: ya no hay sesión JWT de Supabase Auth para OTEC. */
  async getSession() {
    return null;
  },

  /** Fila OTEC persistida en sesión del navegador. */
  async getOtec(): Promise<Otec | null> {
    return readPersistedOtec();
  },

  /** Refresca desde la BD (requiere políticas RLS que permitan lectura con anon o ajuste en servidor). */
  async fetchOtecById(id: string): Promise<Otec | null> {
    const { data, error } = await supabase.from("otec").select("*").eq("id", id).maybeSingle();
    if (error || !data) return readPersistedOtec();
    const row = data as Otec;
    writeOtecSession(row);
    return row;
  },
};
