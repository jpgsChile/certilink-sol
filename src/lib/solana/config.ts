// CertiLink Solana Configuration
// All blockchain config centralized here - no crypto terminology exposed to UI

import { clusterApiUrl } from "@solana/web3.js";

export const SOLANA_NETWORK = "devnet" as const;
export const SOLANA_RPC_URL = clusterApiUrl("devnet");
export const SOLANA_EXPLORER_BASE = "https://explorer.solana.com";

/** Identificador de referencia para integraciones (no es chainId EVM). Devnet: 103, mainnet-beta: 101. */
export const SOLANA_REFERENCE_CHAIN_ID = 103;

/** Programa Metaplex Token Metadata (registro de credencial on-chain). */
export const METAPLEX_TOKEN_METADATA_PROGRAM =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

/** Build a Solana Explorer URL for a given address/tx */
export function getExplorerUrl(type: "tx" | "address" | "token", value: string): string {
  return `${SOLANA_EXPLORER_BASE}/${type}/${value}?cluster=${SOLANA_NETWORK}`;
}

/** Certificate NFT collection metadata */
export const CERTILINK_COLLECTION = {
  name: "CertiLink - Certificados Digitales",
  symbol: "CERT",
  description: "Certificado digital verificable emitido por institución OTEC acreditada en Chile.",
  sellerFeeBasisPoints: 0,
  externalUrl: "https://certilink.cl",
};