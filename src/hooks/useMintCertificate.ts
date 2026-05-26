// Orquestación: registro académico → diploma → IPFS → metadata → mint Metaplex → persistencia

import { useRef, useState, type RefObject } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletAdapter } from "@solana/wallet-adapter-base";
import { useAuth } from "@/hooks/useAuth";
import { mintCertificateNFT, type MintResult } from "@/lib/solana";
import { certificadosService } from "@/lib/services/certificados.service";
import type { CertificadoConDetalles } from "@/lib/database.types";
import type { DiplomaCaptureHandle } from "@/components/credential/DiplomaCaptureHost";
import { buildDiplomaPdfFromPngBlob } from "@/lib/services/diploma-pdf.service";
import { getPinataJwt, isPinataConfigured, pinataPinFile, pinataPinJson } from "@/lib/services/pinata.service";
import {
  classifyIssuanceError,
  formatIssuanceUserError,
  isWalletUserRejection,
  operationalLog,
  withOperationalRetry,
} from "@/lib/operational";
import { parseCredentialExtensions } from "@/lib/credential-extensions";
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
  | "retrying"
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
  certificadoId?: string;
  skippedDuplicate?: boolean;
};

export interface IssueCertificateOptions {
  /** No actualiza el estado global del hook (emisión masiva). */
  suppressUiState?: boolean;
  onProgress?: (step: MintStep, progress: number) => void;
  /** Reutiliza un certificado existente (reintento tras fallo de mint). */
  existingCertificadoId?: string;
}

interface UseMintCertificateReturn {
  state: MintState;
  issueCertificate: (params: IssueCertificateParams, options?: IssueCertificateOptions) => Promise<IssueCertificateOutcome>;
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
  academicLineName?: string | null;
  academicLineDescription?: string | null;
  academicLineBannerUrl?: string | null;
  programUrl?: string | null;
}

const STEP_LABELS: Record<MintStep, string> = {
  idle: "",
  creating_record: "Creando registro académico…",
  generating_diploma: "Generando diploma…",
  uploading_ipfs: "Subiendo a almacenamiento descentralizado (IPFS)…",
  registering_metadata: "Registrando metadata de la credencial…",
  blockchain_emission: "Emisión blockchain — autorice en su billetera institucional…",
  retrying: "No fue posible completar el registro blockchain. Reintentando…",
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

  const setStep = (step: MintStep, progress: number, options?: IssueCertificateOptions) => {
    options?.onProgress?.(step, progress);
    if (!options?.suppressUiState) {
      setState((prev) => ({ ...prev, step, progress }));
    }
  };

  const issueCertificate = async (
    params: IssueCertificateParams,
    options?: IssueCertificateOptions
  ): Promise<IssueCertificateOutcome> => {
    lastParamsRef.current = params;

    const fail = (error: string, extra?: Partial<IssueCertificateOutcome>): IssueCertificateOutcome => {
      if (!options?.suppressUiState) {
        setState({ step: "error", progress: 0, result: null, error });
      }
      return { result: null, error, ...extra };
    };

    if (!otec) {
      return fail("Sesión no válida");
    }

    if (!wallet.connected || !wallet.publicKey) {
      return fail("Conecte su billetera institucional para emitir credenciales verificadas");
    }

    if (typeof wallet.signTransaction !== "function") {
      return fail(
        "Su billetera no permite firmar transacciones desde esta aplicación. Actualice Phantom o utilice una billetera compatible."
      );
    }

    if (issuingRef.current) {
      return fail("Ya hay una emisión en curso. Espere a que finalice o cierre el cuadro de progreso.");
    }

    if (!isPinataConfigured()) {
      const raw = import.meta.env.VITE_PINATA_JWT?.trim();
      if (raw) {
        return fail(
          "VITE_PINATA_JWT no es un JWT válido: debe incluir tres partes separadas por puntos (copie el token completo desde app.pinata.cloud → API Keys)."
        );
      }
      return fail(
        "Falta configurar IPFS (Pinata). Añada VITE_PINATA_JWT en .env y reinicie el servidor de desarrollo."
      );
    }

    try {
      getPinataJwt();
    } catch (err: unknown) {
      return fail(err instanceof Error ? err.message : "Configuración de Pinata inválida.");
    }

    if (!captureRef.current) {
      return fail("Componente de captura del diploma no disponible. Recargue la página.");
    }

    const baseUrl = (import.meta.env.VITE_PUBLIC_APP_BASE_URL?.trim() || window.location.origin).replace(/\/$/, "");

    let lastCertId: string | null = null;

    issuingRef.current = true;
    try {
      operationalLog.log({
        type: "issuance_started",
        severity: "info",
        message: `Iniciando emisión verificada para ${params.studentName}.`,
        alumnoId: params.alumnoId,
        cursoId: params.cursoId,
      });

      let cert: CertificadoConDetalles;

      if (options?.existingCertificadoId) {
        cert = await certificadosService.getByIdForTenant(otec.id, options.existingCertificadoId);
        if (cert.alumno_id !== params.alumnoId || cert.curso_id !== params.cursoId) {
          return fail("El certificado indicado no corresponde a este participante y curso.");
        }
        if (cert.tx_hash) {
          return fail("Esta credencial ya tiene registro blockchain completado.", {
            skippedDuplicate: true,
            certificadoId: cert.id,
          });
        }
        lastCertId = cert.id;
        setStep("creating_record", 8, options);
      } else {
        operationalLog.log({
          type: "issuance_step",
          severity: "info",
          message: "Verificando registro académico previo…",
          alumnoId: params.alumnoId,
          cursoId: params.cursoId,
        });
        const existing = await certificadosService.findByEnrollment(otec.id, params.alumnoId, params.cursoId);
        if (existing?.tx_hash) {
          return fail("Ya existe una credencial emitida con registro blockchain para este participante en el curso.", {
            skippedDuplicate: true,
            certificadoId: existing.id,
          });
        }
        if (existing) {
          cert = await certificadosService.getByIdForTenant(otec.id, existing.id);
          lastCertId = cert.id;
          setStep("creating_record", 8, options);
        } else {
          setStep("creating_record", 8, options);
          operationalLog.log({
            type: "issuance_step",
            severity: "info",
            message: "Creando registro académico…",
            alumnoId: params.alumnoId,
            cursoId: params.cursoId,
          });
          cert = await certificadosService.create(otec.id, params.alumnoId, params.cursoId, params.fechaEmision);
          lastCertId = cert.id;
        }
      }

      const credentialExtensions = parseCredentialExtensions(cert.credential_extensions);
      const verificationCode = certificadosService.hashToCode(cert.hash_sha256);
      const verifyUrl = `${baseUrl}/verificar/${encodeURIComponent(verificationCode)}`;
      const externalUrl = verifyUrl;

      const issueDateLabel = new Date(params.fechaEmision).toLocaleDateString("es-CL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      setStep("generating_diploma", 22, options);
      operationalLog.log({
        type: "issuance_step",
        severity: "info",
        message: "Generando diploma digital en alta resolución…",
        certificadoId: cert.id,
        alumnoId: params.alumnoId,
        cursoId: params.cursoId,
      });
      const diplomaProps = {
        institutionName: params.institutionName,
        studentName: params.studentName,
        studentRut: params.studentRut,
        courseName: params.courseName,
        courseHours: params.courseHours,
        issueDateLabel,
        verificationCode,
        verifyUrl,
        isPreview: false,
        academicLineName: params.academicLineName,
        academicLineDescription: params.academicLineDescription,
        bannerUrl: params.academicLineBannerUrl,
        programUrl: params.programUrl,
      };

      const pngBlob = await captureRef.current.captureToPng(diplomaProps);

      setStep("uploading_ipfs", 38, options);
      const ipfsCtx = { certificadoId: cert.id };
      const imageUrl = await pinataPinFile(pngBlob, `certilink-diploma-${cert.id}.png`, (pct) => {
        const progress = 38 + Math.round(pct * 0.22);
        options?.onProgress?.("uploading_ipfs", progress);
        if (!options?.suppressUiState) {
          setState((prev) => ({ ...prev, progress }));
        }
      }, ipfsCtx);

      const pdfBlob = await buildDiplomaPdfFromPngBlob(pngBlob);
      const pdfUrl = await pinataPinFile(pdfBlob, `certilink-diploma-${cert.id}.pdf`, (pct) => {
        const progress = 60 + Math.round(pct * 0.12);
        options?.onProgress?.("uploading_ipfs", progress);
        if (!options?.suppressUiState) {
          setState((prev) => ({ ...prev, progress }));
        }
      }, ipfsCtx);

      setStep("registering_metadata", 78, options);
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
        academicLineName: params.academicLineName,
        academicLineDescription: params.academicLineDescription,
        programUrl: params.programUrl,
      };

      const nftJson = buildVerifiedCredentialNftJson({
        ...mdCore,
        imageGatewayUrl: imageUrl,
        pdfGatewayUrl: pdfUrl,
        externalUrl,
        institutionWalletAddress: walletPk,
        credentialExtensions,
        certificadoId: cert.id,
        otecId: otec.id,
        alumnoId: params.alumnoId,
        issuerBaseUrl: baseUrl,
      });

      const metadataGatewayUrl = await pinataPinJson(
        nftJson as unknown as Record<string, unknown>,
        `certilink-meta-${cert.id}`,
        ipfsCtx
      );

      const nftName = buildCredentialNftOnchainName(verificationCode, params.courseName);

      await certificadosService.updateBlockchainFields(cert.id, {
        ipfs_metadata_url: metadataGatewayUrl,
        ipfs_image_url: imageUrl,
        ipfs_pdf_url: pdfUrl,
        nft_status: "pending_onchain",
        last_blockchain_error: null,
      });

      setStep("blockchain_emission", 88, options);
      operationalLog.log({
        type: "mint_attempt",
        severity: "info",
        message: "Solicitando registro blockchain. Autorice la transacción en su billetera institucional.",
        certificadoId: cert.id,
        alumnoId: params.alumnoId,
        cursoId: params.cursoId,
      });
      await new Promise((r) => setTimeout(r, 200));

      let mintAttempt = 0;
      const mintResult = await withOperationalRetry(
        () =>
          mintCertificateNFT({
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
          }),
        {
          label: "Registro blockchain",
          maxAttempts: 3,
          initialBackoffMs: 1200,
          retryable: (err) => {
            const c = classifyIssuanceError(err);
            return c.retryable && !isWalletUserRejection(err);
          },
          onRetry: ({ attempt, maxAttempts, error, delayMs }) => {
            mintAttempt = attempt;
            const classified = classifyIssuanceError(error);
            setStep("retrying", 88, options);
            operationalLog.log({
              type: "mint_retry",
              severity: "warning",
              message: classified.userMessage,
              certificadoId: cert.id,
              alumnoId: params.alumnoId,
              cursoId: params.cursoId,
              attempt: attempt + 1,
              maxAttempts,
              technicalDetail: classified.technical,
              meta: { delayMs: String(delayMs) },
            });
            void certificadosService.updateBlockchainFields(cert.id, {
              nft_status: "retrying",
              last_blockchain_error: classified.userMessage,
              blockchain_retry_count: attempt,
            });
          },
        }
      );

      operationalLog.log({
        type: "blockchain_event",
        severity: "success",
        message: "Registro blockchain completado correctamente.",
        certificadoId: cert.id,
        meta: { tx: mintResult.txHash, attempt: String(mintAttempt + 1) },
      });

      setStep("final_confirmation", 96, options);
      await new Promise((r) => setTimeout(r, 400));

      setStep("complete", 100, options);
      if (!options?.suppressUiState) {
        setState({
          step: "complete",
          progress: 100,
          result: mintResult,
          error: null,
        });
      }

      operationalLog.log({
        type: "issuance_success",
        severity: "success",
        message: `Credencial verificada emitida para ${params.studentName}.`,
        certificadoId: cert.id,
        alumnoId: params.alumnoId,
        cursoId: params.cursoId,
        meta: { code: verificationCode },
      });

      return { result: mintResult, error: null, certificadoId: cert.id };
    } catch (err: unknown) {
      const classified = classifyIssuanceError(err);
      const cleanMessage = formatIssuanceUserError(err);

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

      operationalLog.log({
        type: "issuance_failed",
        severity: "error",
        message: cleanMessage,
        certificadoId: lastCertId ?? undefined,
        alumnoId: params.alumnoId,
        cursoId: params.cursoId,
        technicalDetail: classified.technical,
      });

      if (!options?.suppressUiState) {
        setState({
          step: "error",
          progress: 0,
          result: null,
          error: cleanMessage,
        });
      }
      return { result: null, error: cleanMessage, certificadoId: lastCertId ?? undefined };
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
