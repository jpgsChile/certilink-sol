
import { useState, useEffect, useCallback } from "react";
import { alumnosService } from "@/lib/services/alumnos.service";
import { useAuth } from "@/hooks/useAuth";
import type { Alumno, AlumnoInsert, AlumnoUpdate } from "@/lib/database.types";

export function useAlumnos() {
  const { otec } = useAuth();
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlumnos = useCallback(async () => {
    if (!otec) return;
    setLoading(true);
    setError(null);
    try {
      const data = await alumnosService.getAll(otec.id);
      setAlumnos(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar estudiantes";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [otec]);

  useEffect(() => {
    fetchAlumnos();
  }, [fetchAlumnos]);

  const createAlumno = async (
    alumno: Omit<AlumnoInsert, "otec_id">
  ): Promise<Alumno> => {
    if (!otec) throw new Error("OTEC no encontrado");
    const created = await alumnosService.create({ ...alumno, otec_id: otec.id });
    setAlumnos((prev) => [created, ...prev]);
    return created;
  };

  const updateAlumno = async (
    id: string,
    alumno: AlumnoUpdate
  ): Promise<Alumno> => {
    const updated = await alumnosService.update(id, alumno);
    setAlumnos((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  };

  const deleteAlumno = async (id: string): Promise<void> => {
    await alumnosService.remove(id);
    setAlumnos((prev) => prev.filter((a) => a.id !== id));
  };

  return {
    alumnos,
    loading,
    error,
    refetch: fetchAlumnos,
    createAlumno,
    updateAlumno,
    deleteAlumno,
  };
}