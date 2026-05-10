

import { useState, useEffect, useCallback } from "react";
import { cursosService } from "@/lib/services/cursos.service";
import { useAuth } from "@/hooks/useAuth";
import type { Curso, CursoInsert, CursoUpdate } from "@/lib/database.types";

export function useCursos() {
  const { otec } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCursos = useCallback(async () => {
    if (!otec) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cursosService.getAll(otec.id);
      setCursos(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar cursos";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [otec]);

  useEffect(() => {
    fetchCursos();
  }, [fetchCursos]);

  const createCurso = async (
    curso: Omit<CursoInsert, "otec_id">
  ): Promise<Curso> => {
    if (!otec) throw new Error("OTEC no encontrado");
    const created = await cursosService.create({ ...curso, otec_id: otec.id });
    setCursos((prev) => [created, ...prev]);
    return created;
  };

  const updateCurso = async (
    id: string,
    curso: CursoUpdate
  ): Promise<Curso> => {
    const updated = await cursosService.update(id, curso);
    setCursos((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCurso = async (id: string): Promise<void> => {
    await cursosService.remove(id);
    setCursos((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    cursos,
    loading,
    error,
    refetch: fetchCursos,
    createCurso,
    updateCurso,
    deleteCurso,
  };
}