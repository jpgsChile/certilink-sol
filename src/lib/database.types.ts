/** Supabase schema types for CertiLink (manual — replace with generated types when syncing DB). */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Otec {
  id: string;
  user_id: string;
  nombre: string;
  wallet_address: string | null;
  created_at: string;
}

export type OtecInsert = {
  id?: string;
  user_id: string;
  nombre: string;
  wallet_address?: string | null;
  created_at?: string;
};

export type OtecUpdate = Partial<OtecInsert>;

export interface Alumno {
  id: string;
  otec_id: string;
  nombre: string;
  apellido: string;
  rut: string;
  email: string | null;
  telefono: string | null;
  wallet_address: string | null;
  wallet_secret_encrypted: string | null;
  created_at: string;
}

export type AlumnoInsert = {
  id?: string;
  otec_id: string;
  nombre: string;
  apellido: string;
  rut: string;
  email?: string | null;
  telefono?: string | null;
  wallet_address?: string | null;
  wallet_secret_encrypted?: string | null;
  created_at?: string;
};

export type AlumnoUpdate = Partial<Omit<AlumnoInsert, "otec_id">>;

export interface Curso {
  id: string;
  otec_id: string;
  codigo: string;
  nombre: string;
  horas: number;
  descripcion: string | null;
  created_at: string;
}

export type CursoInsert = {
  id?: string;
  otec_id: string;
  codigo: string;
  nombre: string;
  horas: number;
  descripcion?: string | null;
  created_at?: string;
};

export type CursoUpdate = Partial<Omit<CursoInsert, "otec_id">>;

export interface Certificado {
  id: string;
  alumno_id: string;
  curso_id: string;
  otec_id: string;
  hash_sha256: string;
  fecha_emision: string;
  estado: string;
  tx_hash: string | null;
  mint_address: string | null;
  metadata_uri: string | null;
  explorer_url: string | null;
  codigo_verificacion: string | null;
  created_at: string;
}

export type CertificadoInsert = {
  id?: string;
  alumno_id: string;
  curso_id: string;
  otec_id: string;
  hash_sha256: string;
  fecha_emision: string;
  estado?: string;
  tx_hash?: string | null;
  mint_address?: string | null;
  metadata_uri?: string | null;
  explorer_url?: string | null;
  codigo_verificacion?: string | null;
  created_at?: string;
};

export type CertificadoUpdate = Partial<
  Pick<Certificado, "estado" | "tx_hash" | "mint_address" | "metadata_uri" | "explorer_url">
>;

export interface CertificadoConDetalles extends Certificado {
  alumnos: { nombre: string; apellido: string; rut: string } | null;
  cursos: { nombre: string; codigo: string; horas: number } | null;
  otecs: { nombre: string } | null;
}

export type Database = {
  public: {
    Tables: {
      otecs: {
        Row: Otec;
        Insert: OtecInsert;
        Update: OtecUpdate;
        Relationships: [];
      };
      alumnos: {
        Row: Alumno;
        Insert: AlumnoInsert;
        Update: AlumnoUpdate;
        Relationships: [];
      };
      cursos: {
        Row: Curso;
        Insert: CursoInsert;
        Update: CursoUpdate;
        Relationships: [];
      };
      certificados: {
        Row: Certificado;
        Insert: CertificadoInsert;
        Update: CertificadoUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
