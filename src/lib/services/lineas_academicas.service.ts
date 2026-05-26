import { supabase } from "@/lib/supabase";
import type { LineaAcademica, LineaAcademicaInsert, LineaAcademicaUpdate } from "@/lib/database.types";

export const lineasAcademicasService = {
  async getAll(otecId: string): Promise<LineaAcademica[]> {
    const { data, error } = await supabase
      .from("lineas_academicas")
      .select("*")
      .eq("otec_id", otecId)
      .order("nombre", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async create(row: LineaAcademicaInsert): Promise<LineaAcademica> {
    const { data, error } = await supabase.from("lineas_academicas").insert(row).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, patch: LineaAcademicaUpdate): Promise<LineaAcademica> {
    const { data, error } = await supabase.from("lineas_academicas").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("lineas_academicas").delete().eq("id", id);
    if (error) throw error;
  },
};
