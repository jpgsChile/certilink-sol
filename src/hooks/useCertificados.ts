

import { useState, useEffect, useCallback } from "react";
import { certificadosService } from "@/lib/services/certificados.service";
import { useAuth } from "@/hooks/useAuth";
import type { CertificadoConDetalles } from "@/lib/database.types";

export function useCertificados() {
  const { otec } = useAuth();
  const [certificados, setCertificados] = useState<CertificadoConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificados = useCallback(async () => {
    if (!otec) return;
    setLoading(true);
    setError(null);
    try {
      const data = await certificadosService.getAll(otec.id);
      setCertificados(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar certificados";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [otec]);

  useEffect(() => {
    fetchCertificados();
  }, [fetchCertificados]);

  const issueCertificado = async (
    alumnoId: string,
    cursoId: string,
    fechaEmision?: string
  ): Promise<CertificadoConDetalles> => {
    if (!otec) throw new Error("OTEC no encontrado");
    const created = await certificadosService.create(
      otec.id,
      alumnoId,
      cursoId,
      fechaEmision
    );
    setCertificados((prev) => [created, ...prev]);
    return created;
  };

  const deleteCertificado = async (id: string): Promise<void> => {
    await certificadosService.remove(id);
    setCertificados((prev) => prev.filter((c) => c.id !== id));
  };

  const emitidosCount = certificados.filter((c) => Boolean(c.tx_hash)).length;
  const pendientesCount = certificados.filter((c) => !c.tx_hash).length;

  return {
    certificados,
    loading,
    error,
    refetch: fetchCertificados,
    issueCertificado,
    deleteCertificado,
    emitidosCount,
    pendientesCount,
  };
}