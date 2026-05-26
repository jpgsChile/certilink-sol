import { supabase } from "@/lib/supabase";
import { getExplorerUrl } from "@/lib/solana/config";
import type {
  Certificado,
  CertificadoInsert,
  CertificadoUpdate,
  CertificadoConDetalles,
  Json,
} from "@/lib/database.types";
import {
  parseCredentialExtensions,
  serializeCredentialExtensions,
  CREDENTIAL_EXTENSIONS_SCHEMA_VERSION,
  type CredentialExtensionsV1,
} from "@/lib/credential-extensions";

const CERT_SELECT = `
  *,
  alumnos ( nombre, apellido, rut ),
  cursos (
    nombre,
    codigo,
    horas,
    programa_url,
    linea_academica_id,
    lineas_academicas ( id, nombre, descripcion, sitio_web, banner_url )
  ),
  otec ( nombre )
`;

async function generateHash(alumnoId: string, cursoId: string, fecha: string): Promise<string> {
  const payload = `${alumnoId}:${cursoId}:${fecha}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const encoded = new TextEncoder().encode(payload);

  try {
    if (typeof crypto !== "undefined" && crypto.subtle?.digest) {
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* entornos sin subtle o digest fallido — fallback abajo */
  }

  const buf = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < buf.length; i += 1) buf[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hashToCode(hash: string): string {
  return `CL-${hash.substring(0, 6).toUpperCase()}`;
}

/** Explorer Solana a partir de `tx_hash` guardado en certificados. */
export function certificadoExplorerUrl(txHash: string | null | undefined): string | null {
  if (!txHash) return null;
  return getExplorerUrl("tx", txHash);
}

/** Mint / token mint address en esquema actual (`token_id`). */
export function certificadoMintDisplay(cert: Pick<Certificado, "token_id">): string | null {
  return cert.token_id ?? null;
}

/** URL de explorador: prioriza metadata guardada en mint, si no, tx. */
export function certificadoPublicExplorer(cert: Certificado): string | null {
  if (cert.metadata && typeof cert.metadata === "object" && !Array.isArray(cert.metadata)) {
    const m = cert.metadata as Record<string, unknown>;
    if (typeof m.explorer_url === "string") return m.explorer_url;
  }
  return certificadoExplorerUrl(cert.tx_hash);
}

export function certificadoExplorerMintUrl(cert: Certificado): string | null {
  if (cert.metadata && typeof cert.metadata === "object" && !Array.isArray(cert.metadata)) {
    const m = cert.metadata as Record<string, unknown>;
    if (typeof m.explorer_mint_url === "string") return m.explorer_mint_url;
  }
  const mint = certificadoMintDisplay(cert);
  return mint ? getExplorerUrl("address", mint) : null;
}

export const certificadosService = {
  async getAll(otecId: string): Promise<CertificadoConDetalles[]> {
    const { data, error } = await supabase
      .from("certificados")
      .select(CERT_SELECT)
      .eq("otec_id", otecId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as CertificadoConDetalles[];
  },

  /** Credenciales emitidas a un estudiante (mismo tenant OTEC). */
  async getByAlumno(otecId: string, alumnoId: string): Promise<CertificadoConDetalles[]> {
    const { data, error } = await supabase
      .from("certificados")
      .select(CERT_SELECT)
      .eq("otec_id", otecId)
      .eq("alumno_id", alumnoId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as CertificadoConDetalles[];
  },

  async getByIdForTenant(otecId: string, certificadoId: string): Promise<CertificadoConDetalles> {
    const { data, error } = await supabase
      .from("certificados")
      .select(CERT_SELECT)
      .eq("id", certificadoId)
      .eq("otec_id", otecId)
      .single();

    if (error) throw error;
    return data as CertificadoConDetalles;
  },

  /** Sustituye el documento JSON de extensiones (skills graph v1, etc.). */
  async updateCredentialExtensions(otecId: string, certificadoId: string, extensions: Json): Promise<void> {
    const { error } = await supabase
      .from("certificados")
      .update({ credential_extensions: extensions })
      .eq("id", certificadoId)
      .eq("otec_id", otecId);

    if (error) throw error;
  },

  /**
   * Fusiona `partial` sobre el estado persistido (arrays sustituidos si vienen en `partial`;
   * `future_mappings` se une superficialmente).
   */
  async mergeCredentialExtensions(
    otecId: string,
    certificadoId: string,
    partial: Partial<CredentialExtensionsV1>
  ): Promise<void> {
    const current = await this.getByIdForTenant(otecId, certificadoId);
    const parsed = parseCredentialExtensions(current.credential_extensions);
    const next: CredentialExtensionsV1 = {
      ...parsed,
      ...partial,
      schema_version: CREDENTIAL_EXTENSIONS_SCHEMA_VERSION,
      skills: partial.skills ?? parsed.skills,
      competencies: partial.competencies ?? parsed.competencies,
      academic_categories: partial.academic_categories ?? parsed.academic_categories,
      achievement_tags: partial.achievement_tags ?? parsed.achievement_tags,
      future_mappings: { ...parsed.future_mappings, ...partial.future_mappings },
    };
    await this.updateCredentialExtensions(otecId, certificadoId, serializeCredentialExtensions(next) as Json);
  },

  async create(
    otecId: string,
    alumnoId: string,
    cursoId: string,
    fechaEmision?: string
  ): Promise<CertificadoConDetalles> {
    const fecha = fechaEmision || new Date().toISOString().split("T")[0];
    const hash = await generateHash(alumnoId, cursoId, fecha);

    const insert: CertificadoInsert = {
      otec_id: otecId,
      alumno_id: alumnoId,
      curso_id: cursoId,
      hash_sha256: hash,
      fecha_emision: fecha,
      fecha_fin: fecha,
      nota: null,
      estado: "emitido",
    };

    const { data, error } = await supabase
      .from("certificados")
      .insert(insert)
      .select(CERT_SELECT)
      .single();

    if (error) throw error;
    return data as CertificadoConDetalles;
  },

  /** Último certificado emitido para la inscripción curso–alumno (control de duplicados). */
  async findByEnrollment(
    otecId: string,
    alumnoId: string,
    cursoId: string
  ): Promise<Pick<Certificado, "id" | "hash_sha256" | "tx_hash" | "estado"> | null> {
    const { data, error } = await supabase
      .from("certificados")
      .select("id, hash_sha256, tx_hash, estado")
      .eq("otec_id", otecId)
      .eq("alumno_id", alumnoId)
      .eq("curso_id", cursoId)
      .eq("estado", "emitido")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /** Resumen por curso para emisión masiva (mapa alumno → certificado). */
  async listSummariesByCurso(
    otecId: string,
    cursoId: string
  ): Promise<Array<Pick<Certificado, "id" | "alumno_id" | "hash_sha256" | "tx_hash">>> {
    const { data, error } = await supabase
      .from("certificados")
      .select("id, alumno_id, hash_sha256, tx_hash")
      .eq("otec_id", otecId)
      .eq("curso_id", cursoId)
      .eq("estado", "emitido")
      .order("created_at", { ascending: false });

    if (error) throw error;
    const rows = data ?? [];
    const byAlumno = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!byAlumno.has(row.alumno_id)) byAlumno.set(row.alumno_id, row);
    }
    return [...byAlumno.values()];
  },

  async updateStatus(id: string, estado: CertificadoUpdate["estado"]): Promise<void> {
    const { error } = await supabase.from("certificados").update({ estado }).eq("id", id);

    if (error) throw error;
  },

  /** Actualiza campos de registro digital / IPFS / blockchain (emisión credencial). */
  async updateBlockchainFields(id: string, patch: CertificadoUpdate): Promise<void> {
    const { error } = await supabase.from("certificados").update(patch).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("certificados").delete().eq("id", id);

    if (error) throw error;
  },

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

  /** Certificados con transacción on-chain registrada (`tx_hash`). */
  async countWithBlockchainTx(otecId: string): Promise<number> {
    const { count, error } = await supabase
      .from("certificados")
      .select("*", { count: "exact", head: true })
      .eq("otec_id", otecId)
      .not("tx_hash", "is", null);

    if (error) throw error;
    return count ?? 0;
  },

  async verifyByHash(hash: string): Promise<CertificadoConDetalles | null> {
    const { data, error } = await supabase
      .from("certificados")
      .select(CERT_SELECT)
      .eq("hash_sha256", hash)
      .maybeSingle();

    if (error) throw error;
    return data as CertificadoConDetalles | null;
  },

  async verifyByCode(code: string): Promise<CertificadoConDetalles | null> {
    const cleanCode = code.replace(/^CL-/i, "").trim().toLowerCase();
    if (cleanCode.length < 6) return null;

    const { data, error } = await supabase
      .from("certificados")
      .select(CERT_SELECT)
      .ilike("hash_sha256", `${cleanCode}%`)
      .eq("estado", "emitido")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as CertificadoConDetalles | null;
  },

  hashToCode,
};
