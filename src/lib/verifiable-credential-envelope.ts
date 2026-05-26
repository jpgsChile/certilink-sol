/**
 * Sobre JSON alineado a W3C Verifiable Credentials (Data Model) y patrones DID-ready.
 * No incluye registro DID, pruebas criptográficas LD/JWT ni resolución on-line de documentos.
 *
 * El NFT Solana sigue siendo el ancla de publicación; este bloque facilita futuros mapeos SSI.
 */

/** Referencia de emisor (issuer) compatible con VC: `issuer` como objeto con IRI obligatorio. */
export type CertilinkVcIssuer = {
  id: string;
  name: string;
  /** IRI adicionales equivalentes (p. ej. DID futuro). */
  sameAs?: string[];
  /** URL humana de la institución (no sustituye `id`). */
  url?: string | null;
};

/** Sujeto de la credencial (titular del logro). */
export type CertilinkVcCredentialSubject = {
  id: string;
  type: string[];
  name: string;
  achievement: CertilinkVcAchievement;
  /** Identificador nacional opcional (p. ej. RUT). */
  nationalIdentifier?: { scheme: string; value: string };
};

export type CertilinkVcAchievement = {
  type: string[];
  name: string;
  description?: string | null;
  /** Horas académicas declaradas. */
  educationalLevel?: { hours: number };
  /** Enlace al programa (si existe). */
  url?: string | null;
};

/** Evidencia documental (artefactos off-chain). */
export type CertilinkVcEvidence = {
  id: string;
  type: string[];
  name?: string;
};

/** Pista de anclaje on-chain sin afirmar un `proof` W3C. */
export type CertilinkVcAnchoringHint = {
  type: "CertilinkSolanaNftAnchoringV1";
  ecosystem: "solana";
  issuer_wallet_address: string;
  documentation: string;
};

/** Identificadores y huellas usados por verificadores CertiLink (extensión práctica al sobre VC). */
export type CertilinkVcRegistration = {
  credential_record_id: string;
  verification_code: string;
  content_integrity: string;
};

export type CertilinkVerifiableCredentialEnvelope = {
  "@context": unknown[];
  id: string;
  type: string[];
  issuer: CertilinkVcIssuer | string;
  issuanceDate: string;
  credentialSubject: CertilinkVcCredentialSubject;
  evidence?: CertilinkVcEvidence[];
  certilink_registration?: CertilinkVcRegistration;
  certilink_anchoring_hint?: CertilinkVcAnchoringHint;
};

export type BuildVcEnvelopeInput = {
  issuerBaseUrl: string;
  otecId: string;
  alumnoId: string;
  certificadoId: string;
  externalUrl: string;
  issuanceDate: string;
  institutionName: string;
  institutionWalletAddress: string;
  studentName: string;
  studentRut?: string | null;
  courseName: string;
  courseHours: number;
  certificateHash: string;
  verificationCode: string;
  academicLineName?: string | null;
  academicLineDescription?: string | null;
  programUrl?: string | null;
  imageGatewayUrl: string;
  pdfGatewayUrl: string;
  /** IRI opcional del emisor (DID u HTTPS); si no, se deriva un IRI bajo `issuerBaseUrl`. */
  issuerIdOverride?: string | null;
  /** IRI opcional del sujeto; si no, se usa URN interno estable. */
  subjectIdOverride?: string | null;
  /** IRI opcional de la credencial; si no, fragmento sobre la URL de verificación. */
  credentialIdOverride?: string | null;
};

const VC_CONTEXT_V1 = "https://www.w3.org/2018/credentials/v1";

/** Base sugerida para un futuro documento JSON-LD de términos CertiLink. */
export function certilinkVcVocabBase(issuerBaseUrl: string): string {
  const u = issuerBaseUrl.replace(/\/$/, "");
  return `${u}/.well-known/certilink-vc-v1.jsonld`;
}

export function buildIssuerIri(issuerBaseUrl: string, otecId: string): string {
  const base = issuerBaseUrl.replace(/\/$/, "");
  return `${base}/identifiers/issuer/${encodeURIComponent(otecId)}`;
}

export function buildCredentialIri(externalUrl: string): string {
  const u = externalUrl.split("#")[0];
  return `${u}#verifiable-credential`;
}

export function buildSubjectIri(alumnoId: string): string {
  return `urn:certilink:subject:${alumnoId}`;
}

export function buildCertificateRecordIri(issuerBaseUrl: string, certificadoId: string): string {
  const base = issuerBaseUrl.replace(/\/$/, "");
  return `${base}/identifiers/credential-record/${encodeURIComponent(certificadoId)}`;
}

function toIso8601DateTime(issueDate: string): string {
  const t = issueDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return `${t}T12:00:00.000Z`;
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return `${t}T12:00:00.000Z`;
}

/**
 * Construye un objeto tipo VC 1.x para incrustar en metadata (p. ej. Metaplex `properties`).
 * No firma la credencial ni incluye `proof`.
 */
export function buildCertilinkVerifiableCredentialEnvelope(input: BuildVcEnvelopeInput): CertilinkVerifiableCredentialEnvelope {
  const issuerBase = input.issuerBaseUrl.replace(/\/$/, "");
  const vocab = certilinkVcVocabBase(issuerBase);

  const issuerId = (input.issuerIdOverride?.trim() || buildIssuerIri(issuerBase, input.otecId)).trim();
  const credentialId = (input.credentialIdOverride?.trim() || buildCredentialIri(input.externalUrl)).trim();
  const subjectId = (input.subjectIdOverride?.trim() || buildSubjectIri(input.alumnoId)).trim();

  const achievementDesc = [
    input.academicLineDescription?.trim() || null,
    input.academicLineName?.trim() ? `Línea: ${input.academicLineName.trim()}.` : null,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const issuer: CertilinkVcIssuer = {
    id: issuerId,
    name: input.institutionName,
    url: issuerBase || undefined,
  };

  const achievement: CertilinkVcAchievement = {
    type: ["CertilinkAcademicAchievement", "EducationalOccupationalCredential"],
    name: input.courseName,
    description: achievementDesc || null,
    educationalLevel: { hours: input.courseHours },
    url: input.programUrl?.trim() || null,
  };

  const subject: CertilinkVcCredentialSubject = {
    id: subjectId,
    type: ["CertilinkCredentialSubject", "AchievementSubject"],
    name: input.studentName,
    achievement,
  };

  const rut = input.studentRut?.trim();
  if (rut) {
    subject.nationalIdentifier = { scheme: "cl_rut", value: rut };
  }

  const evidence: CertilinkVcEvidence[] = [
    { id: input.imageGatewayUrl, type: ["Evidence", "ImageObject"], name: "Diploma (imagen)" },
    { id: input.pdfGatewayUrl, type: ["Evidence", "DigitalDocument"], name: "Diploma (PDF)" },
  ];

  const anchoring: CertilinkVcAnchoringHint = {
    type: "CertilinkSolanaNftAnchoringV1",
    ecosystem: "solana",
    issuer_wallet_address: input.institutionWalletAddress,
    documentation: `${issuerBase}/.well-known/certilink-solana-anchoring`,
  };

  const registration: CertilinkVcRegistration = {
    credential_record_id: buildCertificateRecordIri(issuerBase, input.certificadoId),
    verification_code: input.verificationCode,
    content_integrity: `sha256:${input.certificateHash}`,
  };

  return {
    "@context": [
      VC_CONTEXT_V1,
      {
        certilink: `${vocab}#`,
      },
    ],
    id: credentialId,
    type: ["VerifiableCredential", "CertilinkAcademicCredential"],
    issuer,
    issuanceDate: toIso8601DateTime(input.issuanceDate),
    credentialSubject: subject,
    evidence,
    certilink_registration: registration,
    certilink_anchoring_hint: anchoring,
  };
}
