import { Settings, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { WalletStatusCard } from "@/components/WalletStatusCard";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Configuración"
        description="Preferencias de la plataforma y autorización institucional"
      />

      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
        <WalletStatusCard />

        <div className="card-enterprise p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Preferencias generales</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Notificaciones, idioma y preferencias avanzadas estarán disponibles próximamente.
          </p>

          <div className="rounded-lg border border-dashed border-border p-4 flex items-start gap-3">
            <Wallet className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-foreground">Integración blockchain</p>
              <p className="text-xs text-muted-foreground mt-1">
                Configure su wallet institucional para habilitar emisión verificable on-chain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
