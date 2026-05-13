import { QRCodeSVG } from "qrcode.react";
import { APP_NAME } from "@/lib/constants";

export type DiplomaCertificateFrameProps = {
  institutionName: string;
  studentName: string;
  courseName: string;
  courseHours: number;
  issueDateLabel: string;
  verificationCode: string;
  verifyUrl: string;
  /** Si true, muestra aviso de previsualización (código aún no definitivo). */
  isPreview?: boolean;
};

/**
 * Marco visual tipo diploma institucional (capturable a PNG).
 * Estilos mayormente inline para estabilidad con html-to-image.
 */
export function DiplomaCertificateFrame({
  institutionName,
  studentName,
  courseName,
  courseHours,
  issueDateLabel,
  verificationCode,
  verifyUrl,
  isPreview,
}: DiplomaCertificateFrameProps) {
  return (
    <div
      className="diploma-export-root flex flex-col bg-[#fbfbf9] text-[#0f172a]"
      style={{
        width: 1120,
        height: 792,
        boxSizing: "border-box",
        padding: 48,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        border: "12px double #b8860b",
        outline: "1px solid #e2e8f0",
        position: "relative",
        backgroundImage:
          "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 40%, rgba(241,245,249,1) 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: "1px solid rgba(184,134,11,0.35)",
          pointerEvents: "none",
        }}
      />

      <div className="flex justify-between items-start relative z-10">
        <div>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "#64748b",
              fontFamily: "system-ui, sans-serif",
              marginBottom: 8,
            }}
          >
            Certificación verificada
          </p>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#0f172a",
              maxWidth: 560,
              lineHeight: 1.25,
              margin: 0,
            }}
          >
            {institutionName}
          </h1>
        </div>
        <div className="text-right" style={{ fontFamily: "system-ui, sans-serif" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            {APP_NAME}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Registro blockchain · Solana Devnet</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10 py-6">
        <p
          style={{
            fontSize: 14,
            color: "#475569",
            marginBottom: 12,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Se certifica que
        </p>
        <p
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 16px 0",
            lineHeight: 1.15,
          }}
        >
          {studentName}
        </p>
        <p style={{ fontSize: 17, color: "#334155", maxWidth: 720, lineHeight: 1.55, margin: 0 }}>
          ha completado satisfactoriamente el programa formativo{" "}
          <span style={{ fontWeight: 700, color: "#0f172a" }}>{courseName}</span>
          {courseHours ? (
            <>
              {" "}
              con una carga lectiva de <span style={{ fontWeight: 700 }}>{courseHours} horas</span>.
            </>
          ) : (
            "."
          )}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-10 items-end relative z-10 mt-auto">
        <div style={{ fontFamily: "system-ui, sans-serif" }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Fecha de emisión</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{issueDateLabel}</div>
          <div style={{ height: 1, width: 220, background: "#cbd5e1", margin: "20px 0 12px" }} />
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Código de verificación</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.08em", fontFamily: "ui-monospace, monospace" }}>
            {verificationCode}
          </div>
          {isPreview && (
            <p style={{ fontSize: 10, color: "#b45309", marginTop: 10, maxWidth: 360 }}>
              Vista previa: el código definitivo se asignará al confirmar la emisión verificada.
            </p>
          )}
        </div>
        <div
          className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm"
          style={{ width: 132, height: 132 }}
        >
          <QRCodeSVG value={verifyUrl} size={108} level="M" includeMargin={false} />
        </div>
      </div>
    </div>
  );
}
