import { supabase } from "@/lib/supabase";
import type {
  CursoAlumno,
  CursoAlumnoConAlumno,
  CursoAlumnoInsert,
  CursoAlumnoUpdate,
} from "@/lib/database.types";

function normalizeRow(row: CursoAlumnoConAlumno): CursoAlumnoConAlumno {
  const a = row.aprobado as unknown;
  const aprobado = a === true || a === "true" || a === "t";
  return { ...row, aprobado };
}

function parseJsonbRows(data: unknown): CursoAlumnoConAlumno[] {
  if (data == null) return [];
  let raw: unknown[] = [];
  if (Array.isArray(data)) raw = data;
  else if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      if (Array.isArray(parsed)) raw = parsed;
    } catch {
      return [];
    }
  }
  return (raw as CursoAlumnoConAlumno[]).map((r) => normalizeRow(r));
}

function parseJsonbRow(data: unknown): CursoAlumnoConAlumno | null {
  if (data == null) return null;
  if (typeof data === "object" && !Array.isArray(data)) return normalizeRow(data as CursoAlumnoConAlumno);
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return normalizeRow(parsed as CursoAlumnoConAlumno);
      }
    } catch {
      return null;
    }
  }
  return null;
}

function patchToRpcJson(patch: CursoAlumnoUpdate): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (patch.estado !== undefined) o.estado = patch.estado;
  if (patch.nota !== undefined) o.nota = patch.nota;
  if (patch.asistencia !== undefined) o.asistencia = patch.asistencia;
  if (patch.aprobado !== undefined) o.aprobado = patch.aprobado;
  if (patch.fecha_inscripcion !== undefined) o.fecha_inscripcion = patch.fecha_inscripcion;
  return o;
}

/**
 * Inscripciones curso–alumno vía RPC SECURITY DEFINER.
 * El login institucional (certilink_otec_login) no establece JWT → RLS con auth.uid() no aplica al rol anon.
 */
export const cursoAlumnosService = {
  async listByCurso(otecId: string, cursoId: string): Promise<CursoAlumnoConAlumno[]> {
    const { data, error } = await supabase.rpc("certilink_curso_alumnos_list", {
      p_otec_id: otecId,
      p_curso_id: cursoId,
      p_solo_aprobados: false,
    });

    if (error) throw error;
    return parseJsonbRows(data);
  },

  async listApprovedByCurso(otecId: string, cursoId: string): Promise<CursoAlumnoConAlumno[]> {
    const { data, error } = await supabase.rpc("certilink_curso_alumnos_list", {
      p_otec_id: otecId,
      p_curso_id: cursoId,
      p_solo_aprobados: true,
    });

    if (error) throw error;
    return parseJsonbRows(data);
  },

  async getApprovedEnrollment(otecId: string, cursoId: string, alumnoId: string): Promise<CursoAlumno | null> {
    const { data, error } = await supabase.rpc("certilink_curso_alumnos_get_aprobado", {
      p_otec_id: otecId,
      p_curso_id: cursoId,
      p_alumno_id: alumnoId,
    });

    if (error) throw error;
    const row = parseJsonbRow(data);
    return row as CursoAlumno | null;
  },

  async create(row: CursoAlumnoInsert): Promise<CursoAlumnoConAlumno> {
    const { data, error } = await supabase.rpc("certilink_curso_alumnos_enroll", {
      p_otec_id: row.otec_id,
      p_curso_id: row.curso_id,
      p_alumno_id: row.alumno_id,
    });

    if (error) throw error;
    const created = parseJsonbRow(data);
    if (!created) throw new Error("La inscripción no devolvió datos");
    return created;
  },

  async update(otecId: string, id: string, patch: CursoAlumnoUpdate): Promise<CursoAlumnoConAlumno> {
    const { data, error } = await supabase.rpc("certilink_curso_alumnos_update", {
      p_otec_id: otecId,
      p_id: id,
      p_patch: patchToRpcJson(patch),
    });

    if (error) throw error;
    const updated = parseJsonbRow(data);
    if (!updated) throw new Error("La actualización no devolvió datos");
    return updated;
  },

  async remove(otecId: string, id: string): Promise<void> {
    const { error } = await supabase.rpc("certilink_curso_alumnos_delete", {
      p_otec_id: otecId,
      p_id: id,
    });

    if (error) throw error;
  },
};
