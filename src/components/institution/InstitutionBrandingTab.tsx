import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoUploadZone } from "@/components/institution/LogoUploadZone";
import { BrandingPreview } from "@/components/institution/BrandingPreview";
import {
  DEFAULT_CERTIFICATE_ACCENT,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
} from "@/lib/institution-branding";
import type { InstitutionProfile, Otec } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";

type BrandingTabProps = {
  profile: InstitutionProfile;
  otec: Otec;
  onSave: (patch: Partial<InstitutionProfile>) => Promise<void>;
  onUploadLogo: (file: File) => Promise<string>;
  onDeleteLogo: () => Promise<void>;
};

export function InstitutionBrandingTab({
  profile,
  otec,
  onSave,
  onUploadLogo,
  onDeleteLogo,
}: BrandingTabProps) {
  const { toast } = useToast();
  const [colors, setColors] = useState({
    primary_color: profile.primary_color,
    secondary_color: profile.secondary_color,
    certificate_accent_color: profile.certificate_accent_color,
  });
  const [previewProfile, setPreviewProfile] = useState(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setColors({
      primary_color: profile.primary_color,
      secondary_color: profile.secondary_color,
      certificate_accent_color: profile.certificate_accent_color,
    });
    setPreviewProfile(profile);
  }, [profile]);

  useEffect(() => {
    setPreviewProfile((prev) => ({ ...prev, ...colors }));
  }, [colors]);

  const handleUpload = async (file: File) => {
    try {
      const url = await onUploadLogo(file);
      setPreviewProfile((prev) => ({ ...prev, logo_url: url }));
      toast({ title: "Logo actualizado", description: "Su logo institucional se aplicará en toda la plataforma." });
    } catch (err: unknown) {
      toast({
        title: "Error al subir logo",
        description: err instanceof Error ? err.message : "Intente nuevamente",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleRemove = async () => {
    await onDeleteLogo();
    setPreviewProfile((prev) => ({ ...prev, logo_url: null }));
    toast({ title: "Logo eliminado" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(colors);
      toast({ title: "Branding guardado" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <LogoUploadZone
          currentUrl={profile.logo_url}
          onUpload={handleUpload}
          onRemove={handleRemove}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["primary_color", "Color principal", DEFAULT_PRIMARY_COLOR],
              ["secondary_color", "Color secundario", DEFAULT_SECONDARY_COLOR],
              ["certificate_accent_color", "Color certificados", DEFAULT_CERTIFICATE_ACCENT],
            ] as const
          ).map(([key, label, fallback]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <div className="flex items-center gap-2">
                <input
                  id={key}
                  type="color"
                  value={colors[key]}
                  onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <Input
                  value={colors[key]}
                  onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                  placeholder={fallback}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar colores
        </Button>
      </form>

      <div>
        <p className="text-sm font-medium text-foreground mb-3">Vista previa en tiempo real</p>
        <BrandingPreview profile={previewProfile} otec={otec} />
      </div>
    </div>
  );
}
