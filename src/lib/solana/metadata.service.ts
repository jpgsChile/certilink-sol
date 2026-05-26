// CertiLink - NFT Metadata Service
// Creates and uploads off-chain metadata for certificate NFTs
// Uses a data URI approach for hackathon simplicity (no IPFS/Arweave needed)

import {
  hasCredentialExtensionsContent,
  serializeCredentialExtensions,
  type CredentialExtensionsV1,
} from "@/lib/credential-extensions";
import { buildCertilinkVerifiableCredentialEnvelope } from "@/lib/verifiable-credential-envelope";

export interface CertificateMetadata {
  studentName: string;
  institutionName: string;
  courseName: string;
  courseHours: number;
  issueDate: string;
  verificationCode: string;
  certificateHash: string;
  studentRut?: string;
  /** Nombre comercial de la línea académica (ej. Formación continua). */
  academicLineName?: string | null;
  academicLineDescription?: string | null;
  /** Enlace público al programa en el sitio de la institución. */
  programUrl?: string | null;
}

/**
 * Build the Metaplex-compatible JSON metadata for a certificate NFT.
 * This follows the Metaplex Token Metadata Standard.
 */
export function buildCertificateMetadata(data: CertificateMetadata) {
  const linea = data.academicLineName?.trim();
  const lineaDesc = data.academicLineDescription?.trim();
  const programa = data.programUrl?.trim();
  const descParts = [
    `Certificado digital emitido por ${data.institutionName} para ${data.studentName}.`,
    `Curso: ${data.courseName} (${data.courseHours} horas).`,
    linea ? `Línea académica: ${linea}.` : null,
    lineaDesc ? `${lineaDesc}` : null,
    programa ? `Programa (web): ${programa}` : null,
    `Fecha: ${data.issueDate}. Código de verificación: ${data.verificationCode}.`,
  ].filter(Boolean);
  return {
    name: `Certificado: ${data.courseName}`,
    symbol: "CERT",
    description: descParts.join(" "),
    image: "",
    external_url: `https://certilink.cl/verificar/${data.verificationCode}`,
    attributes: [
      { trait_type: "Estudiante", value: data.studentName },
      { trait_type: "Institución", value: data.institutionName },
      { trait_type: "Curso", value: data.courseName },
      { trait_type: "Horas", value: data.courseHours.toString() },
      ...(linea ? [{ trait_type: "Línea académica", value: linea }] : []),
      ...(programa ? [{ trait_type: "Programa (URL)", value: programa }] : []),
      { trait_type: "Fecha de Emisión", value: data.issueDate },
      { trait_type: "Código de Verificación", value: data.verificationCode },
      { trait_type: "Hash del Certificado", value: data.certificateHash },
      ...(data.studentRut ? [{ trait_type: "RUT", value: data.studentRut }] : []),
    ],
    properties: {
      category: "certificate",
      creators: [
        {
          address: "", // Will be set to OTEC wallet
          share: 100,
        },
      ],
    },
  };
}

/**
 * Convert metadata to a data URI that can be used as the NFT's URI.
 * For hackathon/demo purposes, this avoids needing IPFS or Arweave.
 * The metadata is encoded as a base64 data URI.
 */
export function metadataToDataUri(metadata: ReturnType<typeof buildCertificateMetadata>): string {
  const json = JSON.stringify(metadata);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `data:application/json;base64,${base64}`;
}

/**
 * Decode a data URI back to metadata (for verification page)
 */
export function decodeMetadataUri(uri: string): ReturnType<typeof buildCertificateMetadata> | null {
  try {
    if (uri.startsWith("data:application/json;base64,")) {
      const base64 = uri.replace("data:application/json;base64,", "");
      const json = decodeURIComponent(escape(atob(base64)));
      return JSON.parse(json);
    }
    return null;
  } catch {
    return null;
  }
}

const CERT_SYMBOL = "CERT";

/** Límites on-chain Metaplex Token Metadata (bytes UTF-8). */
export const METAPLEX_MAX_NAME_BYTES = 32;
export const METAPLEX_MAX_SYMBOL_BYTES = 10;
export const METAPLEX_MAX_URI_BYTES = 200;

/** Trunca por bytes UTF-8 sin partir caracteres multibyte. */
export function truncateMetaplexOnchainField(value: string, maxBytes: number): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const bytes = new TextEncoder().encode(trimmed);
  if (bytes.length <= maxBytes) return trimmed;
  let end = maxBytes;
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end -= 1;
  return new TextDecoder().decode(bytes.slice(0, end));
}

/** URI on-chain (máx. 200 bytes). Usa `ipfs://CID` cuando la gateway Pinata es larga. */
export function compactMetaplexMetadataUri(uri: string): string {
  const trimmed = uri.trim();
  const cidMatch = trimmed.match(/\/ipfs\/([^/?#]+)/i);
  if (cidMatch?.[1]) {
    const short = `ipfs://${cidMatch[1]}`;
    if (new TextEncoder().encode(short).length <= METAPLEX_MAX_URI_BYTES) return short;
  }
  return truncateMetaplexOnchainField(trimmed, METAPLEX_MAX_URI_BYTES);
}

/** Nombre on-chain Metaplex (máx. 32 bytes UTF-8). Curso completo queda en metadata IPFS. */
export function buildCredentialNftOnchainName(verificationCode: string, courseName: string): string {
  const code = truncateMetaplexOnchainField(verificationCode.trim() || "CERT", METAPLEX_MAX_NAME_BYTES);
  const asciiCourse = courseName
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ");
  if (!asciiCourse) return code;
  const combined = `${code} ${asciiCourse}`;
  return truncateMetaplexOnchainField(combined, METAPLEX_MAX_NAME_BYTES) || code;
}

export function buildCredentialNftOnchainSymbol(): string {
  return truncateMetaplexOnchainField(CERT_SYMBOL, METAPLEX_MAX_SYMBOL_BYTES);
}

export interface VerifiedCredentialNftInput extends CertificateMetadata {
  imageGatewayUrl: string;
  pdfGatewayUrl: string;
  externalUrl: string;
  /** Wallet institucional (creador verificado en cadena). */
  institutionWalletAddress: string;
  /** Identificadores para sobre W3C VC / DID-ready (Fase 6). */
  certificadoId: string;
  otecId: string;
  alumnoId: string;
  /** Origen público (HTTPS) para IRIs de emisor y registro; por defecto se deduce de `externalUrl`. */
  issuerBaseUrl?: string | null;
  /** IRI del emisor si la institución ya opera con DID/HTTPS canónico. */
  issuerIdOverride?: string | null;
  subjectIdOverride?: string | null;
  credentialIdOverride?: string | null;
  /** Extensiones académicas (skills / competencias); se incluyen en IPFS si hay contenido. */
  credentialExtensions?: CredentialExtensionsV1 | null;
}

/**
 * JSON compatible con Metaplex Token Metadata para credencial académica verificada
 * (subido a IPFS como `uri` del registro digital).
 */
export function buildVerifiedCredentialNftJson(data: VerifiedCredentialNftInput) {
  const linea = data.academicLineName?.trim();
  const lineaDesc = data.academicLineDescription?.trim();
  const programa = data.programUrl?.trim();
  const desc =
    `Credencial digital académica verificada emitida por ${data.institutionName} para ${data.studentName}. ` +
    `Certificación: ${data.courseName} (${data.courseHours} horas). ` +
    (linea ? `Línea académica: ${linea}. ` : "") +
    (lineaDesc ? `${lineaDesc} ` : "") +
    (programa ? `Programa: ${programa}. ` : "") +
    `Fecha de emisión: ${data.issueDate}. Código de verificación: ${data.verificationCode}. ` +
    `Representa un logro educativo verificable, no un activo especulativo.`;

  const properties: Record<string, unknown> = {
    category: "image",
    files: [
      { uri: data.imageGatewayUrl, type: "image/png" },
      { uri: data.pdfGatewayUrl, type: "application/pdf" },
    ],
    creators: [
      {
        address: data.institutionWalletAddress,
        share: 100,
      },
    ],
  };

  if (data.credentialExtensions && hasCredentialExtensionsContent(data.credentialExtensions)) {
    properties.certilink_credential_extensions = serializeCredentialExtensions(data.credentialExtensions);
  }

  let issuerBaseUrl = data.issuerBaseUrl?.trim() || null;
  if (!issuerBaseUrl) {
    try {
      issuerBaseUrl = new URL(data.externalUrl).origin;
    } catch {
      issuerBaseUrl = "https://localhost";
    }
  }

  properties.certilink_verifiable_credential = buildCertilinkVerifiableCredentialEnvelope({
    issuerBaseUrl,
    otecId: data.otecId,
    alumnoId: data.alumnoId,
    certificadoId: data.certificadoId,
    externalUrl: data.externalUrl,
    issuanceDate: data.issueDate,
    institutionName: data.institutionName,
    institutionWalletAddress: data.institutionWalletAddress,
    studentName: data.studentName,
    studentRut: data.studentRut,
    courseName: data.courseName,
    courseHours: data.courseHours,
    certificateHash: data.certificateHash,
    verificationCode: data.verificationCode,
    academicLineName: data.academicLineName,
    academicLineDescription: data.academicLineDescription,
    programUrl: data.programUrl,
    imageGatewayUrl: data.imageGatewayUrl,
    pdfGatewayUrl: data.pdfGatewayUrl,
    issuerIdOverride: data.issuerIdOverride,
    subjectIdOverride: data.subjectIdOverride,
    credentialIdOverride: data.credentialIdOverride,
  });

  return {
    name: buildCredentialNftOnchainName(data.verificationCode, data.courseName),
    symbol: CERT_SYMBOL,
    description: desc,
    image: data.imageGatewayUrl,
    external_url: data.externalUrl,
    attributes: [
      { trait_type: "Institución", value: data.institutionName },
      { trait_type: "Curso", value: data.courseName },
      { trait_type: "Horas", value: String(data.courseHours) },
      ...(linea ? [{ trait_type: "Línea académica", value: linea }] : []),
      ...(programa ? [{ trait_type: "Programa (URL)", value: programa }] : []),
      { trait_type: "Fecha emisión", value: data.issueDate },
      { trait_type: "Código verificación", value: data.verificationCode },
      { trait_type: "Estado", value: "Emitido verificado" },
      { trait_type: "Blockchain", value: "Solana (registro inmutable)" },
      ...(data.studentRut ? [{ trait_type: "RUT", value: data.studentRut }] : []),
    ],
    properties,
  };
}