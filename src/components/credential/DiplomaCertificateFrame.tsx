import { QRCodeSVG } from "qrcode.react";
import { APP_NAME, LOGO_URL } from "@/lib/constants";
import { SOLANA_NETWORK } from "@/lib/solana/config";
import { displayRut } from "@/lib/utils/rut";

export type DiplomaCertificateFrameProps = {
  institutionName: string;
  studentName: string;
  studentRut?: string | null;
  courseName: string;
  courseHours: number;
  issueDateLabel: string;
  verificationCode: string;
  verifyUrl: string;
  /** Si true, muestra aviso de previsualización (código aún no definitivo). */
  isPreview?: boolean;
  academicLineName?: string | null;
  academicLineDescription?: string | null;
  programUrl?: string | null;
  /** Banner institucional (línea académica). Opcional; degradado si no hay imagen. */
  bannerUrl?: string | null;
};

/** Etiqueta de red para pie de diploma (sin jerga crypto). */
function solanaNetworkLabel(): string {
  if (SOLANA_NETWORK === "mainnet-beta") return "Respaldo en red Solana";
  return "Respaldo en red Solana verificada";
}

function institutionInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "OT";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatProgramDisplay(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function certilinkLogoUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${LOGO_URL}`;
  }
  return LOGO_URL;
}

const sans = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const serif = "Georgia, 'Times New Roman', 'Palatino Linotype', serif";

/**
 * Plantilla premium de diploma institucional (capturable a PNG / PDF).
 * Estilos mayormente inline para estabilidad con html-to-image.
 */
export function DiplomaCertificateFrame({
  institutionName,
  studentName,
  studentRut,
  courseName,
  courseHours,
  issueDateLabel,
  verificationCode,
  verifyUrl,
  isPreview,
  academicLineName,
  academicLineDescription,
  programUrl,
  bannerUrl,
}: DiplomaCertificateFrameProps) {
  const lineaNombre = academicLineName?.trim();
  const lineaDesc = academicLineDescription?.trim();
  const programa = programUrl?.trim();
  const rutLabel = studentRut?.trim() ? displayRut(studentRut) : null;
  const banner = bannerUrl?.trim();
  const initials = institutionInitials(institutionName);

  return (
    <div
      className="diploma-export-root flex flex-col"
      style={{
        width: 1120,
        height: 792,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        fontFamily: serif,
        color: "#0f172a",
        background: "#faf9f6",
        border: "10px double #b8922a",
        boxShadow: "inset 0 0 0 1px rgba(184,146,42,0.25)",
      }}
    >
      {/* Fondo decorativo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 18,
          border: "1px solid rgba(184,146,42,0.28)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 320,
          height: 320,
          background: "radial-gradient(circle at top right, rgba(184,146,42,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Banner institucional */}
      <header
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: 88,
          background: banner
            ? `linear-gradient(90deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.88) 100%), url(${banner}) center/cover no-repeat`
            : "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)",
          borderBottom: "3px solid rgba(184,146,42,0.55)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "18px 40px 16px",
            fontFamily: sans,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "#f8fafc",
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(226,232,240,0.75)",
                fontWeight: 600,
              }}
            >
              Institución emisora
            </p>
            <h1
              style={{
                margin: "4px 0 0",
                fontSize: 22,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.2,
                fontFamily: serif,
              }}
            >
              {institutionName}
            </h1>
            {lineaNombre ? (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(226,232,240,0.9)", fontWeight: 500 }}>
                Línea académica · {lineaNombre}
              </p>
            ) : null}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 999,
                padding: "6px 12px",
              }}
            >
              <img
                src={certilinkLogoUrl()}
                alt=""
                width={22}
                height={22}
                style={{ borderRadius: 6, objectFit: "contain", background: "#fff" }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.01em" }}>{APP_NAME}</span>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 9, color: "rgba(203,213,225,0.85)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Credencial digital verificada
            </p>
          </div>
        </div>
      </header>

      {/* Cuerpo */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "28px 48px 20px",
          minHeight: 0,
        }}
      >
        {lineaDesc ? (
          <p
            style={{
              margin: "0 0 18px",
              fontSize: 11,
              lineHeight: 1.5,
              color: "#64748b",
              fontFamily: sans,
              maxWidth: 720,
            }}
          >
            {lineaDesc}
          </p>
        ) : null}

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#b8922a",
              fontWeight: 700,
              fontFamily: sans,
            }}
          >
            Certificado de capacitación
          </p>
          <div
            style={{
              width: 72,
              height: 2,
              background: "linear-gradient(90deg, transparent, #b8922a, transparent)",
              margin: "10px auto 0",
            }}
          />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", padding: "0 24px" }}>
          <p style={{ margin: "0 0 10px", fontSize: 14, color: "#64748b", fontFamily: sans }}>Se certifica que</p>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 40,
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            {studentName}
          </p>
          {rutLabel ? (
            <p style={{ margin: "0 0 18px", fontSize: 14, color: "#475569", fontFamily: sans, fontWeight: 500 }}>
              RUT {rutLabel}
            </p>
          ) : (
            <div style={{ height: 18 }} />
          )}
          <p
            style={{
              margin: 0,
              fontSize: 17,
              color: "#334155",
              lineHeight: 1.6,
              maxWidth: 760,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            ha completado satisfactoriamente el programa formativo{" "}
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{courseName}</span>
            {courseHours ? (
              <>
                , con una carga lectiva de <span style={{ fontWeight: 700 }}>{courseHours} horas</span>
              </>
            ) : null}
            .
          </p>
          {programa ? (
            <p style={{ margin: "14px 0 0", fontSize: 12, color: "#64748b", fontFamily: sans }}>
              Programa académico ·{" "}
              <span style={{ color: "#334155", fontWeight: 600 }}>{formatProgramDisplay(programa)}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Pie */}
      <footer
        style={{
          position: "relative",
          zIndex: 2,
          borderTop: "1px solid rgba(148,163,184,0.35)",
          background: "linear-gradient(180deg, rgba(248,250,252,0.6) 0%, rgba(241,245,249,0.95) 100%)",
          padding: "18px 40px 22px",
          fontFamily: sans,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "end" }}>
          {/* Columna izquierda — identidad y fecha */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8" }}>
                Fecha de emisión
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{issueDateLabel}</p>
            </div>
            <div style={{ marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8" }}>
                Número de certificado
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 17,
                  fontWeight: 700,
                  fontFamily: "ui-monospace, monospace",
                  letterSpacing: "0.06em",
                  color: "#0f172a",
                }}
              >
                {verificationCode}
              </p>
            </div>
            {isPreview ? (
              <p style={{ margin: 0, fontSize: 10, color: "#b45309", maxWidth: 280, lineHeight: 1.4 }}>
                Vista previa: el código definitivo se asignará al confirmar la emisión verificada.
              </p>
            ) : null}
          </div>

          {/* Columna central — QR */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "inline-block",
                padding: 10,
                background: "#ffffff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
              }}
            >
              <QRCodeSVG value={verifyUrl} size={96} level="M" includeMargin={false} />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 9, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Verificar credencial
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 8,
                color: "#94a3b8",
                maxWidth: 160,
                wordBreak: "break-all",
                lineHeight: 1.35,
              }}
            >
              {verifyUrl.replace(/^https?:\/\//, "")}
            </p>
          </div>

          {/* Columna derecha — blockchain y marca */}
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#047857",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: 999,
                  padding: "5px 10px",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                Registro inmutable verificado
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#1e40af",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 999,
                  padding: "5px 10px",
                }}
              >
                {solanaNetworkLabel()}
              </span>
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 10, color: "#64748b", lineHeight: 1.45, maxWidth: 260, marginLeft: "auto" }}>
              Credencial respaldada por registro distribuido. Consulte la autenticidad en la URL de verificación o escaneando el código QR.
            </p>
            <p style={{ margin: "10px 0 0", fontSize: 9, color: "#94a3b8" }}>
              Emitido mediante <strong style={{ color: "#64748b" }}>{APP_NAME}</strong>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
