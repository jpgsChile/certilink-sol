import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LogoUploadZone } from "@/components/institution/LogoUploadZone";
import type { InstitutionProfile } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";

type CertificatesTabProps = {
  profile: InstitutionProfile;
  onSave: (patch: Partial<InstitutionProfile>) => Promise<void>;
  onUploadSignature: (file: File) => Promise<string>;
  onDeleteSignature: () => Promise<void>;
};

export function InstitutionCertificatesTab({
  profile,
  onSave,
  onUploadSignature,
  onDeleteSignature,
}: CertificatesTabProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    issuer_display_name: profile.issuer_display_name ?? "",
    signature_name: profile.signature_name ?? "",
    signature_role: profile.signature_role ?? "",
    legal_text: profile.legal_text ?? "",
    show_blockchain_badge: profile.show_blockchain_badge,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      issuer_display_name: profile.issuer_display_name ?? "",
      signature_name: profile.signature_name ?? "",
      signature_role: profile.signature_role ?? "",
      legal_text: profile.legal_text ?? "",
      show_blockchain_badge: profile.show_blockchain_badge,
    });
  }, [profile]);

  const handleUploadSignature = async (file: File) => {
    try {
      await onUploadSignature(file);
      toast({ title: "Firma actualizada" });
    } catch (err: unknown) {
      toast({
        title: "Error al subir firma",
        description: err instanceof Error ? err.message : "Intente nuevamente",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        issuer_display_name: form.issuer_display_name.trim() || null,
        signature_name: form.signature_name.trim() || null,
        signature_role: form.signature_role.trim() || null,
        legal_text: form.legal_text.trim() || null,
        show_blockchain_badge: form.show_blockchain_badge,
      });
      toast({ title: "Configuración de certificados guardada" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="issuer_display_name">Nombre visible del emisor</Label>
        <Input
          id="issuer_display_name"
          value={form.issuer_display_name}
          onChange={(e) => setForm({ ...form, issuer_display_name: e.target.value })}
          placeholder="Nombre que aparece en certificados PDF"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signature_name">Firma institucional</Label>
          <Input
            id="signature_name"
            value={form.signature_name}
            onChange={(e) => setForm({ ...form, signature_name: e.target.value })}
            placeholder="Nombre del firmante"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signature_role">Cargo firmante</Label>
          <Input
            id="signature_role"
            value={form.signature_role}
            onChange={(e) => setForm({ ...form, signature_role: e.target.value })}
            placeholder="Ej. Director Académico"
          />
        </div>
      </div>

      <LogoUploadZone
        label="Imagen de firma (opcional)"
        hint="PNG con fondo transparente recomendado"
        currentUrl={profile.signature_image_url}
        onUpload={handleUploadSignature}
        onRemove={onDeleteSignature}
        aspectSquare={false}
      />

      <div className="space-y-2">
        <Label htmlFor="legal_text">Texto legal</Label>
        <Textarea
          id="legal_text"
          rows={4}
          value={form.legal_text}
          onChange={(e) => setForm({ ...form, legal_text: e.target.value })}
          placeholder="Texto legal que aparecerá en el pie del certificado…"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Mostrar badge blockchain</p>
          <p className="text-xs text-muted-foreground">Indicador de respaldo en cadena en certificados</p>
        </div>
        <Switch
          checked={form.show_blockchain_badge}
          onCheckedChange={(checked) => setForm({ ...form, show_blockchain_badge: checked })}
        />
      </div>

      <div className="rounded-lg bg-secondary/60 p-4">
        <p className="text-xs font-medium text-foreground mb-1">Configuración QR</p>
        <p className="text-xs text-muted-foreground">
          El código QR de verificación se genera automáticamente con la URL pública de cada certificado emitido.
        </p>
      </div>

      <Button type="submit" disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Guardar certificados
      </Button>
    </form>
  );
}
