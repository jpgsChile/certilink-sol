// CertiLink Solana — public API for the app layer

export {
  SOLANA_NETWORK,
  SOLANA_RPC_URL,
  SOLANA_EXPLORER_BASE,
  getExplorerUrl,
  CERTILINK_COLLECTION,
} from "./config";

export type { CertificateMetadata } from "./metadata.service";

export { mintCertificateNFT } from "./mint.service";
export type { MintResult } from "./mint.service";

export { saveOtecWallet, getOtecWallet, getStudentWalletNetwork } from "./wallet.service";
export type { EnsureStudentWalletResult } from "./wallet.service";
