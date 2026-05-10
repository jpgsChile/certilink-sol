// CertiLink - Certificate NFT Minting Service
// Uses Metaplex SDK to mint certificate NFTs on Solana Devnet
// No custom programs, no Anchor - pure Metaplex

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  percentAmount,
  publicKey as umiPublicKey,
} from "@metaplex-foundation/umi";
import type { WalletAdapter } from "@solana/wallet-adapter-base";
import { SOLANA_RPC_URL, getExplorerUrl, CERTILINK_COLLECTION } from "./config";
import {
  buildCertificateMetadata,
  metadataToDataUri,
  type CertificateMetadata,
} from "./metadata.service";
import { ensureStudentWallet } from "./wallet.service";
import { supabase } from "@/lib/supabase";
import { certificadosService } from "@/lib/services/certificados.service";

export interface MintResult {
  success: boolean;
  txHash: string;
  mintAddress: string;
  metadataUri: string;
  explorerUrl: string;
  studentWalletAddress: string;
  verificationCode: string;
}

export interface MintCertificateParams {
  certificadoId: string;
  alumnoId: string;
  otecId: string;
  walletAdapter: WalletAdapter;
  metadata: CertificateMetadata;
}

/**
 * Complete certificate minting flow:
 * 1. Ensure student has a custodial wallet
 * 2. Build NFT metadata
 * 3. Create Metaplex UMI instance with OTEC wallet
 * 4. Mint NFT
 * 5. Store on-chain data in Supabase
 */
export async function mintCertificateNFT(params: MintCertificateParams): Promise<MintResult> {
  const { certificadoId, alumnoId, walletAdapter, metadata } = params;

  // Step 1: Ensure student has a wallet (transparent - student never sees this)
  const studentWallet = await ensureStudentWallet(alumnoId);

  // Step 2: Build metadata with OTEC wallet as creator
  const otecAddress = walletAdapter.publicKey?.toBase58() || "";
  const fullMetadata = buildCertificateMetadata(metadata);
  fullMetadata.properties.creators[0].address = otecAddress;
  const metadataUri = metadataToDataUri(fullMetadata);

  // Step 3: Create UMI instance with OTEC's connected wallet
  const umi = createUmi(SOLANA_RPC_URL)
    .use(mplTokenMetadata())
    .use(walletAdapterIdentity(walletAdapter));

  // Step 4: Mint NFT
  const mintSigner = generateSigner(umi);

  const txBuilder = createNft(umi, {
    mint: mintSigner,
    name: fullMetadata.name.substring(0, 32), // Metaplex name limit
    symbol: CERTILINK_COLLECTION.symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
    // The NFT is owned by the OTEC initially - can transfer to student later
    // For demo: keeping it simple with OTEC as owner
    tokenOwner: umiPublicKey(studentWallet.publicKey),
    creators: [
      {
        address: umi.identity.publicKey,
        verified: true,
        share: 100,
      },
    ],
    isMutable: false, // Certificates should be immutable
  });

  const result = await txBuilder.sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  // Step 5: Extract transaction hash
  void Buffer.from(result.signature).toString("base64");
  // For Solana explorer, we need the base58 signature
  const bs58Sig = encodeTxSignature(result.signature);
  const mintAddress = mintSigner.publicKey.toString();
  const explorerUrl = getExplorerUrl("tx", bs58Sig);

  // Step 6: Store on-chain data in Supabase
  const { error: updateError } = await supabase
    .from("certificados")
    .update({
      tx_hash: bs58Sig,
      mint_address: mintAddress,
      metadata_uri: metadataUri,
      explorer_url: explorerUrl,
      estado: "emitido",
    })
    .eq("id", certificadoId);

  if (updateError) {
    console.error("Error storing on-chain data:", updateError);
    // Don't throw - the NFT was minted successfully
  }

  const verificationCode = certificadosService.hashToCode(metadata.certificateHash);

  return {
    success: true,
    txHash: bs58Sig,
    mintAddress,
    metadataUri,
    explorerUrl,
    studentWalletAddress: studentWallet.publicKey,
    verificationCode,
  };
}

/**
 * Encode a Uint8Array transaction signature to base58 for explorer URLs
 */
function encodeTxSignature(signature: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = BigInt(0);
  for (const byte of signature) {
    num = num * 256n + BigInt(byte);
  }
  let encoded = "";
  while (num > 0n) {
    const remainder = Number(num % 58n);
    num = num / 58n;
    encoded = ALPHABET[remainder] + encoded;
  }
  // Handle leading zeros
  for (const byte of signature) {
    if (byte === 0) {
      encoded = "1" + encoded;
    } else {
      break;
    }
  }
  return encoded;
}