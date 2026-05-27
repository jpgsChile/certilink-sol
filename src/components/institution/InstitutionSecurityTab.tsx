import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletStatusCard } from "@/components/WalletStatusCard";
import type { InstitutionProfile } from "@/lib/database.types";

type SecurityTabProps = {
  profile: InstitutionProfile;
  onSave: (patch: Partial<InstitutionProfile>) => Promise<void>;
};

export function InstitutionSecurityTab({ profile, onSave }: SecurityTabProps) {
  const [form, setForm] = useState({
    verification_domain: profile.verification_domain ?? "",
    wallet_address: profile.wallet_address ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      verification_domain: profile.verification_domain ?? "",
      wallet_address: profile.wallet_address ?? "",
    });
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        verification_domain: form.verification_domain.trim() || null,
        wallet_address: form.wallet_address.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <WalletStatusCard />

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="wallet_address">Wallet institucional (referencia)</Label>
          <Input
            id="wallet_address"
            value={form.wallet_address}
            onChange={(e) => setForm({ ...form, wallet_address: e.target.value })}
            placeholder="Dirección Solana registrada"
            className="font-mono text-xs"
            readOnly
          />
          <p className="text-xs text-muted-foreground">
            La wallet activa se gestiona desde el panel de autorización institucional.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="verification_domain">Dominio verificador (futuro)</Label>
          <Input
            id="verification_domain"
            value={form.verification_domain}
            onChange={(e) => setForm({ ...form, verification_domain: e.target.value })}
            placeholder="verificar.su-institucion.cl"
          />
          <p className="text-xs text-muted-foreground">
            Dominio personalizado para verificación pública de credenciales.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">API keys</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Próximamente podrá generar claves API para integraciones externas y emisión automatizada.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Integración blockchain</p>
          <p className="text-xs text-muted-foreground">
            Configuración avanzada de redes, contratos y anclaje de credenciales estará disponible en futuras versiones.
          </p>
          <Button type="button" variant="outline" size="sm" asChild className="text-xs gap-1.5">
            <Link to="/configuracion">
              Ir a configuración general
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar seguridad
        </Button>
      </form>
    </div>
  );
}
