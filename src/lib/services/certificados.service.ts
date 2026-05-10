

import { supabase } from "@/lib/supabase";
import type {
  CertificadoInsert,
  CertificadoUpdate,
  CertificadoConDetalles,
} from "@/lib/database.types";

/** Generate a SHA-256 hash for a certificate */
async function generateHash(alumnoId: string, cursoId: string, fecha: string): Promise<string> {
  const payload = `${alumnoId}:${cursoId}:${fecha}:${Date.now()}`;
  const encoded = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Create a short verification code from a hash (first 10 chars, uppercase) */
function hashToCode(hash: string): string {
  return `CL-${hash.substring(0, 6).toUpperCase()}`;
}

export const certificadosService = {
  /** Fetch all certificates for the current OTEC with student/course details */
  async getAll(otecId: string): Promise<CertificadoConDetalles[]> {
    const { data, error } = await supabase
      .from("certificados")
      .select(`
        *,
        alumnos ( nombre, apellido, rut ),
        cursos ( nombre, codigo, horas )
      `)
      .eq("otec_id", otecId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as CertificadoConDetalles[];
  },

  /** Issue a new certificate */
  async create(
    otecId: string,
    alumnoId: string,
    cursoId: string,
    fechaEmision?: string
  ): Promise<CertificadoConDetalles> {
    const fecha = fechaEmision || new Date().toISOString().split("T")[0];
    const hash = await generateHash(alumnoId, cursoId, fecha);

    const insert: CertificadoInsert = {
      alumno_id: alumnoId,
      curso_id: cursoId,
      otec_id: otecId,
      hash_sha256: hash,
      fecha_emision: fecha,
      estado: "emitido",
    };

    const { data, error } = await supabase
      .from("certificados")
      .insert(insert)
      .select(`
        *,
        alumnos ( nombre, apellido, rut ),
        cursos ( nombre, codigo, horas )
      `)
      .single();

    if (error) throw error;
    return data as CertificadoConDetalles;
  },

  /** Update certificate status */
  async updateStatus(id: string, estado: CertificadoUpdate["estado"]): Promise<void> {
    const { error } = await supabase
      .from("certificados")
      .update({ estado })
      .eq("id", id);

    if (error) throw error;
  },

  /** Delete a certificate */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("certificados")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /** Count certificates for dashboard (optionally by estado) */
  async count(otecId: string, estado?: string): Promise<number> {
    let query = supabase
      .from("certificados")
      .select("*", { count: "exact", head: true })
      .eq("otec_id", otecId);

    if (estado) {
      query = query.eq("estado", estado);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  },

  /** Public verification - look up certificate by hash */
  async verifyByHash(hash: string): Promise<CertificadoConDetalles | null> {
    const { data, error } = await supabase
      .from("certificados")
      .select(`
        *,
        alumnos ( nombre, apellido, rut ),
        cursos ( nombre, codigo, horas ),
        otecs ( nombre )
      `)
      .eq("hash_sha256", hash)
      .maybeSingle();

    if (error) throw error;
    return data as CertificadoConDetalles | null;
  },

  /** Public verification - search by short code (CL-XXXXXX) */
  async verifyByCode(code: string): Promise<CertificadoConDetalles | null> {
    // Extract the 6-char hex from the code pattern CL-XXXXXX
    const cleanCode = code.replace("CL-", "").toLowerCase();

    const { data, error } = await supabase
      .from("certificados")
      .select(`
        *,
        alumnos ( nombre, apellido, rut ),
        cursos ( nombre, codigo, horas ),
        otecs ( nombre )
      `)
      .ilike("hash_sha256", `${cleanCode}%`)
      .eq("estado", "emitido")
      .maybeSingle();

    if (error) throw error;
    return data as CertificadoConDetalles | null;
  },

  /** Helper: convert hash to display code */
  hashToCode,
};