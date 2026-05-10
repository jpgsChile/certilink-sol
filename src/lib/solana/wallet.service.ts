// CertiLink - Custodial Student Wallet Service
// Generates and manages Solana keypairs for students transparently
// Students never interact with wallets directly - this is invisible infrastructure

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { supabase } from "@/lib/supabase";

export interface StudentWallet {
  publicKey: string;
  secretKeyEncoded: string; // base58-encoded secret key
}

/**
 * Generate a new Solana keypair for a student.
 * In production, secret keys should be encrypted with a KMS.
 * For hackathon/demo, we store base58-encoded in Supabase.
 */
export function generateStudentWallet(): StudentWallet {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKeyEncoded: bs58.encode(keypair.secretKey),
  };
}

/**
 * Reconstruct a Keypair from a stored base58 secret key
 */
export function restoreKeypair(secretKeyEncoded: string): Keypair {
  const secretKey = bs58.decode(secretKeyEncoded);
  return Keypair.fromSecretKey(secretKey);
}

/**
 * Ensure a student has a wallet. If not, generate one and store it.
 * Returns the student's public key address.
 */
export async function ensureStudentWallet(alumnoId: string): Promise<{
  publicKey: string;
  keypair: Keypair;
}> {
  // Check if student already has a wallet
  const { data: alumno, error: fetchError } = await supabase
    .from("alumnos")
    .select("wallet_address, wallet_secret_encrypted")
    .eq("id", alumnoId)
    .single();

  if (fetchError) throw new Error("Error al obtener datos del estudiante");

  // If wallet exists, restore and return it
  if (alumno.wallet_address && alumno.wallet_secret_encrypted) {
    const keypair = restoreKeypair(alumno.wallet_secret_encrypted);
    return { publicKey: alumno.wallet_address, keypair };
  }

  // Generate new wallet
  const wallet = generateStudentWallet();

  // Store in Supabase
  const { error: updateError } = await supabase
    .from("alumnos")
    .update({
      wallet_address: wallet.publicKey,
      wallet_secret_encrypted: wallet.secretKeyEncoded,
    })
    .eq("id", alumnoId);

  if (updateError) throw new Error("Error al guardar perfil digital del estudiante");

  const keypair = restoreKeypair(wallet.secretKeyEncoded);
  return { publicKey: wallet.publicKey, keypair };
}

/**
 * Save OTEC institutional wallet address to their profile
 */
export async function saveOtecWallet(otecId: string, walletAddress: string): Promise<void> {
  const { error } = await supabase
    .from("otecs")
    .update({ wallet_address: walletAddress })
    .eq("id", otecId);

  if (error) throw new Error("Error al guardar dirección institucional");
}

/**
 * Get OTEC wallet address
 */
export async function getOtecWallet(otecId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("otecs")
    .select("wallet_address")
    .eq("id", otecId)
    .single();

  if (error) return null;
  return data?.wallet_address || null;
}