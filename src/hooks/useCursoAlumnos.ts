import { useState, useEffect, useCallback } from "react";
import { cursoAlumnosService } from "@/lib/services/curso-alumnos.service";
import { useAuth } from "@/hooks/useAuth";
import type { CursoAlumnoConAlumno, CursoAlumnoInsert, CursoAlumnoUpdate } from "@/lib/database.types";

export function useCursoAlumnos(cursoId: string | null) {
  const { otec } = useAuth();
  const otecId = otec?.id ?? null;
  const [inscripciones, setInscripciones] = useState<CursoAlumnoConAlumno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!cursoId || !otecId) {
      setInscripciones([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await cursoAlumnosService.listByCurso(otecId, cursoId);
      setInscripciones(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar inscripciones";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [cursoId, otecId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const enroll = async (row: CursoAlumnoInsert): Promise<CursoAlumnoConAlumno> => {
    const created = await cursoAlumnosService.create(row);
    setInscripciones((prev) => [created, ...prev]);
    return created;
  };

  const patchInscripcion = async (id: string, patch: CursoAlumnoUpdate): Promise<CursoAlumnoConAlumno> => {
    if (!otecId) throw new Error("OTEC no encontrado");
    const updated = await cursoAlumnosService.update(otecId, id, patch);
    setInscripciones((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  };

  const removeInscripcion = async (id: string): Promise<void> => {
    if (!otecId) throw new Error("OTEC no encontrado");
    await cursoAlumnosService.remove(otecId, id);
    setInscripciones((prev) => prev.filter((r) => r.id !== id));
  };

  return {
    inscripciones,
    loading,
    error,
    refetch,
    enroll,
    patchInscripcion,
    removeInscripcion,
  };
}
