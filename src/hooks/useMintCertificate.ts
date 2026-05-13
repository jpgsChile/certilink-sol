// Orquestación: registro académico → diploma → IPFS → metadata → mint Metaplex → persistencia

import { useRef, useState, type RefObject } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletAdapter } from "@solana/wallet-adapter-base";
import { useAuth } from "@/hooks/useAuth";
import { mintCertificateNFT, type MintResult } from "@/lib/solana";
import { certificadosService } from "@/lib/services/certificados.service";
import type { DiplomaCaptureHandle } from "@/components/credential/DiplomaCaptureHost";
import { buildDiplomaPdfFromPngBlob } from "@/lib/services/diploma-pdf.service";
import { isPinataConfigured, pinataPinFile, pinataPinJson } from "@/lib/services/pinata.service";
import { formatSupabaseUserError } from "@/lib/supabase-error";
import {
  buildVerifiedCredentialNftJson,
  buildCredentialNftOnchainName,
  type CertificateMetadata,
} from "@/lib/solana/metadata.service";

export type MintStep =
  | "idle"
  | "creating_record"
  | "generating_diploma"
  | "uploading_ipfs"
  | "registering_metadata"
  | "blockchain_emission"
  | "final_confirmation"
  | "complete"
  | "error";

interface MintState {
  step: MintStep;
  progress: number;
  result: MintResult | null;
  error: string | null;
}

export type IssueCertificateOutcome = {
  result: MintResult | null;
  error: string | null;
};

interface UseMintCertificateReturn {
  state: MintState;
  issueCertificate: (params: IssueCertificateParams) => Promise<IssueCertificateOutcome>;
  reset: () => void;
  lastParamsRef: RefObject<IssueCertificateParams | null>;
}

export interface IssueCertificateParams {
  alumnoId: string;
  cursoId: string;
  fechaEmision: string;
  studentName: string;
  studentRut: string;
  institutionName: string;
  courseName: string;
  courseHours: number;
}

const STEP_LABELS: Record<MintStep, string> = {
  idle: "",
  creating_record: "Creando registro académico…",
  generating_diploma: "Generando diploma…",
  uploading_ipfs: "Subiendo a almacenamiento descentralizado (IPFS)…",
  registering_metadata: "Registrando metadata de la credencial…",
  blockchain_emission: "Emisión blockchain — autorice en su billetera institucional…",
  final_confirmation: "Confirmación final…",
  complete: "Emisión verificada completada",
  error: "No se pudo completar la emisión",
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

export function useMintCertificate(captureRef: RefObject<DiplomaCaptureHandle | null>): UseMintCertificateReturn {
  const { otec } = useAuth();
  const wallet = useWallet();
  const [state, setState] = useState<MintState>(initialState);
  const lastParamsRef = useRef<IssueCertificateParams | null>(null);
  const issuingRef = useRef(false);

  const setStep = (step: MintStep, progress: number) => {
    setState((prev) => ({ ...prev, step, progress }));
  };

  const issueCertificate = async (params: IssueCertificateParams): Promise<IssueCertificateOutcome> => {
    lastParamsRef.current = params;

    if (!otec) {
      const error = "Sesión no válida";
      setState({ step: "error", progress: 0, result: null, error });
      return { result: null, error };
    }

    if (!wallet.connected || !wallet.publicKey) {
      const error = "Conecte su billetera institucional para emitir credenciales verificadas";
      setState({
        step: "error",
        progress: 0,
        result: null,
        error,
      });
      return { result: null, error };
    }

    if (typeof wallet.signTransaction !== "function") {
      const error =
        "Su billetera no permite firmar transacciones desde esta aplicación. Actualice Phantom o utilice una billetera compatible.";
      setState({ step: "error", progress: 0, result: null, error });
      return { result: null, error };
    }

    if (issuingRef.current) {
      const error = "Ya hay una emisión en curso. Espere a que finalice o cierre el cuadro de progreso.";
      setState({ step: "error", progress: 0, result: null, error });
      return { result: null, error };
    }

    if (!isPinataConfigured()) {
      const error =
        "Falta configurar IPFS (Pinata). Añada VITE_PINATA_JWT en .env y reinicie el servidor de desarrollo.";
      setState({
        step: "error",
        progress: 0,
        result: null,
        error,
      });
      return { result: null, error };
    }

    if (!captureRef.current) {
      const error = "Componente de captura del diploma no disponible. Recargue la página.";
      setState({
        step: "error",
        progress: 0,
        result: null,
        error,
      });
      return { result: null, error };
    }

    const baseUrl = (import.meta.env.VITE_PUBLIC_APP_BASE_URL?.trim() || window.location.origin).replace(/\/$/, "");

    let lastCertId: string | null = null;

    issuingRef.current = true;
    try {
      setStep("creating_record", 8);
      const cert = await certificadosService.create(otec.id, params.alumnoId, params.cursoId, params.fechaEmision);
      lastCertId = cert.id;
      const verificationCode = certificadosService.hashToCode(cert.hash_sha256);
      const verifyUrl = `${baseUrl}/verificar/${encodeURIComponent(verificationCode)}`;
      const externalUrl = verifyUrl;

      const issueDateLabel = new Date(params.fechaEmision).toLocaleDateString("es-CL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      setStep("generating_diploma", 22);
      const diplomaProps = {
        institutionName: params.institutionName,
        studentName: params.studentName,
        courseName: params.courseName,
        courseHours: params.courseHours,
        issueDateLabel,
        verificationCode,
        verifyUrl,
        isPreview: false,
      };

      const pngBlob = await captureRef.current.captureToPng(diplomaProps);

      setStep("uploading_ipfs", 38);
      const imageUrl = await pinataPinFile(pngBlob, `certilink-diploma-${cert.id}.png`, (pct) => {
        setState((prev) => ({ ...prev, progress: 38 + Math.round(pct * 0.22) }));
      });

      const pdfBlob = await buildDiplomaPdfFromPngBlob(pngBlob);
      const pdfUrl = await pinataPinFile(pdfBlob, `certilink-diploma-${cert.id}.pdf`, (pct) => {
        setState((prev) => ({ ...prev, progress: 60 + Math.round(pct * 0.12) }));
      });

      setStep("registering_metadata", 78);
      const walletPk = wallet.publicKey!.toBase58();
      const mdCore: CertificateMetadata = {
        studentName: params.studentName,
        institutionName: params.institutionName,
        courseName: params.courseName,
        courseHours: params.courseHours,
        issueDate: params.fechaEmision,
        verificationCode,
        certificateHash: cert.hash_sha256,
        studentRut: params.studentRut,
      };

      const nftJson = buildVerifiedCredentialNftJson({
        ...mdCore,
        imageGatewayUrl: imageUrl,
        pdfGatewayUrl: pdfUrl,
        externalUrl,
        institutionWalletAddress: walletPk,
      });

      const metadataGatewayUrl = await pinataPinJson(nftJson as unknown as Record<string, unknown>, `certilink-meta-${cert.id}`);

      const nftName = buildCredentialNftOnchainName(verificationCode, params.courseName);

      await certificadosService.updateBlockchainFields(cert.id, {
        ipfs_metadata_url: metadataGatewayUrl,
        ipfs_image_url: imageUrl,
        ipfs_pdf_url: pdfUrl,
        nft_status: "pending_onchain",
        last_blockchain_error: null,
      });

      setStep("blockchain_emission", 88);
      await new Promise((r) => setTimeout(r, 200));

      const mintResult = await mintCertificateNFT({
        certificadoId: cert.id,
        alumnoId: params.alumnoId,
        walletAdapter: wallet as unknown as WalletAdapter,
        metadataUri: metadataGatewayUrl,
        nftName,
        verificationCode,
        certificateHash: cert.hash_sha256,
        ipfsMetadataUrl: metadataGatewayUrl,
        ipfsImageUrl: imageUrl,
        ipfsPdfUrl: pdfUrl,
      });

      setStep("final_confirmation", 96);
      await new Promise((r) => setTimeout(r, 400));

      setState({
        step: "complete",
        progress: 100,
        result: mintResult,
        error: null,
      });

      return { result: mintResult, error: null };
    } catch (err: unknown) {
      let message = formatSupabaseUserError(err);
      if (message.includes("User rejected"))
        message = "La autorización fue cancelada en la billetera";
      else if (message.toLowerCase().includes("insufficient"))
        message = "Fondos insuficientes en la billetera institucional (SOL en Devnet)";
      const cleanMessage = message;

      if (typeof lastCertId === "string") {
        try {
          await certificadosService.updateBlockchainFields(lastCertId, {
            last_blockchain_error: cleanMessage,
            nft_status: "mint_failed",
          });
        } catch {
          /* noop */
        }
      }

      setState({
        step: "error",
        progress: 0,
        result: null,
        error: cleanMessage,
      });
      return { result: null, error: cleanMessage };
    } finally {
      issuingRef.current = false;
    }
  };

  const reset = () => {
    issuingRef.current = false;
    setState(initialState);
  };

  return { state, issueCertificate, reset, lastParamsRef };
}
