import { useState, useEffect, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  XCircle,
  Calendar,
  BookOpen,
  User,
  Building2,
  Loader2,
  ExternalLink,
  Link2,
  Copy,
  Check,
  Download,
  BadgeCheck,
  Lock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/BrandLogo";
import { APP_NAME } from "@/lib/constants";
import {
  certificadosService,
  certificadoMintDisplay,
  certificadoPublicExplorer,
  certificadoExplorerMintUrl,
} from "@/lib/services/certificados.service";
import type { CertificadoConDetalles } from "@/lib/database.types";

export default function Verify() {
  const { codigo } = useParams<{ codigo?: string }>();
  const [searchCode, setSearchCode] = useState(codigo || "");
  const [result, setResult] = useState<CertificadoConDetalles | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);

  const doVerify = async (code: string) => {
    if (!code.trim()) return;

    const normalized = code.trim().replace(/^CL-/i, "").trim();
    if (normalized.length > 0 && normalized.length < 6) {
      setErrorMsg("El código parece incompleto. Use el formato CL-XXXXXX indicado en el diploma.");
      setResult(null);
      setSearched(true);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setImgBroken(false);
    try {
      const cert = await certificadosService.verifyByCode(code.trim());
      setResult(cert);
      setSearched(true);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      const lower = raw.toLowerCase();
      if (lower.includes("406") || lower.includes("multiple") || lower.includes("more than one")) {
        setErrorMsg(
          "Hay varios registros que coinciden con ese prefijo. Ingrese el código completo (formato CL-XXXXXX)."
        );
      } else if (raw) {
        setErrorMsg(`No se pudo consultar el servicio de verificación: ${raw}`);
      } else {
        setErrorMsg("Error al verificar. Compruebe su conexión e intente nuevamente.");
      }
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!codigo?.trim()) return;
    const handle = window.setTimeout(() => {
      void doVerify(codigo);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [codigo]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    doVerify(searchCode);
  };

  const verificationCode = result ? certificadosService.hashToCode(result.hash_sha256) : "";
  const verifyPageUrl =
    typeof window !== "undefined" && result
      ? `${window.location.origin}/verificar/${encodeURIComponent(verificationCode)}`
      : "";

  const handleCopyCode = () => {
    if (!verificationCode) return;
    void navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <BrandLogo to="/" size="md" />
          <Link to="/login">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm shrink-0">
              Acceso institucional
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3 sm:mb-4">
            <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Certificación verificada</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
            Consulte el código de verificación para validar una credencial digital académica emitida por una
            institución a través de {APP_NAME}.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mx-auto max-w-lg mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Ej: CL-8A3F2B"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="h-12 pl-10 text-base bg-white border-slate-200"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-6 bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
            </Button>
          </div>
        </form>

        {searched && !loading && (
          <div className="animate-fade-in">
            {errorMsg ? (
              <div className="mx-auto max-w-md text-center rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
            ) : result ? (
              <article className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(15,23,42,0.06)] overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-4 sm:px-6 sm:py-5 text-white">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {result.tx_hash ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-100 border border-emerald-400/30">
                        <BadgeCheck className="h-3 w-3" /> Verificado en Solana
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-100 border border-amber-400/25">
                        Registro académico verificado
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-slate-200 border border-white/10">
                      Emitido por institución validada
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-slate-200 border border-white/10">
                      <Lock className="h-3 w-3" /> Registro inmutable
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-semibold leading-snug">{result.otec?.nombre || "Institución"}</p>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">Credencial digital · {APP_NAME}</p>
                </div>

                <div className="p-4 sm:p-6 space-y-6">
                  {result.ipfs_image_url && !imgBroken ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                      <img
                        src={result.ipfs_image_url}
                        alt="Diploma de la certificación"
                        className="w-full h-auto block max-h-[420px] object-contain object-top bg-white"
                        onError={() => setImgBroken(true)}
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center py-16 px-4 text-center">
                      <ShieldCheck className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-600">
                        {result.ipfs_image_url
                          ? "La vista previa del diploma no está disponible desde este navegador."
                          : "Esta certificación aún no tiene diploma digital asociado en almacenamiento descentralizado."}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                    <div className="flex-1 space-y-4">
                      <Detail icon={User} label="Persona certificada" value={personName(result)} />
                      <Detail icon={BookOpen} label="Programa formativo" value={courseLine(result)} />
                      <Detail icon={Building2} label="Institución" value={result.otec?.nombre || "—"} />
                      <Detail icon={Calendar} label="Fecha de emisión" value={formatDate(result.fecha_emision)} />
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <Link2 className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500">Código de verificación</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <code className="text-sm font-mono font-semibold text-slate-900">{verificationCode}</code>
                            <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={handleCopyCode}>
                              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              Copiar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {verifyPageUrl && (
                      <div className="flex flex-col items-center justify-start sm:w-40 shrink-0">
                        <p className="text-[11px] text-slate-500 mb-2 text-center">QR de verificación</p>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                          <QRCodeSVG value={verifyPageUrl} size={112} level="M" includeMargin={false} />
                        </div>
                      </div>
                    )}
                  </div>

                  {result.tx_hash && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Registro blockchain</p>
                      <div className="grid gap-2 text-xs text-slate-600">
                        {certificadoMintDisplay(result) && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-slate-500">Identificador de credencial</span>
                            <span className="font-mono text-slate-800 break-all">{certificadoMintDisplay(result)}</span>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="text-slate-500">Transacción</span>
                          <span className="font-mono text-slate-800 break-all">{result.tx_hash}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {certificadoPublicExplorer(result) && (
                          <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full sm:flex-1" asChild>
                            <a href={certificadoPublicExplorer(result)!} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Abrir transacción
                            </a>
                          </Button>
                        )}
                        {certificadoExplorerMintUrl(result) && (
                          <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full sm:flex-1" asChild>
                            <a href={certificadoExplorerMintUrl(result)!} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Ver credencial en explorador
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    {result.ipfs_pdf_url && (
                      <Button variant="default" size="sm" className="w-full sm:flex-1 gap-2 text-sm" asChild>
                        <a href={result.ipfs_pdf_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                          Descargar PDF certificado
                        </a>
                      </Button>
                    )}
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-500 text-center border-t border-slate-100 pt-4">
                    {result.tx_hash
                      ? "Esta credencial cuenta con respaldo en registro distribuido. Los datos mostrados corresponden al registro institucional en "
                      : "Esta credencial está respaldada por el registro institucional en "}
                    {APP_NAME}. Cualquier duda debe canalizarse con la institución emisora.
                  </p>
                </div>
              </article>
            ) : (
              <div className="mx-auto max-w-md text-center rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                    <XCircle className="h-7 w-7 text-red-500" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Credencial no encontrada</h3>
                <p className="text-sm text-slate-600">
                  No hay una certificación activa con ese código. Compruebe el código o contacte a la institución.
                </p>
              </div>
            )}
          </div>
        )}

        {!searched && !loading && (
          <p className="mx-auto max-w-md text-center text-sm text-slate-500">
            Ingrese el código en formato CL-XXXXXX para validar una credencial digital.
          </p>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 text-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {APP_NAME}. Certificación digital para instituciones OTEC en Chile.
          </p>
        </div>
      </footer>
    </div>
  );
}

function personName(r: CertificadoConDetalles): string {
  return r.alumnos ? `${r.alumnos.nombre} ${r.alumnos.apellido}` : "—";
}

function courseLine(r: CertificadoConDetalles): string {
  if (!r.cursos) return "—";
  return `${r.cursos.nombre} · ${r.cursos.horas} horas`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900 leading-snug">{value}</p>
      </div>
    </div>
  );
}
