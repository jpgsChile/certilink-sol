import { supabase } from "@/lib/supabase";
import { formatSupabaseUserError } from "@/lib/supabase-error";
import { optimizeInstitutionImage } from "@/lib/image-optimize";
import { buildDefaultProfileFromOtec } from "@/lib/institution-branding";
import type { InstitutionProfile, InstitutionProfileUpdate, Otec } from "@/lib/database.types";

const BUCKET = "institution-assets";
const INSTITUTION_DATA_URL_LIMIT = 500_000;

function storagePath(otecId: string, kind: "logo" | "signature", ext: string): string {
  return `${otecId}/${kind}.${ext}`;
}

function publicStorageUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function parseProfileRow(raw: unknown): InstitutionProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.id || !o.otec_id) return null;
  return raw as InstitutionProfile;
}

function rpcProfileRows(data: unknown): InstitutionProfile | null {
  if (data == null) return null;
  if (Array.isArray(data)) return parseProfileRow(data[0]);
  return parseProfileRow(data);
}

function isMissingSchemaError(err: unknown): boolean {
  const msg = formatSupabaseUserError(err).toLowerCase();
  return (
    msg.includes("institution_profiles") ||
    msg.includes("certilink_institution_profile") ||
    msg.includes("does not exist") ||
    msg.includes("could not find") ||
    msg.includes("schema cache") ||
    msg.includes("pgrst202")
  );
}

/** Perfil en memoria cuando la BD aún no tiene la migración aplicada. */
export function buildEphemeralProfile(otec: Otec): InstitutionProfile {
  const defaults = buildDefaultProfileFromOtec(otec);
  const now = new Date().toISOString();
  return {
    id: `local-${otec.id}`,
    ...defaults,
    deleted_at: null,
    created_at: now,
    updated_at: now,
  };
}

async function uploadImage(
  otecId: string,
  kind: "logo" | "signature",
  file: File
): Promise<string> {
  const optimized = await optimizeInstitutionImage(file);
  const path = storagePath(otecId, kind, optimized.extension);

  const { error } = await supabase.storage.from(BUCKET).upload(path, optimized.blob, {
    upsert: true,
    contentType: optimized.mimeType,
    cacheControl: "3600",
  });

  if (error) {
    if (optimized.dataUrl.length <= INSTITUTION_DATA_URL_LIMIT) {
      return optimized.dataUrl;
    }
    throw error;
  }

  return `${publicStorageUrl(path)}?v=${Date.now()}`;
}

export const institutionProfileService = {
  async getByOtecId(otecId: string): Promise<InstitutionProfile | null> {
    const { data, error } = await supabase.rpc("certilink_institution_profile_get", {
      p_otec_id: otecId,
    });
    if (error) throw error;
    return rpcProfileRows(data);
  },

  /** Obtiene o crea perfil con defaults desde la fila OTEC (RPC SECURITY DEFINER). */
  async getOrCreate(otec: Otec): Promise<InstitutionProfile> {
    const { data, error } = await supabase.rpc("certilink_institution_profile_get_or_create", {
      p_otec_id: otec.id,
    });

    if (error) {
      if (isMissingSchemaError(error)) {
        throw new Error(
          "La tabla de perfil institucional no está disponible. Ejecute las migraciones 024 y 025 en Supabase SQL Editor."
        );
      }
      throw error;
    }

    const row = rpcProfileRows(data);
    if (!row) {
      throw new Error("No se pudo cargar el perfil institucional");
    }
    return row;
  },

  async update(otecId: string, patch: InstitutionProfileUpdate): Promise<InstitutionProfile> {
    const { data, error } = await supabase.rpc("certilink_institution_profile_update", {
      p_otec_id: otecId,
      p_patch: patch,
    });

    if (error) {
      if (isMissingSchemaError(error)) {
        throw new Error(
          "No se pudo guardar: ejecute las migraciones 024 y 025 en Supabase SQL Editor."
        );
      }
      throw error;
    }

    const row = rpcProfileRows(data);
    if (!row) throw new Error("No se pudo actualizar el perfil institucional");
    return row;
  },

  async uploadLogo(otecId: string, file: File): Promise<string> {
    const url = await uploadImage(otecId, "logo", file);
    await this.update(otecId, { logo_url: url });
    return url;
  },

  async deleteLogo(otecId: string): Promise<void> {
    const profile = await this.getByOtecId(otecId);
    if (profile?.logo_url && !profile.logo_url.startsWith("data:")) {
      const match = profile.logo_url.match(/institution-assets\/(.+?)(\?|$)/);
      if (match?.[1]) {
        await supabase.storage.from(BUCKET).remove([decodeURIComponent(match[1])]);
      }
    }
    await this.update(otecId, { logo_url: null });
  },

  async uploadSignature(otecId: string, file: File): Promise<string> {
    const url = await uploadImage(otecId, "signature", file);
    await this.update(otecId, { signature_image_url: url });
    return url;
  },

  async deleteSignature(otecId: string): Promise<void> {
    const profile = await this.getByOtecId(otecId);
    if (profile?.signature_image_url && !profile.signature_image_url.startsWith("data:")) {
      const match = profile.signature_image_url.match(/institution-assets\/(.+?)(\?|$)/);
      if (match?.[1]) {
        await supabase.storage.from(BUCKET).remove([decodeURIComponent(match[1])]);
      }
    }
    await this.update(otecId, { signature_image_url: null });
  },

  async getPublicByOtecId(otecId: string): Promise<InstitutionProfile | null> {
    try {
      return await this.getByOtecId(otecId);
    } catch {
      return null;
    }
  },
};
