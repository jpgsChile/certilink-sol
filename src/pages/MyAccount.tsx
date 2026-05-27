import { User, Mail, Building2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { useAuth } from "@/hooks/useAuth";
import { useInstitutionProfile } from "@/hooks/useInstitutionProfile";
import { resolveInstitutionBranding } from "@/lib/institution-branding";

export default function MyAccountPage() {
  const { user, otec } = useAuth();
  const { profile, loading } = useInstitutionProfile();

  const branding = resolveInstitutionBranding(otec, profile);

  return (
    <DashboardLayout>
      <PageHeader title="Mi Cuenta" description="Información de acceso y cuenta institucional" />

      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
        <div className="card-enterprise p-6 space-y-5">
          <div className="flex items-center gap-4">
            <InstitutionLogo name={branding.institutionName} logoUrl={branding.logoUrl} size="lg" />
            <div>
              <p className="text-base font-semibold text-foreground">{otec?.nombre}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">RUT:</span>
              <span className="font-medium">{otec?.rut || "—"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Institución:</span>
              <span className="font-medium">{otec?.nombre}</span>
            </div>
          </div>
        </div>

        <div className="card-enterprise p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Acciones</h3>
          <p className="text-xs text-muted-foreground">
            Para editar logo, branding y certificados, use el módulo de perfil institucional.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/mi-institucion">Ir a Mi Institución</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/configuracion">Configuración general</Link>
          </Button>

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando perfil…
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
