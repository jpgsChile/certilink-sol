// CertiLink - NFT Metadata Service
// Creates and uploads off-chain metadata for certificate NFTs
// Uses a data URI approach for hackathon simplicity (no IPFS/Arweave needed)

export interface CertificateMetadata {
    studentName: string;
    institutionName: string;
    courseName: string;
    courseHours: number;
    issueDate: string;
    verificationCode: string;
    certificateHash: string;
    studentRut?: string;
  }
  
  /**
   * Build the Metaplex-compatible JSON metadata for a certificate NFT.
   * This follows the Metaplex Token Metadata Standard.
   */
  export function buildCertificateMetadata(data: CertificateMetadata) {
    return {
      name: `Certificado: ${data.courseName}`,
      symbol: "CERT",
      description: `Certificado digital emitido por ${data.institutionName} para ${data.studentName}. Curso: ${data.courseName} (${data.courseHours} horas). Fecha: ${data.issueDate}. Código de verificación: ${data.verificationCode}.`,
      image: "",
      external_url: `https://certilink.cl/verificar/${data.verificationCode}`,
      attributes: [
        { trait_type: "Estudiante", value: data.studentName },
        { trait_type: "Institución", value: data.institutionName },
        { trait_type: "Curso", value: data.courseName },
        { trait_type: "Horas", value: data.courseHours.toString() },
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

/** Nombre on-chain Metaplex (máx. 32 caracteres visibles). */
export function buildCredentialNftOnchainName(verificationCode: string, courseName: string): string {
  const base = `${verificationCode} · ${courseName}`;
  if (base.length <= 32) return base;
  return `${verificationCode} · ${courseName.slice(0, Math.max(0, 32 - verificationCode.length - 3))}…`.slice(0, 32);
}

export interface VerifiedCredentialNftInput extends CertificateMetadata {
  imageGatewayUrl: string;
  pdfGatewayUrl: string;
  externalUrl: string;
  /** Wallet institucional (creador verificado en cadena). */
  institutionWalletAddress: string;
}

/**
 * JSON compatible con Metaplex Token Metadata para credencial académica verificada
 * (subido a IPFS como `uri` del registro digital).
 */
export function buildVerifiedCredentialNftJson(data: VerifiedCredentialNftInput) {
  const desc =
    `Credencial digital académica verificada emitida por ${data.institutionName} para ${data.studentName}. ` +
    `Certificación: ${data.courseName} (${data.courseHours} horas). ` +
    `Fecha de emisión: ${data.issueDate}. Código de verificación: ${data.verificationCode}. ` +
    `Representa un logro educativo verificable, no un activo especulativo.`;

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
      { trait_type: "Fecha emisión", value: data.issueDate },
      { trait_type: "Código verificación", value: data.verificationCode },
      { trait_type: "Estado", value: "Emitido verificado" },
      { trait_type: "Blockchain", value: "Solana (registro inmutable)" },
      ...(data.studentRut ? [{ trait_type: "RUT", value: data.studentRut }] : []),
    ],
    properties: {
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
    },
  };
}