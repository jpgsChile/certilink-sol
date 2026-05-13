import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { supabase } from "@/lib/supabase";

export interface StudentWallet {
  publicKey: string;
  secretKeyEncoded: string;
}

const alumnoSecretStorageKey = (alumnoId: string) => `certilink.alumno.sk.${alumnoId}`;

function readSessionSecret(alumnoId: string): string | null {
  try {
    return typeof sessionStorage !== "undefined" ? sessionStorage.getItem(alumnoSecretStorageKey(alumnoId)) : null;
  } catch {
    return null;
  }
}

function writeSessionSecret(alumnoId: string, secretKeyEncoded: string): void {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(alumnoSecretStorageKey(alumnoId), secretKeyEncoded);
    }
  } catch {
    throw new Error(
      "El navegador no permitió guardar la clave de sesión del perfil digital del estudiante (p. ej. modo privado). Use una ventana normal o permita almacenamiento para este sitio."
    );
  }
}

function formatDbError(prefix: string, err: { message?: string; code?: string } | null): string {
  if (!err?.message) return prefix;
  const code = err.code ?? "";
  const msg = err.message;

  if (code === "22001" || msg.includes("character varying") || msg.includes("value too long")) {
    return [
      `${prefix}.`,
      "La dirección de billetera no cabe en la columna actual de la base de datos (límite demasiado corto para Solana).",
      "Solución: ejecute en Supabase el script supabase/sql/013_alter_otec_wallet_address_length.sql y vuelva a intentar.",
    ].join("\n");
  }

  return `${prefix}\n\n${msg}${code ? `\n(Código: ${code})` : ""}`;
}

export function generateStudentWallet(): StudentWallet {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKeyEncoded: bs58.encode(keypair.secretKey),
  };
}

export function restoreKeypair(secretKeyEncoded: string): Keypair {
  const secretKey = bs58.decode(secretKeyEncoded);
  return Keypair.fromSecretKey(secretKey);
}

/**
 * Garantiza clave Solana para el alumno: persiste `wallet_address` en BD y el secreto en sessionStorage
 * (el esquema de producción no incluye columna para secret; no exponer en filas públicas).
 */
export async function ensureStudentWallet(alumnoId: string): Promise<{
  publicKey: string;
  keypair: Keypair;
}> {
  const { data: alumno, error: fetchError } = await supabase
    .from("alumnos")
    .select("wallet_address")
    .eq("id", alumnoId)
    .single();

  if (fetchError) throw new Error(formatDbError("Error al obtener datos del estudiante", fetchError));

  const storedSecret = readSessionSecret(alumnoId);

  if (alumno.wallet_address && storedSecret) {
    const keypair = restoreKeypair(storedSecret);
    if (keypair.publicKey.toBase58() === alumno.wallet_address) {
      return { publicKey: alumno.wallet_address, keypair };
    }
  }

  const wallet = generateStudentWallet();
  writeSessionSecret(alumnoId, wallet.secretKeyEncoded);

  const { error: updateError } = await supabase
    .from("alumnos")
    .update({
      wallet_address: wallet.publicKey,
    })
    .eq("id", alumnoId);

  if (updateError) throw new Error(formatDbError("Error al guardar perfil digital del estudiante", updateError));

  const keypair = restoreKeypair(wallet.secretKeyEncoded);
  return { publicKey: wallet.publicKey, keypair };
}

/**
 * Guarda la billetera institucional vía RPC (evita RLS que bloquea UPDATE directo con anon).
 */
export async function saveOtecWallet(otecId: string, walletAddress: string): Promise<void> {
  const { error } = await supabase.rpc("certilink_otec_update_wallet", {
    p_otec_id: otecId,
    p_wallet_address: walletAddress,
  });

  if (error) {
    throw new Error(formatDbError("Error al guardar dirección institucional", error));
  }
}

/**
 * Lee la billetera guardada vía RPC (si SELECT directo falla por RLS).
 */
export async function getOtecWallet(otecId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("certilink_otec_get_wallet", { p_otec_id: otecId });

  if (error) return null;
  if (data == null || data === "") return null;
  return String(data);
}
