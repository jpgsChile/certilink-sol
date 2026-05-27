import type { InstitutionProfile, Otec, CertificadoConDetalles, InstitutionProfilePublic } from "@/lib/database.types";
import { extractInstitutionProfileFromCert } from "@/lib/database.types";

export type InstitutionBranding = {
  institutionName: string;
  issuerDisplayName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  certificateAccentColor: string;
  signatureName: string | null;
  signatureRole: string | null;
  signatureImageUrl: string | null;
  legalText: string | null;
  showBlockchainBadge: boolean;
  website: string | null;
  description: string | null;
};

export const DEFAULT_PRIMARY_COLOR = "#2563eb";
export const DEFAULT_SECONDARY_COLOR = "#64748b";
export const DEFAULT_CERTIFICATE_ACCENT = "#b8922a";

export function institutionInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "OT";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function resolveInstitutionBranding(
  otec: Pick<Otec, "nombre" | "wallet_address"> | null | undefined,
  profile: InstitutionProfile | null | undefined
): InstitutionBranding {
  const fallbackName = otec?.nombre?.trim() || "Institución OTEC";
  return {
    institutionName: profile?.institution_name?.trim() || profile?.issuer_display_name?.trim() || fallbackName,
    issuerDisplayName: profile?.issuer_display_name?.trim() || profile?.institution_name?.trim() || fallbackName,
    logoUrl: profile?.logo_url?.trim() || null,
    primaryColor: profile?.primary_color?.trim() || DEFAULT_PRIMARY_COLOR,
    secondaryColor: profile?.secondary_color?.trim() || DEFAULT_SECONDARY_COLOR,
    certificateAccentColor: profile?.certificate_accent_color?.trim() || DEFAULT_CERTIFICATE_ACCENT,
    signatureName: profile?.signature_name?.trim() || null,
    signatureRole: profile?.signature_role?.trim() || null,
    signatureImageUrl: profile?.signature_image_url?.trim() || null,
    legalText: profile?.legal_text?.trim() || null,
    showBlockchainBadge: profile?.show_blockchain_badge ?? true,
    website: profile?.website?.trim() || null,
    description: profile?.description?.trim() || null,
  };
}

export type ProfileCompletionStatus = {
  logoConfigured: boolean;
  signatureConfigured: boolean;
  walletConnected: boolean;
  brandingComplete: boolean;
  completionPercent: number;
  missingItems: string[];
};

export function computeProfileCompletion(
  profile: InstitutionProfile | null | undefined,
  otec: Pick<Otec, "wallet_address"> | null | undefined
): ProfileCompletionStatus {
  const logoConfigured = Boolean(profile?.logo_url?.trim());
  const signatureConfigured = Boolean(
    profile?.signature_name?.trim() && (profile?.signature_image_url?.trim() || profile?.signature_role?.trim())
  );
  const walletConnected = Boolean(otec?.wallet_address?.trim() || profile?.wallet_address?.trim());
  const brandingComplete = Boolean(
    profile?.primary_color?.trim() &&
      profile?.secondary_color?.trim() &&
      profile?.certificate_accent_color?.trim() &&
      profile?.issuer_display_name?.trim()
  );

  const checks = [logoConfigured, signatureConfigured, walletConnected, brandingComplete];
  const completionPercent = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const missingItems: string[] = [];
  if (!logoConfigured) missingItems.push("Logo institucional");
  if (!signatureConfigured) missingItems.push("Firma institucional");
  if (!walletConnected) missingItems.push("Wallet institucional");
  if (!brandingComplete) missingItems.push("Branding completo");

  return {
    logoConfigured,
    signatureConfigured,
    walletConnected,
    brandingComplete,
    completionPercent,
    missingItems,
  };
}

export function buildDefaultProfileFromOtec(otec: Otec): Omit<InstitutionProfile, "id" | "created_at" | "updated_at" | "deleted_at"> {
  return {
    otec_id: otec.id,
    institution_name: otec.nombre,
    legal_name: otec.nombre,
    rut: otec.rut,
    description: null,
    email: otec.email,
    phone: otec.telefono,
    website: null,
    address: otec.direccion,
    logo_url: null,
    primary_color: DEFAULT_PRIMARY_COLOR,
    secondary_color: DEFAULT_SECONDARY_COLOR,
    certificate_accent_color: DEFAULT_CERTIFICATE_ACCENT,
    issuer_display_name: otec.nombre,
    signature_name: null,
    signature_role: null,
    signature_image_url: null,
    legal_text: null,
    show_blockchain_badge: true,
    verification_domain: null,
    wallet_address: otec.wallet_address,
  };
}

/** Props de branding para DiplomaCertificateFrame a partir de certificado o perfil. */
export function brandingToDiplomaExtras(branding: InstitutionBranding) {
  return {
    institutionName: branding.issuerDisplayName,
    logoUrl: branding.logoUrl,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    certificateAccentColor: branding.certificateAccentColor,
    signatureName: branding.signatureName,
    signatureRole: branding.signatureRole,
    signatureImageUrl: branding.signatureImageUrl,
    legalText: branding.legalText,
    showBlockchainBadge: branding.showBlockchainBadge,
  };
}

export function resolveBrandingFromCert(cert: Pick<CertificadoConDetalles, "otec">): InstitutionBranding {
  const profile = extractInstitutionProfileFromCert(cert);
  return resolveInstitutionBranding(
    cert.otec ? { nombre: cert.otec.nombre, wallet_address: null } : null,
    profile as InstitutionProfile | null
  );
}

export function resolveBrandingFromPublicProfile(
  otecName: string | null | undefined,
  profile: InstitutionProfilePublic | null | undefined
): InstitutionBranding {
  return resolveInstitutionBranding(
    otecName ? { nombre: otecName, wallet_address: null } : null,
    profile as InstitutionProfile | null
  );
}
