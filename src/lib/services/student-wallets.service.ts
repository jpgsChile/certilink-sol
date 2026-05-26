import { supabase } from "@/lib/supabase";
import type { StudentWallet, StudentWalletInsert, StudentWalletNetwork } from "@/lib/database.types";

function formatError(prefix: string, err: { message?: string; code?: string } | null): string {
  if (!err?.message) return prefix;
  return `${prefix}: ${err.message}${err.code ? ` (${err.code})` : ""}`;
}

async function getActiveByAlumno(alumnoId: string, network: StudentWalletNetwork): Promise<StudentWallet | null> {
  const { data, error } = await supabase
    .from("student_wallets")
    .select("*")
    .eq("alumno_id", alumnoId)
    .eq("network", network)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(formatError("Error al leer billetera académica", error));
  return data as StudentWallet | null;
}

export const studentWalletsService = {
  getActiveByAlumno,

  async insertActive(row: StudentWalletInsert): Promise<StudentWallet> {
    const { data, error } = await supabase.from("student_wallets").insert(row).select("*").single();

    if (error) {
      if (error.code === "23505") {
        const existing = await getActiveByAlumno(row.alumno_id, row.network as StudentWalletNetwork);
        if (existing) return existing;
      }
      throw new Error(formatError("Error al crear billetera académica", error));
    }
    return data as StudentWallet;
  },
};
