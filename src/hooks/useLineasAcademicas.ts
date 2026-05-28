import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { lineasAcademicasService } from "@/lib/services/lineas_academicas.service";
import type { LineaAcademica, LineaAcademicaInsert, LineaAcademicaUpdate } from "@/lib/database.types";

export function useLineasAcademicas() {
  const { otec } = useAuth();
  const [lineas, setLineas] = useState<LineaAcademica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLineas = useCallback(async () => {
    if (!otec?.id) {
      setLineas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await lineasAcademicasService.getAll(otec.id);
      setLineas(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar líneas académicas";
      setError(msg);
      setLineas([]);
    } finally {
      setLoading(false);
    }
  }, [otec?.id]);

  useEffect(() => {
    void fetchLineas();
  }, [fetchLineas]);

  const createLinea = async (row: Omit<LineaAcademicaInsert, "otec_id">) => {
    if (!otec) throw new Error("Sesión no válida");
    const created = await lineasAcademicasService.create({ ...row, otec_id: otec.id });
    setLineas((prev) => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
    return created;
  };

  const updateLinea = async (id: string, patch: LineaAcademicaUpdate) => {
    if (!otec) throw new Error("Sesión no válida");
    const updated = await lineasAcademicasService.update(id, patch, otec.id);
    setLineas((prev) => prev.map((l) => (l.id === id ? updated : l)).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
    return updated;
  };

  const deleteLinea = async (id: string) => {
    if (!otec) throw new Error("Sesión no válida");
    await lineasAcademicasService.remove(id, otec.id);
    setLineas((prev) => prev.filter((l) => l.id !== id));
  };

  return { lineas, loading, error, refetch: fetchLineas, createLinea, updateLinea, deleteLinea };
}
