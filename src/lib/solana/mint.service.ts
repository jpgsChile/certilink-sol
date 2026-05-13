// CertiLink — emisión de credencial digital on-chain (Metaplex, Solana Devnet)

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount, publicKey as umiPublicKey } from "@metaplex-foundation/umi";
import type { WalletAdapter } from "@solana/wallet-adapter-base";
import bs58 from "bs58";
import { SOLANA_RPC_URL, getExplorerUrl, CERTILINK_COLLECTION, METAPLEX_TOKEN_METADATA_PROGRAM, SOLANA_REFERENCE_CHAIN_ID } from "./config";
import { ensureStudentWallet } from "./wallet.service";
import { certificadosService } from "@/lib/services/certificados.service";
import type { Json } from "@/lib/database.types";

export interface MintResult {
  success: boolean;
  txHash: string;
  mintAddress: string;
  metadataUri: string;
  explorerUrl: string;
  explorerMintUrl: string;
  studentWalletAddress: string;
  verificationCode: string;
}

export interface MintCertificateParams {
  certificadoId: string;
  alumnoId: string;
  walletAdapter: WalletAdapter;
  /** URI HTTPS del JSON de metadata en IPFS (o gateway). */
  metadataUri: string;
  /** Nombre del token Metaplex (≤32 caracteres). */
  nftName: string;
  verificationCode: string;
  certificateHash: string;
  ipfsMetadataUrl: string;
  ipfsImageUrl: string | null;
  ipfsPdfUrl: string | null;
}

export async function mintCertificateNFT(params: MintCertificateParams): Promise<MintResult> {
  const { certificadoId, alumnoId, walletAdapter, metadataUri, nftName } = params;

  const studentWallet = await ensureStudentWallet(alumnoId);

  const umi = createUmi(SOLANA_RPC_URL)
    .use(mplTokenMetadata())
    .use(walletAdapterIdentity(walletAdapter));

  const mintSigner = generateSigner(umi);

  const txBuilder = createNft(umi, {
    mint: mintSigner,
    name: nftName.slice(0, 32),
    symbol: CERTILINK_COLLECTION.symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
    tokenOwner: umiPublicKey(studentWallet.publicKey),
    creators: [
      {
        address: umi.identity.publicKey,
        verified: true,
        share: 100,
      },
    ],
    isMutable: false,
  });

  const result = await txBuilder.sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  let bs58Sig: string;
  if (typeof result.signature === "string") {
    bs58Sig = result.signature;
  } else if (result.signature instanceof Uint8Array) {
    bs58Sig = bs58.encode(result.signature);
  } else if (Array.isArray(result.signature)) {
    bs58Sig = bs58.encode(new Uint8Array(result.signature));
  } else {
    throw new Error("Respuesta de red inválida: firma de transacción no reconocida.");
  }
  const mintAddress = mintSigner.publicKey.toString();
  const explorerUrl = getExplorerUrl("tx", bs58Sig);
  const explorerMintUrl = getExplorerUrl("address", mintAddress);
  const verificationCode = certificadosService.hashToCode(params.certificateHash);

  const metadataJson: Json = {
    explorer_url: explorerUrl,
    explorer_mint_url: explorerMintUrl,
    verification_code: verificationCode,
    uri_kind: "ipfs",
    ipfs_metadata_url: params.ipfsMetadataUrl,
    ipfs_image_url: params.ipfsImageUrl,
    ipfs_pdf_url: params.ipfsPdfUrl,
  };

  try {
    await certificadosService.updateBlockchainFields(certificadoId, {
      tx_hash: bs58Sig,
      token_id: mintAddress,
      contract_address: METAPLEX_TOKEN_METADATA_PROGRAM,
      chain_id: SOLANA_REFERENCE_CHAIN_ID,
      ipfs_metadata_url: params.ipfsMetadataUrl,
      ipfs_image_url: params.ipfsImageUrl,
      ipfs_pdf_url: params.ipfsPdfUrl,
      nft_status: "minted",
      nft_issued_at: new Date().toISOString(),
      estado: "emitido",
      metadata: metadataJson,
      last_blockchain_error: null,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("Error al persistir datos on-chain:", e);
    throw new Error(
      `La credencial se registró en Solana, pero no se pudo guardar el comprobante en el sistema (${detail}). Contacte soporte con el identificador del certificado.`
    );
  }

  return {
    success: true,
    txHash: bs58Sig,
    mintAddress,
    metadataUri,
    explorerUrl,
    explorerMintUrl,
    studentWalletAddress: studentWallet.publicKey,
    verificationCode,
  };
}
