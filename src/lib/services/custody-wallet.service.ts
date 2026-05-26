import { supabase } from "@/lib/supabase";

export type CustodyEnsureResponse = {
  ok: boolean;
  public_key?: string;
  student_wallet_id?: string;
  created?: boolean;
  error?: string;
  detail?: string;
};

export function isCustodyEdgeEnabled(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_EDGE_WALLET_INVOKER_SECRET?.trim()
  );
}

/**
 * Orquesta custodia en Edge: generación/cifrado en servidor, sin exponer clave en el bundle AES.
 */
export async function invokeStudentWalletCustody(params: {
  otec_id: string;
  alumno_id: string;
  legacy_secret_bs58?: string | null;
}): Promise<{ public_key: string; student_wallet_id: string; created: boolean }> {
  const invoker = import.meta.env.VITE_EDGE_WALLET_INVOKER_SECRET?.trim();
  if (!invoker) {
    throw new Error("Configure VITE_EDGE_WALLET_INVOKER_SECRET y despliegue la función student-wallet-custody.");
  }

  const { data, error } = await supabase.functions.invoke<CustodyEnsureResponse>("student-wallet-custody", {
    body: {
      action: "ensure",
      otec_id: params.otec_id,
      alumno_id: params.alumno_id,
      legacy_secret_bs58: params.legacy_secret_bs58 ?? undefined,
    },
    headers: {
      "x-certilink-custody-secret": invoker,
    },
  });

  if (error) {
    throw new Error(error.message || "Error al invocar custodia Edge");
  }

  if (!data || data.ok === false) {
    const msg = data?.error ?? "custody_unknown_error";
    const detail = data?.detail ? ` (${data.detail})` : "";
    throw new Error(`${msg}${detail}`);
  }

  if (!data.public_key || !data.student_wallet_id) {
    throw new Error("Respuesta custodia incompleta");
  }

  return {
    public_key: data.public_key,
    student_wallet_id: data.student_wallet_id,
    created: Boolean(data.created),
  };
}
