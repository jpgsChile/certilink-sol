

// CertiLink - Certificate Minting Hook
// Orchestrates the full certificate issuance + blockchain registration flow
// All complexity is hidden from the UI layer

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/hooks/useAuth";
import { mintCertificateNFT, type MintResult, type CertificateMetadata } from "@/lib/solana";
import { certificadosService } from "@/lib/services/certificados.service";

export type MintStep =
  | "idle"
  | "creating_record"     // Creating DB record
  | "preparing_wallet"    // Ensuring student wallet
  | "signing"             // OTEC signing transaction
  | "confirming"          // Waiting for confirmation
  | "storing"             // Storing on-chain data
  | "complete"            // Done
  | "error";              // Failed

interface MintState {
  step: MintStep;
  progress: number; // 0-100
  result: MintResult | null;
  error: string | null;
}

interface UseMintCertificateReturn {
  state: MintState;
  issueCertificate: (params: IssueCertificateParams) => Promise<MintResult | null>;
  reset: () => void;
}

export interface IssueCertificateParams {
  alumnoId: string;
  cursoId: string;
  fechaEmision: string;
  // Metadata fields
  studentName: string;
  studentRut: string;
  institutionName: string;
  courseName: string;
  courseHours: number;
}

const STEP_LABELS: Record<MintStep, string> = {
  idle: "",
  creating_record: "Creando registro del certificado...",
  preparing_wallet: "Preparando perfil digital del estudiante...",
  signing: "Esperando autorización institucional...",
  confirming: "Registrando en la red de verificación...",
  storing: "Almacenando datos del registro...",
  complete: "Certificado emitido exitosamente",
  error: "Error al emitir el certificado",
};

export function getStepLabel(step: MintStep): string {
  return STEP_LABELS[step];
}

const initialState: MintState = {
  step: "idle",
  progress: 0,
  result: null,
  error: null,
};

export function useMintCertificate(): UseMintCertificateReturn {
  const { otec } = useAuth();
  const wallet = useWallet();
  const [state, setState] = useState<MintState>(initialState);

  const setStep = (step: MintStep, progress: number) => {
    setState((prev) => ({ ...prev, step, progress }));
  };

  const issueCertificate = async (params: IssueCertificateParams): Promise<MintResult | null> => {
    if (!otec) {
      setState({ step: "error", progress: 0, result: null, error: "Sesión no válida" });
      return null;
    }

    if (!wallet.connected || !wallet.publicKey) {
      setState({
        step: "error",
        progress: 0,
        result: null,
        error: "Conecte su billetera institucional para emitir certificados",
      });
      return null;
    }

    try {
      // Step 1: Create the certificate record in Supabase
      setStep("creating_record", 10);
      const cert = await certificadosService.create(
        otec.id,
        params.alumnoId,
        params.cursoId,
        params.fechaEmision
      );

      const verificationCode = certificadosService.hashToCode(cert.hash_sha256);

      // Step 2: Prepare metadata
      setStep("preparing_wallet", 25);
      const metadata: CertificateMetadata = {
        studentName: params.studentName,
        institutionName: params.institutionName,
        courseName: params.courseName,
        courseHours: params.courseHours,
        issueDate: params.fechaEmision,
        verificationCode,
        certificateHash: cert.hash_sha256,
        studentRut: params.studentRut,
      };

      // Step 3: Mint NFT (this triggers wallet signing popup)
      setStep("signing", 40);

      // Small delay to let UI update before wallet popup
      await new Promise((r) => setTimeout(r, 300));

      setStep("confirming", 60);
      const mintResult = await mintCertificateNFT({
        certificadoId: cert.id,
        alumnoId: params.alumnoId,
        otecId: otec.id,
        walletAdapter: wallet as unknown as import("@solana/wallet-adapter-base").WalletAdapter,
        metadata,
      });

      // Step 4: Complete
      setStep("storing", 85);
      await new Promise((r) => setTimeout(r, 500)); // Brief pause for UX

      setState({
        step: "complete",
        progress: 100,
        result: mintResult,
        error: null,
      });

      return mintResult;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido al emitir";
      // Clean up user-facing error messages
      const cleanMessage = message.includes("User rejected")
        ? "La autorización fue cancelada por el usuario"
        : message.includes("insufficient")
          ? "Fondos insuficientes en la billetera institucional. Solicite SOL de prueba."
          : message;

      setState({
        step: "error",
        progress: 0,
        result: null,
        error: cleanMessage,
      });
      return null;
    }
  };

  const reset = () => setState(initialState);

  return { state, issueCertificate, reset };
}