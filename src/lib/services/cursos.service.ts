import { supabase } from "@/lib/supabase";
import type { Curso, CursoInsert, CursoUpdate } from "@/lib/database.types";

export const cursosService = {
  async getAll(otecId: string): Promise<Curso[]> {
    const { data, error } = await supabase
      .from("cursos")
      .select("*")
      .eq("otec_id", otecId)
      .or("activo.eq.true,activo.is.null")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<Curso> {
    const { data, error } = await supabase.from("cursos").select("*").eq("id", id).single();

    if (error) throw error;
    return data;
  },

  async create(curso: CursoInsert): Promise<Curso> {
    const payload: CursoInsert = {
      ...curso,
      activo: curso.activo ?? true,
    };

    const { data, error } = await supabase.from("cursos").insert(payload).select().single();

    if (error) throw error;
    return data;
  },

  async update(id: string, curso: CursoUpdate): Promise<Curso> {
    const { data, error } = await supabase.from("cursos").update(curso).eq("id", id).select().single();

    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("cursos").delete().eq("id", id);

    if (error) throw error;
  },

  async count(otecId: string): Promise<number> {
    const { count, error } = await supabase
      .from("cursos")
      .select("*", { count: "exact", head: true })
      .eq("otec_id", otecId);

    if (error) throw error;
    return count ?? 0;
  },
};
