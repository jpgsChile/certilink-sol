/** Tipos alineados con el esquema PostgreSQL de producción (Supabase). */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Institución OTEC (tabla `otec`). La contraseña solo existe en BD / RPC. */
export interface Otec {
  id: string;
  rut: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  email: string;
  wallet_address: string | null;
  estado: string | null;
  created_at: string;
  updated_at: string;
}

export type OtecInsert = Omit<Otec, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type OtecUpdate = Partial<Omit<OtecInsert, "id">>;

/** Perfil institucional multi-tenant (tabla `institution_profiles`). */
export interface InstitutionProfile {
  id: string;
  otec_id: string;
  institution_name: string | null;
  legal_name: string | null;
  rut: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  certificate_accent_color: string;
  issuer_display_name: string | null;
  signature_name: string | null;
  signature_role: string | null;
  signature_image_url: string | null;
  legal_text: string | null;
  show_blockchain_badge: boolean;
  verification_domain: string | null;
  wallet_address: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InstitutionProfileInsert = Omit<
  InstitutionProfile,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InstitutionProfileUpdate = Partial<
  Omit<InstitutionProfileInsert, "otec_id">
>;

/** Línea académica institucional (tabla `lineas_academicas`). */
export interface LineaAcademica {
  id: string;
  otec_id: string;
  nombre: string;
  descripcion: string | null;
  sitio_web: string | null;
  banner_url: string | null;
  created_at: string;
  updated_at: string;
}

export type LineaAcademicaInsert = Omit<LineaAcademica, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type LineaAcademicaUpdate = Partial<Omit<LineaAcademicaInsert, "otec_id">>;

export interface Alumno {
  id: string;
  otec_id: string;
  rut: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

export type AlumnoInsert = Omit<Alumno, "id" | "created_at" | "updated_at" | "wallet_address"> & {
  id?: string;
  wallet_address?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AlumnoUpdate = Partial<Omit<AlumnoInsert, "otec_id">>;

/** Red Solana para filas custodiales (`student_wallets.network`). */
export type StudentWalletNetwork = "devnet" | "mainnet-beta" | "localnet";

/** Billetera académica custodial (tabla `student_wallets`). */
export interface StudentWallet {
  id: string;
  alumno_id: string;
  otec_id: string;
  wallet_address: string;
  encrypted_private_key: string;
  blockchain: string;
  network: string;
  provider: string;
  is_custodial: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export type StudentWalletInsert = Omit<StudentWallet, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export interface Curso {
  id: string;
  otec_id: string;
  codigo: string;
  nombre: string;
  horas: number;
  descripcion: string | null;
  linea_academica_id: string | null;
  programa_url: string | null;
  activo: boolean | null;
  created_at: string;
  updated_at: string;
  /** Presente cuando la consulta incluye la relación PostgREST. */
  lineas_academicas?: Pick<LineaAcademica, "id" | "nombre" | "descripcion" | "sitio_web" | "banner_url"> | null;
}

export type CursoInsert = Omit<Curso, "id" | "created_at" | "updated_at" | "activo"> & {
  id?: string;
  activo?: boolean | null;
  linea_academica_id?: string | null;
  programa_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CursoUpdate = Partial<Omit<CursoInsert, "otec_id">>;

/** Estados de la relación curso–alumno (inscripción). */
export type CursoAlumnoEstado = "inscrito" | "en_curso" | "finalizado" | "retirado";

export interface CursoAlumno {
  id: string;
  curso_id: string;
  alumno_id: string;
  otec_id: string;
  estado: CursoAlumnoEstado;
  nota: number | null;
  asistencia: number | null;
  aprobado: boolean;
  fecha_inscripcion: string;
  created_at: string;
  updated_at: string;
}

export type CursoAlumnoInsert = Omit<CursoAlumno, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CursoAlumnoUpdate = Partial<
  Pick<CursoAlumno, "estado" | "nota" | "asistencia" | "aprobado" | "fecha_inscripcion">
>;

/** Inscripción con datos del alumno (PostgREST). */
export interface CursoAlumnoConAlumno extends CursoAlumno {
  alumnos: Pick<Alumno, "id" | "nombre" | "apellido" | "rut" | "email"> | null;
}

export interface Certificado {
  id: string;
  otec_id: string;
  alumno_id: string;
  curso_id: string;
  hash_sha256: string;
  tx_hash: string | null;
  fecha_emision: string;
  fecha_fin: string | null;
  nota: string | null;
  estado: string | null;
  metadata: Json | null;
  token_id: string | null;
  contract_address: string | null;
  chain_id: number | null;
  ipfs_metadata_url: string | null;
  ipfs_image_url: string | null;
  ipfs_pdf_url: string | null;
  registry_tx_hash: string | null;
  registry_contract_address: string | null;
  registry_chain_id: number | null;
  nft_status: string | null;
  nft_issued_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  pdf_data: string | null;
  image_data: string | null;
  last_blockchain_error: string | null;
  blockchain_retry_count: number | null;
  mint_attempted_at: string | null;
  revoked_tx_hash: string | null;
  /** Billetera académica custodial que recibió la credencial on-chain (Metaplex token owner). */
  owner_student_wallet_id: string | null;
  /** Extensiones académicas (skills, competencias, categorías, logros) — Fase 5. */
  credential_extensions: Json;
  created_at: string;
  updated_at: string;
}

export type CertificadoInsert = Omit<
  Certificado,
  | "id"
  | "created_at"
  | "updated_at"
  | "tx_hash"
  | "metadata"
  | "token_id"
  | "contract_address"
  | "chain_id"
  | "ipfs_metadata_url"
  | "ipfs_image_url"
  | "ipfs_pdf_url"
  | "registry_tx_hash"
  | "registry_contract_address"
  | "registry_chain_id"
  | "nft_status"
  | "nft_issued_at"
  | "revoked_at"
  | "revocation_reason"
  | "pdf_data"
  | "image_data"
  | "last_blockchain_error"
  | "blockchain_retry_count"
  | "mint_attempted_at"
  | "revoked_tx_hash"
  | "owner_student_wallet_id"
  | "credential_extensions"
> & {
  id?: string;
  tx_hash?: string | null;
  metadata?: Json | null;
  token_id?: string | null;
  contract_address?: string | null;
  chain_id?: number | null;
  ipfs_metadata_url?: string | null;
  ipfs_image_url?: string | null;
  ipfs_pdf_url?: string | null;
  registry_tx_hash?: string | null;
  registry_contract_address?: string | null;
  registry_chain_id?: number | null;
  nft_status?: string | null;
  nft_issued_at?: string | null;
  revoked_at?: string | null;
  revocation_reason?: string | null;
  pdf_data?: string | null;
  image_data?: string | null;
  last_blockchain_error?: string | null;
  blockchain_retry_count?: number | null;
  mint_attempted_at?: string | null;
  revoked_tx_hash?: string | null;
  owner_student_wallet_id?: string | null;
  credential_extensions?: Json;
  created_at?: string;
  updated_at?: string;
};

export type CertificadoUpdate = Partial<
  Pick<
    Certificado,
    | "estado"
    | "tx_hash"
    | "metadata"
    | "token_id"
    | "contract_address"
    | "chain_id"
    | "ipfs_metadata_url"
    | "ipfs_image_url"
    | "ipfs_pdf_url"
    | "nft_status"
    | "nft_issued_at"
    | "last_blockchain_error"
    | "blockchain_retry_count"
    | "mint_attempted_at"
    | "fecha_emision"
    | "fecha_fin"
    | "nota"
    | "owner_student_wallet_id"
    | "credential_extensions"
  >
>;

export type InstitutionProfilePublic = Pick<
  InstitutionProfile,
  | "logo_url"
  | "primary_color"
  | "secondary_color"
  | "certificate_accent_color"
  | "issuer_display_name"
  | "signature_name"
  | "signature_role"
  | "signature_image_url"
  | "legal_text"
  | "show_blockchain_badge"
  | "website"
  | "description"
>;

/** Respuesta de consultas con joins (PostgREST). */
export interface CertificadoConDetalles extends Certificado {
  alumnos: { nombre: string; apellido: string; rut: string } | null;
  cursos: {
    nombre: string;
    codigo: string;
    horas: number;
    programa_url: string | null;
    linea_academica_id: string | null;
    lineas_academicas: {
      id: string;
      nombre: string;
      descripcion: string | null;
      sitio_web: string | null;
      banner_url: string | null;
    } | null;
  } | null;
  otec: {
    nombre: string;
    institution_profiles?: InstitutionProfilePublic | InstitutionProfilePublic[] | null;
  } | null;
}

/** Extrae perfil institucional anidado en join PostgREST (otec → institution_profiles). */
export function extractInstitutionProfileFromCert(
  cert: Pick<CertificadoConDetalles, "otec">
): InstitutionProfilePublic | null {
  const nested = cert.otec?.institution_profiles;
  if (!nested) return null;
  if (Array.isArray(nested)) return nested[0] ?? null;
  return nested;
}

export type CertilinkAuthUser = {
  id: string;
  email: string;
};
