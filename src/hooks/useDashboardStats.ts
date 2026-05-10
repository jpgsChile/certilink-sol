

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { alumnosService } from "@/lib/services/alumnos.service";
import { cursosService } from "@/lib/services/cursos.service";
import { certificadosService } from "@/lib/services/certificados.service";
import type { CertificadoConDetalles } from "@/lib/database.types";

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalCertificates: number;
  emitidosCount: number;
  recentCertificates: CertificadoConDetalles[];
}

export function useDashboardStats() {
  const { otec } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalCertificates: 0,
    emitidosCount: 0,
    recentCertificates: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!otec) return;
    setLoading(true);
    setError(null);
    try {
      const [students, courses, totalCerts, emitidos, certs] = await Promise.all([
        alumnosService.count(otec.id),
        cursosService.count(otec.id),
        certificadosService.count(otec.id),
        certificadosService.count(otec.id, "emitido"),
        certificadosService.getAll(otec.id),
      ]);
      setStats({
        totalStudents: students,
        totalCourses: courses,
        totalCertificates: totalCerts,
        emitidosCount: emitidos,
        recentCertificates: certs.slice(0, 5),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar estadísticas";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [otec]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}