import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { computeProfileCompletion } from "@/lib/institution-branding";
import {
  buildEphemeralProfile,
  institutionProfileService,
} from "@/lib/services/institution-profile.service";
import { formatSupabaseUserError } from "@/lib/supabase-error";
import type { InstitutionProfile, InstitutionProfileUpdate } from "@/lib/database.types";

export function useInstitutionProfile() {
  const { otec } = useAuth();
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocalFallback, setIsLocalFallback] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!otec?.id) {
      setProfile(null);
      setLoading(false);
      setIsLocalFallback(false);
      return;
    }
    setLoading(true);
    setError(null);
    setIsLocalFallback(false);
    try {
      const data = await institutionProfileService.getOrCreate(otec);
      setProfile(data);
    } catch (err: unknown) {
      const msg = formatSupabaseUserError(err);
      setError(msg);
      setProfile(buildEphemeralProfile(otec));
      setIsLocalFallback(true);
    } finally {
      setLoading(false);
    }
  }, [otec]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (patch: InstitutionProfileUpdate) => {
    if (!otec) throw new Error("Sesión no válida");
    if (isLocalFallback) {
      throw new Error(
        "La base de datos no está lista. Ejecute las migraciones 024 y 025 en Supabase SQL Editor."
      );
    }
    const updated = await institutionProfileService.update(otec.id, patch);
    setProfile(updated);
    return updated;
  };

  const uploadLogo = async (file: File) => {
    if (!otec) throw new Error("Sesión no válida");
    if (isLocalFallback) {
      throw new Error("Subida de logo requiere migraciones 024 y 025 en Supabase.");
    }
    const url = await institutionProfileService.uploadLogo(otec.id, file);
    setProfile((prev) => (prev ? { ...prev, logo_url: url } : prev));
    return url;
  };

  const deleteLogo = async () => {
    if (!otec) throw new Error("Sesión no válida");
    if (isLocalFallback) throw new Error("Eliminar logo requiere migraciones 024 y 025 en Supabase.");
    await institutionProfileService.deleteLogo(otec.id);
    setProfile((prev) => (prev ? { ...prev, logo_url: null } : prev));
  };

  const uploadSignature = async (file: File) => {
    if (!otec) throw new Error("Sesión no válida");
    if (isLocalFallback) throw new Error("Subida de firma requiere migraciones 024 y 025 en Supabase.");
    const url = await institutionProfileService.uploadSignature(otec.id, file);
    setProfile((prev) => (prev ? { ...prev, signature_image_url: url } : prev));
    return url;
  };

  const deleteSignature = async () => {
    if (!otec) throw new Error("Sesión no válida");
    if (isLocalFallback) throw new Error("Eliminar firma requiere migraciones 024 y 025 en Supabase.");
    await institutionProfileService.deleteSignature(otec.id);
    setProfile((prev) => (prev ? { ...prev, signature_image_url: null } : prev));
  };

  const completion = computeProfileCompletion(profile, otec);

  return {
    profile,
    loading,
    error,
    isLocalFallback,
    completion,
    refetch: fetchProfile,
    updateProfile,
    uploadLogo,
    deleteLogo,
    uploadSignature,
    deleteSignature,
  };
}
