import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InstitutionProfile } from "@/lib/database.types";

type InfoTabProps = {
  profile: InstitutionProfile;
  onSave: (patch: Partial<InstitutionProfile>) => Promise<void>;
};

export function InstitutionInfoTab({ profile, onSave }: InfoTabProps) {
  const [form, setForm] = useState({
    institution_name: profile.institution_name ?? "",
    legal_name: profile.legal_name ?? "",
    rut: profile.rut ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    website: profile.website ?? "",
    description: profile.description ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      institution_name: profile.institution_name ?? "",
      legal_name: profile.legal_name ?? "",
      rut: profile.rut ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      website: profile.website ?? "",
      description: profile.description ?? "",
    });
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        institution_name: form.institution_name.trim() || null,
        legal_name: form.legal_name.trim() || null,
        rut: form.rut.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
        issuer_display_name: form.institution_name.trim() || profile.issuer_display_name,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="institution_name">Nombre OTEC</Label>
          <Input
            id="institution_name"
            value={form.institution_name}
            onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
            placeholder="Ej. Academia de Capacitación"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="legal_name">Razón social</Label>
          <Input
            id="legal_name"
            value={form.legal_name}
            onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rut">RUT empresa</Label>
          <Input id="rut" value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email institucional</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="website">Sitio web</Label>
          <Input
            id="website"
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descripción institucional</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Breve descripción de su institución…"
          />
        </div>
      </div>
      <Button type="submit" disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Guardar información
      </Button>
    </form>
  );
}
