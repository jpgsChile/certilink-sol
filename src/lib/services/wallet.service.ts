/**
 * Punto de entrada de servicios de billetera académica custodial (Supabase + cifrado).
 * La orquestación con Solana permanece en `@/lib/solana/wallet.service`.
 */

export { studentWalletsService } from "./student-wallets.service";
export {
  isStudentWalletEncryptionConfigured,
  encryptWalletPrivateMaterial,
  decryptWalletPrivateMaterial,
} from "./wallet-encryption.service";
export { isCustodyEdgeEnabled, invokeStudentWalletCustody } from "./custody-wallet.service";
export type { CustodyEnsureResponse } from "./custody-wallet.service";
