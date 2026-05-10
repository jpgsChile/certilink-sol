

import { supabase } from "@/lib/supabase";
import type { Curso, CursoInsert, CursoUpdate } from "@/lib/database.types";

export const cursosService = {
  /** Fetch all courses for the current OTEC */
  async getAll(otecId: string): Promise<Curso[]> {
    const { data, error } = await supabase
      .from("cursos")
      .select("*")
      .eq("otec_id", otecId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /** Get a single course by ID */
  async getById(id: string): Promise<Curso> {
    const { data, error } = await supabase
      .from("cursos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  /** Create a new course */
  async create(curso: CursoInsert): Promise<Curso> {
    const { data, error } = await supabase
      .from("cursos")
      .insert(curso)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Update a course */
  async update(id: string, curso: CursoUpdate): Promise<Curso> {
    const { data, error } = await supabase
      .from("cursos")
      .update(curso)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Delete a course */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("cursos")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /** Count courses for dashboard */
  async count(otecId: string): Promise<number> {
    const { count, error } = await supabase
      .from("cursos")
      .select("*", { count: "exact", head: true })
      .eq("otec_id", otecId);

    if (error) throw error;
    return count ?? 0;
  },
};