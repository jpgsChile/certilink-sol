import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { alumnosService } from "@/lib/services/alumnos.service";
import { certificadosService } from "@/lib/services/certificados.service";
import type { Alumno, CertificadoConDetalles } from "@/lib/database.types";

export type StudentAcademicIdentityState = {
  alumno: Alumno | null;
  certificados: CertificadoConDetalles[];
  loading: boolean;
  error: string | null;
  forbidden: boolean;
};

/**
 * Perfil de identidad académica de un estudiante dentro del tenant OTEC (sesión institucional).
 */
export function useStudentAcademicIdentity(alumnoId: string | undefined): StudentAcademicIdentityState & {
  refetch: () => Promise<void>;
} {
  const { otec } = useAuth();
  const id = alumnoId?.trim();

  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [certificados, setCertificados] = useState<CertificadoConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!otec || !id) {
      setAlumno(null);
      setCertificados([]);
      setForbidden(false);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setForbidden(false);

    try {
      const a = await alumnosService.getById(id);
      if (a.otec_id !== otec.id) {
        setForbidden(true);
        setAlumno(null);
        setCertificados([]);
        return;
      }
      setAlumno(a);
      const certs = await certificadosService.getByAlumno(otec.id, id);
      setCertificados(certs);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al cargar la identidad académica";
      setError(msg);
      setAlumno(null);
      setCertificados([]);
    } finally {
      setLoading(false);
    }
  }, [otec, id]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return { alumno, certificados, loading, error, forbidden, refetch: fetchAll };
}
