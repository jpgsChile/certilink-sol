import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { supabase } from "@/lib/supabase";
import { studentWalletsService, encryptWalletPrivateMaterial, decryptWalletPrivateMaterial } from "@/lib/services/wallet.service";
import { invokeStudentWalletCustody, isCustodyEdgeEnabled } from "@/lib/services/custody-wallet.service";
import type { StudentWalletNetwork } from "@/lib/database.types";
import { SOLANA_NETWORK } from "./config";

export interface StudentWalletKeyMaterial {
  publicKey: string;
  secretKeyEncoded: string;
}

const alumnoSecretStorageKey = (alumnoId: string) => `certilink.alumno.sk.${alumnoId}`;

/** Red alineada con `student_wallets.network` y `SOLANA_NETWORK`. */
export function getStudentWalletNetwork(): StudentWalletNetwork {
  if (SOLANA_NETWORK === "mainnet-beta") return "mainnet-beta";
  if (SOLANA_NETWORK === "localnet") return "localnet";
  return "devnet";
}

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
    /* cache opcional: solo modo legacy sin Edge */
  }
}

function clearSessionSecret(alumnoId: string): void {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(alumnoSecretStorageKey(alumnoId));
    }
  } catch {
    /* noop */
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

export function generateStudentWallet(): StudentWalletKeyMaterial {
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

export type EnsureStudentWalletResult = {
  publicKey: string;
  /** Fila `student_wallets` cuando existe o se creó en esta operación. */
  studentWalletId: string | null;
  /**
   * Solo presente en modo legacy (cifrado en navegador / sin Edge custodia).
   * El flujo Metaplex actual solo requiere `publicKey` como token owner.
   */
  keypair?: Keypair;
};

/**
 * Garantiza clave Solana custodial para el alumno.
 *
 * - Con **custodia Edge** (`VITE_EDGE_WALLET_INVOKER_SECRET`): generación/cifrado en servidor; el navegador no descifra ni genera claves.
 * - Sin Edge: comportamiento legacy (cifrado en cliente + opcional sessionStorage).
 */
export async function ensureStudentWallet(alumnoId: string): Promise<EnsureStudentWalletResult> {
  const network = getStudentWalletNetwork();
  const edge = isCustodyEdgeEnabled();

  const { data: alumno, error: fetchError } = await supabase
    .from("alumnos")
    .select("wallet_address, otec_id")
    .eq("id", alumnoId)
    .single();

  if (fetchError) throw new Error(formatDbError("Error al obtener datos del estudiante", fetchError));

  const row = await studentWalletsService.getActiveByAlumno(alumnoId, network).catch(() => null);

  if (row) {
    if (edge) {
      if (alumno.wallet_address !== row.wallet_address) {
        const { error: syncErr } = await supabase.from("alumnos").update({ wallet_address: row.wallet_address }).eq("id", alumnoId);
        if (syncErr) throw new Error(formatDbError("Error al sincronizar perfil digital del estudiante", syncErr));
      }
      return { publicKey: row.wallet_address, studentWalletId: row.id };
    }

    try {
      const secretBs58 = await decryptWalletPrivateMaterial(row.encrypted_private_key);
      const keypair = restoreKeypair(secretBs58);
      if (keypair.publicKey.toBase58() !== row.wallet_address) {
        throw new Error("Incoherencia entre dirección pública y material cifrado almacenado.");
      }
      writeSessionSecret(alumnoId, secretBs58);
      if (alumno.wallet_address !== row.wallet_address) {
        const { error: syncErr } = await supabase.from("alumnos").update({ wallet_address: row.wallet_address }).eq("id", alumnoId);
        if (syncErr) throw new Error(formatDbError("Error al sincronizar perfil digital del estudiante", syncErr));
      }
      return { publicKey: row.wallet_address, studentWalletId: row.id, keypair };
    } catch (e) {
      const stored = readSessionSecret(alumnoId);
      if (stored && alumno.wallet_address) {
        const kp = restoreKeypair(stored);
        if (kp.publicKey.toBase58() === alumno.wallet_address) {
          const encrypted = await encryptWalletPrivateMaterial(stored);
          const { error: updErr } = await supabase
            .from("student_wallets")
            .update({
              encrypted_private_key: encrypted,
              wallet_address: alumno.wallet_address,
              updated_at: new Date().toISOString(),
            })
            .eq("id", row.id);
          if (!updErr) {
            return { publicKey: alumno.wallet_address, studentWalletId: row.id, keypair: kp };
          }
        }
      }
      throw e instanceof Error ? e : new Error("No se pudo recuperar la billetera académica custodial.");
    }
  }

  if (edge) {
    const legacy = readSessionSecret(alumnoId);
    const res = await invokeStudentWalletCustody({
      otec_id: alumno.otec_id,
      alumno_id: alumnoId,
      legacy_secret_bs58: legacy && alumno.wallet_address ? legacy : null,
    });
    if (legacy && res.created) {
      clearSessionSecret(alumnoId);
    }
    return { publicKey: res.public_key, studentWalletId: res.student_wallet_id };
  }

  const storedSecret = readSessionSecret(alumnoId);
  if (alumno.wallet_address && storedSecret) {
    const keypair = restoreKeypair(storedSecret);
    if (keypair.publicKey.toBase58() === alumno.wallet_address) {
      const encrypted = await encryptWalletPrivateMaterial(storedSecret);
      const inserted = await studentWalletsService.insertActive({
        alumno_id: alumnoId,
        otec_id: alumno.otec_id,
        wallet_address: alumno.wallet_address,
        encrypted_private_key: encrypted,
        blockchain: "solana",
        network,
        provider: "certilink-custodial",
        is_custodial: true,
        status: "active",
      });
      return { publicKey: alumno.wallet_address, studentWalletId: inserted.id, keypair };
    }
  }

  const wallet = generateStudentWallet();
  writeSessionSecret(alumnoId, wallet.secretKeyEncoded);
  const encrypted = await encryptWalletPrivateMaterial(wallet.secretKeyEncoded);

  const { error: updateError } = await supabase
    .from("alumnos")
    .update({
      wallet_address: wallet.publicKey,
    })
    .eq("id", alumnoId);

  if (updateError) throw new Error(formatDbError("Error al guardar perfil digital del estudiante", updateError));

  const inserted = await studentWalletsService.insertActive({
    alumno_id: alumnoId,
    otec_id: alumno.otec_id,
    wallet_address: wallet.publicKey,
    encrypted_private_key: encrypted,
    blockchain: "solana",
    network,
    provider: "certilink-custodial",
    is_custodial: true,
    status: "active",
  });

  const keypair = restoreKeypair(wallet.secretKeyEncoded);
  return { publicKey: wallet.publicKey, studentWalletId: inserted.id, keypair };
}

export async function saveOtecWallet(otecId: string, walletAddress: string): Promise<void> {
  const { error } = await supabase.rpc("certilink_otec_update_wallet", {
    p_otec_id: otecId,
    p_wallet_address: walletAddress,
  });

  if (error) {
    throw new Error(formatDbError("Error al guardar dirección institucional", error));
  }
}

export async function getOtecWallet(otecId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("certilink_otec_get_wallet", { p_otec_id: otecId });

  if (error) return null;
  if (data == null || data === "") return null;
  return String(data);
}
