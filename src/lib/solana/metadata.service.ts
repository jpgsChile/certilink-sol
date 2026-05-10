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