/**
 * Esquema versionado de extensiones de credencial (Fase 5 — base para grafo de competencias).
 * No incluye puntuación, recomendaciones ni motor de reputación.
 *
 * `future_mappings`: ancla para taxonomías externas (ESCO, RNCP, etc.) sin BD de grafos.
 */

export const CREDENTIAL_EXTENSIONS_SCHEMA_VERSION = "1" as const;

/** Habilidad declarada (etiqueta humana + identificadores opcionales). */
export type CredentialSkillRef = {
  /** Identificador estable interno o URI de taxonomía externa. */
  id?: string;
  label: string;
  /** URI de marco de competencias (ej. ESCO, anexo futuro). */
  framework_uri?: string | null;
  /** Nivel o subtipo libre (texto); evitar scoring numérico en esta fase. */
  level_label?: string | null;
};

/** Competencia con relaciones declarativas (sin motor de inferencia). */
export type CredentialCompetencyRef = {
  id?: string;
  label: string;
  /** IDs de otras competencias u habilidades relacionadas (solo referencias, sin grafo materializado). */
  relates_to?: string[];
};

export type CredentialAcademicCategory = {
  code?: string;
  label: string;
  scheme_uri?: string | null;
};

/**
 * Raíz JSON almacenada en `certificados.credential_extensions`.
 * Campos desconocidos pueden coexistir en `extras` para compatibilidad hacia adelante.
 */
export type CredentialExtensionsV1 = {
  schema_version: typeof CREDENTIAL_EXTENSIONS_SCHEMA_VERSION;
  skills: CredentialSkillRef[];
  competencies: CredentialCompetencyRef[];
  academic_categories: CredentialAcademicCategory[];
  achievement_tags: string[];
  /**
   * Claves libres para futuros mapas (ej. `esco`, `national_framework`) sin migraciones inmediatas.
   */
  future_mappings?: Record<string, unknown>;
};

export function createEmptyCredentialExtensions(): CredentialExtensionsV1 {
  return {
    schema_version: CREDENTIAL_EXTENSIONS_SCHEMA_VERSION,
    skills: [],
    competencies: [],
    academic_categories: [],
    achievement_tags: [],
    future_mappings: {},
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Normaliza JSON de BD (o vacío) a `CredentialExtensionsV1`. */
export function parseCredentialExtensions(raw: unknown): CredentialExtensionsV1 {
  const empty = createEmptyCredentialExtensions();
  if (!isRecord(raw)) return empty;

  const version = raw.schema_version;
  const isExplicitForeignVersion =
    typeof version === "string" &&
    version.length > 0 &&
    version !== CREDENTIAL_EXTENSIONS_SCHEMA_VERSION;

  if (isExplicitForeignVersion) {
    return {
      ...empty,
      future_mappings: {
        ...empty.future_mappings,
        legacy_payload: raw,
      },
    };
  }

  const skills = Array.isArray(raw.skills) ? raw.skills : [];
  const competencies = Array.isArray(raw.competencies) ? raw.competencies : [];
  const academic_categories = Array.isArray(raw.academic_categories) ? raw.academic_categories : [];
  const achievement_tags = Array.isArray(raw.achievement_tags)
    ? raw.achievement_tags.filter((t): t is string => typeof t === "string")
    : [];
  const future_mappings = isRecord(raw.future_mappings) ? raw.future_mappings : {};

  return {
    schema_version: CREDENTIAL_EXTENSIONS_SCHEMA_VERSION,
    skills: skills.filter((s): s is CredentialSkillRef => isRecord(s) && typeof (s as CredentialSkillRef).label === "string"),
    competencies: competencies.filter(
      (c): c is CredentialCompetencyRef => isRecord(c) && typeof (c as CredentialCompetencyRef).label === "string"
    ),
    academic_categories: academic_categories.filter(
      (a): a is CredentialAcademicCategory => isRecord(a) && typeof (a as CredentialAcademicCategory).label === "string"
    ),
    achievement_tags,
    future_mappings,
  };
}

/** Serialización segura para Supabase / IPFS (sin funciones ni undefined). */
export function serializeCredentialExtensions(ext: CredentialExtensionsV1): Record<string, unknown> {
  return JSON.parse(JSON.stringify(ext)) as Record<string, unknown>;
}

export function hasCredentialExtensionsContent(ext: CredentialExtensionsV1): boolean {
  return (
    ext.skills.length > 0 ||
    ext.competencies.length > 0 ||
    ext.academic_categories.length > 0 ||
    ext.achievement_tags.length > 0 ||
    Boolean(ext.future_mappings && Object.keys(ext.future_mappings).length > 0)
  );
}
