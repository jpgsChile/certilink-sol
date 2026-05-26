import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { studentWalletsService } from "@/lib/services/student-wallets.service";
import { getStudentWalletNetwork } from "@/lib/solana/wallet.service";
import type { StudentWallet } from "@/lib/database.types";

export type UseStudentWalletReturn = {
  /** Fila activa en `student_wallets` (sin material cifrado expuesto). */
  wallet: StudentWallet | null;
  loading: boolean;
  error: string | null;
  network: ReturnType<typeof getStudentWalletNetwork>;
  refetch: () => Promise<void>;
  hasActiveWallet: boolean;
};

/**
 * Estado de la billetera académica custodial de un estudiante (lectura).
 * La creación material ocurre en emisión verificada vía `ensureStudentWallet`.
 */
export function useStudentWallet(alumnoId: string | null | undefined): UseStudentWalletReturn {
  const { otec } = useAuth();
  const id = alumnoId?.trim() || null;
  const network = getStudentWalletNetwork();

  const [wallet, setWallet] = useState<StudentWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!id || !otec) {
      setWallet(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await studentWalletsService.getActiveByAlumno(id, network);
      setWallet(row);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al cargar billetera académica";
      setError(msg);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [id, otec, network]);

  useEffect(() => {
    void fetchWallet();
  }, [fetchWallet]);

  return {
    wallet,
    loading,
    error,
    network,
    refetch: fetchWallet,
    hasActiveWallet: Boolean(wallet?.id && wallet.status === "active"),
  };
}
