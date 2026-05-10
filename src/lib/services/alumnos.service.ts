

import { supabase } from "@/lib/supabase";
import type { Alumno, AlumnoInsert, AlumnoUpdate } from "@/lib/database.types";

export const alumnosService = {
  /** Fetch all students for the current OTEC */
  async getAll(otecId: string): Promise<Alumno[]> {
    const { data, error } = await supabase
      .from("alumnos")
      .select("*")
      .eq("otec_id", otecId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /** Get a single student by ID */
  async getById(id: string): Promise<Alumno> {
    const { data, error } = await supabase
      .from("alumnos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  /** Create a new student */
  async create(alumno: AlumnoInsert): Promise<Alumno> {
    const { data, error } = await supabase
      .from("alumnos")
      .insert(alumno)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Update a student */
  async update(id: string, alumno: AlumnoUpdate): Promise<Alumno> {
    const { data, error } = await supabase
      .from("alumnos")
      .update(alumno)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Delete a student */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("alumnos")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /** Count students for dashboard */
  async count(otecId: string): Promise<number> {
    const { count, error } = await supabase
      .from("alumnos")
      .select("*", { count: "exact", head: true })
      .eq("otec_id", otecId);

    if (error) throw error;
    return count ?? 0;
  },
};