import { resolveInstitutionBranding } from "@/lib/institution-branding";
import type { InstitutionProfile, Otec } from "@/lib/database.types";
import { InstitutionLogo } from "@/components/InstitutionLogo";

type BrandingPreviewProps = {
  profile: InstitutionProfile | null;
  otec: Otec | null;
};

export function BrandingPreview({ profile, otec }: BrandingPreviewProps) {
  const branding = resolveInstitutionBranding(otec, profile);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%)` }}
      >
        <InstitutionLogo
          name={branding.institutionName}
          logoUrl={branding.logoUrl}
          size="md"
          rounded="lg"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{branding.institutionName}</p>
          <p className="text-xs text-white/80">Vista previa navbar</p>
        </div>
      </div>

      <div className="p-4 bg-card space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Certificado</p>
        <div
          className="rounded-lg p-4 text-center"
          style={{
            border: `2px double ${branding.certificateAccentColor}`,
            background: "#faf9f6",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-widest font-bold mb-1"
            style={{ color: branding.certificateAccentColor }}
          >
            Certificado de capacitación
          </p>
          <p className="text-sm font-serif font-bold text-foreground">{branding.issuerDisplayName}</p>
          {branding.signatureName ? (
            <p className="text-[11px] text-muted-foreground mt-2">
              {branding.signatureName}
              {branding.signatureRole ? ` · ${branding.signatureRole}` : ""}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <div className="h-8 flex-1 rounded-md" style={{ background: branding.primaryColor }} title="Principal" />
          <div className="h-8 flex-1 rounded-md" style={{ background: branding.secondaryColor }} title="Secundario" />
          <div className="h-8 flex-1 rounded-md" style={{ background: branding.certificateAccentColor }} title="Certificados" />
        </div>
      </div>
    </div>
  );
}
