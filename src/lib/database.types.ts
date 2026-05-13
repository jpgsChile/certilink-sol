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

export interface Curso {
  id: string;
  otec_id: string;
  codigo: string;
  nombre: string;
  horas: number;
  descripcion: string | null;
  activo: boolean | null;
  created_at: string;
  updated_at: string;
}

export type CursoInsert = Omit<Curso, "id" | "created_at" | "updated_at" | "activo"> & {
  id?: string;
  activo?: boolean | null;
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
    | "fecha_fin"
    | "nota"
  >
>;

/** Respuesta de consultas con joins (PostgREST). */
export interface CertificadoConDetalles extends Certificado {
  alumnos: { nombre: string; apellido: string; rut: string } | null;
  cursos: { nombre: string; codigo: string; horas: number } | null;
  otec: { nombre: string } | null;
}

export type CertilinkAuthUser = {
  id: string;
  email: string;
};
