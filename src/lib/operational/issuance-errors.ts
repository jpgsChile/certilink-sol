import { formatSupabaseUserError } from "@/lib/supabase-error";

export type IssuanceErrorCategory =
  | "wallet"
  | "rpc"
  | "ipfs"
  | "transaction"
  | "network"
  | "database"
  | "configuration"
  | "unknown";

export type ClassifiedIssuanceError = {
  category: IssuanceErrorCategory;
  userMessage: string;
  retryable: boolean;
  technical: string;
};

function rawMessage(err: unknown): string {
  return formatSupabaseUserError(err).toLowerCase();
}

export function isWalletUserRejection(err: unknown): boolean {
  const m = rawMessage(err);
  return (
    m.includes("user rejected") ||
    m.includes("rejected the request") ||
    m.includes("cancelled") ||
    m.includes("canceled") ||
    m.includes("denied") ||
    m.includes("rechaz")
  );
}

export function classifyIssuanceError(err: unknown): ClassifiedIssuanceError {
  const technical = formatSupabaseUserError(err);
  const m = technical.toLowerCase();

  if (isWalletUserRejection(err)) {
    return {
      category: "wallet",
      userMessage: "La autorización fue cancelada en la billetera institucional.",
      retryable: false,
      technical,
    };
  }

  if (m.includes("vite_pinata") || m.includes("pinata") || m.includes("ipfs")) {
    if (
      m.includes("inválidas o expiradas") ||
      m.includes("invalid") ||
      m.includes("401") ||
      m.includes("403") ||
      m.includes("unauthorized") ||
      m.includes("configure vite_pinata") ||
      m.includes("no es un jwt válido") ||
      m.includes("tres partes separadas")
    ) {
      return {
        category: "ipfs",
        userMessage:
          "Las credenciales de Pinata (IPFS) son inválidas o expiraron. Genere un nuevo JWT en app.pinata.cloud con permiso de subida, actualice VITE_PINATA_JWT en .env y reinicie la aplicación.",
        retryable: false,
        technical,
      };
    }

    const retryable =
      m.includes("red:") ||
      m.includes("no se pudo contactar") ||
      m.includes("timeout") ||
      m.includes("timed out") ||
      m.includes("429") ||
      m.includes("502") ||
      m.includes("503") ||
      m.includes("fetch failed");
    return {
      category: "ipfs",
      userMessage: retryable
        ? "No fue posible subir el diploma al almacenamiento seguro. Reintentando…"
        : "No fue posible subir el diploma al almacenamiento seguro (IPFS). Verifique la configuración de Pinata.",
      retryable,
      technical,
    };
  }

  if (
    m.includes("insufficient") ||
    m.includes("fondos insuficientes") ||
    m.includes("lamports") ||
    m.includes("0x1")
  ) {
    return {
      category: "wallet",
      userMessage: "Fondos insuficientes en la billetera institucional para completar el registro blockchain.",
      retryable: false,
      technical,
    };
  }

  if (
    m.includes("blockhash") ||
    m.includes("block height") ||
    m.includes("expired") ||
    m.includes("timeout") ||
    m.includes("timed out") ||
    m.includes("429") ||
    m.includes("503") ||
    m.includes("502") ||
    m.includes("fetch failed") ||
    m.includes("network") ||
    m.includes("econnreset") ||
    m.includes("rpc")
  ) {
    return {
      category: "rpc",
      userMessage: "No fue posible completar el registro blockchain. Reintentando…",
      retryable: true,
      technical,
    };
  }

  if (
    m.includes("name too long") ||
    m.includes("symbol too long") ||
    m.includes("uri too long") ||
    (m.includes("custom program error") && m.includes("0xb"))
  ) {
    return {
      category: "transaction",
      userMessage:
        "El registro digital en blockchain excedía el tamaño permitido (nombre o enlace). Ya se ajustó automáticamente; reintente la emisión una vez.",
      retryable: false,
      technical,
    };
  }

  if (
    m.includes("transaction") ||
    m.includes("simulation failed") ||
    m.includes("instruction") ||
    m.includes("custom program error")
  ) {
    return {
      category: "transaction",
      userMessage: "La transacción blockchain no pudo confirmarse. Reintentando…",
      retryable: true,
      technical,
    };
  }

  if (
    m.includes("row-level security") ||
    m.includes("student_wallets") ||
    (m.includes("42501") && m.includes("billetera académica"))
  ) {
    return {
      category: "database",
      userMessage:
        "No fue posible registrar la billetera académica del estudiante (permisos en base de datos). Ejecute supabase/sql/021_student_wallets_disable_rls.sql en Supabase y recargue el esquema (API → Reload). Luego reintente la emisión; en ese momento sí se solicitará autorizar en su billetera institucional.",
      retryable: false,
      technical,
    };
  }

  if (m.includes("billetera académica")) {
    return {
      category: "database",
      userMessage: "No fue posible preparar la billetera académica del estudiante. Intente nuevamente o contacte soporte institucional.",
      retryable: false,
      technical,
    };
  }

  if (
    m.includes("conecte su billetera") ||
    m.includes("billetera institucional") ||
    (m.includes("wallet") && !m.includes("student_wallet"))
  ) {
    return {
      category: "wallet",
      userMessage: "Revise la conexión de su billetera institucional e intente nuevamente.",
      retryable: false,
      technical,
    };
  }

  if (m.includes("value too long") || m.includes("character varying(42)") || m.includes("023_certificados_solana")) {
    return {
      category: "database",
      userMessage: technical,
      retryable: false,
      technical,
    };
  }

  if (m.includes("registró en solana") || m.includes("no se pudo guardar el comprobante")) {
    return {
      category: "database",
      userMessage: technical,
      retryable: false,
      technical,
    };
  }

  if (m.includes("duplicate") || m.includes("ya existe")) {
    return {
      category: "database",
      userMessage: technical,
      retryable: false,
      technical,
    };
  }

  if (m.includes("invalid input value for enum") || m.includes("certificado_nft_status")) {
    return {
      category: "database",
      userMessage:
        "El estado blockchain del certificado no coincide con la base de datos. Ejecute supabase/sql/020_certificados_nft_status_text.sql en Supabase y recargue el esquema (API → Reload).",
      retryable: false,
      technical,
    };
  }

  if (m.includes("not-null constraint") || m.includes("violates not-null") || m.includes("null value in column")) {
    return {
      category: "database",
      userMessage: "No fue posible crear el registro académico: faltan datos obligatorios en la base de datos. Contacte soporte institucional.",
      retryable: false,
      technical,
    };
  }

  if (
    m.includes("does not exist") ||
    m.includes("no existe") ||
    m.includes("pgrst204") ||
    m.includes("schema cache") ||
    m.includes("could not find")
  ) {
    return {
      category: "database",
      userMessage:
        "Falta actualizar el esquema de la base de datos para emisión verificada. Ejecute en Supabase los scripts supabase/sql/016_lineas_academicas.sql, 017_student_wallets.sql, 018_credential_extensions.sql y 019_certificados_blockchain_columns.sql, luego recargue el esquema (API → Reload).",
      retryable: false,
      technical,
    };
  }

  if (m.includes("pgrst") || m.includes("supabase") || m.includes("postgres")) {
    return {
      category: "database",
      userMessage: "No fue posible guardar el registro académico. Intente nuevamente en unos momentos.",
      retryable: true,
      technical,
    };
  }

  return {
    category: "unknown",
    userMessage: "No fue posible completar la emisión verificada. Intente nuevamente o contacte soporte institucional.",
    retryable: false,
    technical,
  };
}

/** Mensaje en español para UI (sin jerga técnica innecesaria). */
export function formatIssuanceUserError(err: unknown): string {
  return classifyIssuanceError(err).userMessage;
}
