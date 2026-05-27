import { AlertCircle, Building2, Loader2, Palette, FileBadge, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstitutionInfoTab } from "@/components/institution/InstitutionInfoTab";
import { InstitutionBrandingTab } from "@/components/institution/InstitutionBrandingTab";
import { InstitutionCertificatesTab } from "@/components/institution/InstitutionCertificatesTab";
import { InstitutionSecurityTab } from "@/components/institution/InstitutionSecurityTab";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { useAuth } from "@/hooks/useAuth";
import { useInstitutionProfile } from "@/hooks/useInstitutionProfile";
import { useToast } from "@/hooks/use-toast";
import { resolveInstitutionBranding } from "@/lib/institution-branding";
import type { InstitutionProfileUpdate } from "@/lib/database.types";

export default function InstitutionProfilePage() {
  const { otec } = useAuth();
  const {
    profile,
    loading,
    error,
    isLocalFallback,
    refetch,
    updateProfile,
    uploadLogo,
    deleteLogo,
    uploadSignature,
    deleteSignature,
  } = useInstitutionProfile();
  const { toast } = useToast();

  const handleSave = async (patch: InstitutionProfileUpdate) => {
    try {
      await updateProfile(patch);
    } catch (err: unknown) {
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "Intente nuevamente",
        variant: "destructive",
      });
      throw err;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando perfil institucional…</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!otec || !profile) {
    return (
      <DashboardLayout>
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center px-4">
          <AlertCircle className="h-10 w-10 text-destructive/70" />
          <p className="text-sm text-muted-foreground max-w-md">
            {error || "No se pudo cargar el perfil institucional."}
          </p>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const branding = resolveInstitutionBranding(otec, profile);

  return (
    <DashboardLayout>
      <PageHeader
        title="Mi Institución"
        description="Administre la identidad institucional, branding y configuración de certificados"
      />

      {isLocalFallback ? (
        <div className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-950">Base de datos pendiente de configuración</p>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              Ejecute en Supabase SQL Editor las migraciones{" "}
              <code className="rounded bg-amber-100 px-1">024_institution_profiles.sql</code> y{" "}
              <code className="rounded bg-amber-100 px-1">025_institution_profiles_rpc.sql</code>, luego recargue el esquema (Settings → API → Reload).
            </p>
            <Button variant="outline" size="sm" className="gap-2 h-8 text-xs" onClick={() => void refetch()}>
              <RefreshCw className="h-3 w-3" />
              Reintentar conexión
            </Button>
          </div>
        </div>
      ) : null}

      {!profile.logo_url ? (
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
          <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Complete su perfil institucional</p>
            <p className="text-xs text-muted-foreground mt-1">
              Suba su logo corporativo y configure el branding para generar mayor confianza en sus certificados.
            </p>
          </div>
        </div>
      ) : null}

      <div className="card-enterprise p-6 mb-6">
        <div className="flex items-center gap-4">
          <InstitutionLogo name={branding.institutionName} logoUrl={branding.logoUrl} size="xl" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">{branding.institutionName}</h2>
            <p className="text-sm text-muted-foreground">{profile.email || otec.email}</p>
            {profile.website ? (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="info" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Información
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-1.5">
            <FileBadge className="h-3.5 w-3.5" />
            Certificados
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="card-enterprise p-6">
          <InstitutionInfoTab profile={profile} onSave={handleSave} />
        </TabsContent>

        <TabsContent value="branding" className="card-enterprise p-6">
          <InstitutionBrandingTab
            profile={profile}
            otec={otec}
            onSave={handleSave}
            onUploadLogo={uploadLogo}
            onDeleteLogo={deleteLogo}
          />
        </TabsContent>

        <TabsContent value="certificates" className="card-enterprise p-6">
          <InstitutionCertificatesTab
            profile={profile}
            onSave={handleSave}
            onUploadSignature={uploadSignature}
            onDeleteSignature={deleteSignature}
          />
        </TabsContent>

        <TabsContent value="security" className="card-enterprise p-6">
          <InstitutionSecurityTab profile={profile} onSave={handleSave} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
