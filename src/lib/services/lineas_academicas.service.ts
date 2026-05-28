import { supabase } from "@/lib/supabase";
import { formatSupabaseUserError } from "@/lib/supabase-error";
import type { LineaAcademica, LineaAcademicaInsert, LineaAcademicaUpdate } from "@/lib/database.types";

function parseJsonbRows(data: unknown): LineaAcademica[] {
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
  } else if (typeof data === "object") {
    return [data as LineaAcademica];
  }
  return raw.filter(Boolean) as LineaAcademica[];
}

function parseJsonbRow(data: unknown): LineaAcademica | null {
  if (data == null) return null;
  if (typeof data === "object" && !Array.isArray(data)) return data as LineaAcademica;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as LineaAcademica;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function patchToRpcJson(patch: LineaAcademicaUpdate): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (patch.nombre !== undefined) o.nombre = patch.nombre;
  if (patch.descripcion !== undefined) o.descripcion = patch.descripcion;
  if (patch.sitio_web !== undefined) o.sitio_web = patch.sitio_web;
  if (patch.banner_url !== undefined) o.banner_url = patch.banner_url;
  return o;
}

function rpcMissingHint(err: unknown): never {
  const msg = formatSupabaseUserError(err).toLowerCase();
  if (
    msg.includes("certilink_lineas_academicas") ||
    msg.includes("could not find") ||
    msg.includes("schema cache") ||
    msg.includes("pgrst202")
  ) {
    throw new Error(
      "Funciones RPC de líneas académicas no disponibles. Ejecute supabase/sql/026_lineas_academicas_rpc.sql en Supabase SQL Editor."
    );
  }
  throw err instanceof Error ? err : new Error(formatSupabaseUserError(err));
}

/**
 * Líneas académicas vía RPC SECURITY DEFINER.
 * El login institucional (certilink_otec_login) no establece JWT → RLS con auth.uid() no aplica al rol anon.
 */
export const lineasAcademicasService = {
  async getAll(otecId: string): Promise<LineaAcademica[]> {
    const { data, error } = await supabase.rpc("certilink_lineas_academicas_list", {
      p_otec_id: otecId,
    });

    if (error) rpcMissingHint(error);
    return parseJsonbRows(data);
  },

  async create(row: LineaAcademicaInsert): Promise<LineaAcademica> {
    const { data, error } = await supabase.rpc("certilink_lineas_academicas_create", {
      p_otec_id: row.otec_id,
      p_nombre: row.nombre,
      p_descripcion: row.descripcion ?? null,
      p_sitio_web: row.sitio_web ?? null,
      p_banner_url: row.banner_url ?? null,
    });

    if (error) rpcMissingHint(error);
    const created = parseJsonbRow(data);
    if (!created) throw new Error("No se pudo crear la línea académica");
    return created;
  },

  async update(id: string, patch: LineaAcademicaUpdate, otecId: string): Promise<LineaAcademica> {
    const rpcPatch = patchToRpcJson(patch);
    const { data, error } = await supabase.rpc("certilink_lineas_academicas_update", {
      p_otec_id: otecId,
      p_linea_id: id,
      p_patch: rpcPatch,
    });

    if (error) rpcMissingHint(error);
    const updated = parseJsonbRow(data);
    if (!updated) throw new Error("No se pudo actualizar la línea académica");
    return updated;
  },

  async remove(id: string, otecId: string): Promise<void> {
    const { error } = await supabase.rpc("certilink_lineas_academicas_delete", {
      p_otec_id: otecId,
      p_linea_id: id,
    });

    if (error) rpcMissingHint(error);
  },
};
