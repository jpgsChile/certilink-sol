import { useState, useEffect, useRef, type FormEvent, type ReactNode } from "react";
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
  Copy,
  Check,
  Download,
  BadgeCheck,
  Lock,
  Clock,
  GraduationCap,
  Share2,
  Link2,
  FileText,
  IdCard,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/BrandLogo";
import { DiplomaCertificateFrame } from "@/components/credential/DiplomaCertificateFrame";
import { APP_NAME } from "@/lib/constants";
import {
  certificadosService,
  certificadoMintDisplay,
  certificadoPublicExplorer,
  certificadoExplorerMintUrl,
} from "@/lib/services/certificados.service";
import { displayRut } from "@/lib/utils/rut";
import type { CertificadoConDetalles } from "@/lib/database.types";

const DIPLOMA_WIDTH = 1120;
const DIPLOMA_HEIGHT = 792;

export default function Verify() {
  const { codigo } = useParams<{ codigo?: string }>();
  const [searchCode, setSearchCode] = useState(codigo || "");
  const [result, setResult] = useState<CertificadoConDetalles | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const [bannerBroken, setBannerBroken] = useState(false);

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
    setBannerBroken(false);
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
    if (codigo?.trim()) setSearchCode(codigo);
  }, [codigo]);

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

  const handleCopyLink = () => {
    if (!verifyPageUrl) return;
    void navigator.clipboard.writeText(verifyPageUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!result || !verifyPageUrl) return;
    const shareData = {
      title: `Credencial digital · ${personName(result)}`,
      text: `Credencial verificada ${verificationCode} — ${courseTitle(result)}`,
      url: verifyPageUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyLink();
      }
    } catch {
      /* usuario canceló o share no disponible */
    }
  };

  const blockchainUrl = result ? certificadoPublicExplorer(result) ?? certificadoExplorerMintUrl(result) : null;
  const hasBlockchain = Boolean(result?.tx_hash);

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-lg shadow-sm">
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo to="/" size="md" />
          <Link to="/login">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm shrink-0 border-slate-200">
              Acceso institucional
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <section
          className={`mx-auto transition-all duration-300 ${result && !loading ? "max-w-2xl mb-8" : "max-w-xl mb-10 sm:mb-12"}`}
        >
          {!result || loading ? (
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/15">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Verificación de credenciales
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
                Valide certificados digitales emitidos por instituciones académicas y de capacitación a través de{" "}
                {APP_NAME}.
              </p>
            </div>
          ) : null}

          <form onSubmit={handleSearch}>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_4px_24px_rgb(15,23,42,0.06)]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Ej: CL-8A3F2B"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="h-11 sm:h-12 pl-10 text-base bg-transparent border-0 shadow-none focus-visible:ring-0"
                  disabled={loading}
                  aria-label="Código de verificación"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 sm:h-12 px-6 bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold shrink-0 rounded-xl"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
              </Button>
            </div>
          </form>
        </section>

        {loading && <VerifyLoadingSkeleton />}

        {!loading && searched && errorMsg && <VerifyErrorState message={errorMsg} />}

        {!loading && searched && !errorMsg && !result && <VerifyNotFoundState />}

        {!loading && result && (
          <div className="animate-fade-in space-y-6 sm:space-y-8">
            <VerifyHero
              result={result}
              verificationCode={verificationCode}
              hasBlockchain={hasBlockchain}
              bannerBroken={bannerBroken}
              onBannerError={() => setBannerBroken(true)}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:gap-8 items-start">
              <div className="space-y-6">
                <CredentialDetailsCard result={result} verificationCode={verificationCode} onCopyCode={handleCopyCode} copied={copied} />

                <DiplomaVisualSection
                  result={result}
                  verificationCode={verificationCode}
                  verifyPageUrl={verifyPageUrl}
                  imgBroken={imgBroken}
                  onImgError={() => setImgBroken(true)}
                />

                {hasBlockchain && (
                  <BlockchainRecordCard result={result} blockchainUrl={blockchainUrl} />
                )}
              </div>

              <aside className="space-y-5 lg:sticky lg:top-24">
                <TrustIndicators hasBlockchain={hasBlockchain} />
                <QrVerificationCard verificationCode={verificationCode} verifyPageUrl={verifyPageUrl} />
                <ActionPanel
                  result={result}
                  blockchainUrl={blockchainUrl}
                  linkCopied={linkCopied}
                  onCopyLink={handleCopyLink}
                  onShare={() => void handleShare()}
                />
              </aside>
            </div>

            <InstitutionalAccessBanner result={result} broken={bannerBroken} onImgError={() => setBannerBroken(true)} />

            <p className="text-[11px] leading-relaxed text-slate-500 text-center px-4 pb-2">
              {hasBlockchain
                ? "Esta credencial cuenta con respaldo en registro distribuido. Los datos mostrados corresponden al registro institucional en "
                : "Esta credencial está respaldada por el registro institucional en "}
              {APP_NAME}. Cualquier duda debe canalizarse con la institución emisora.
            </p>
          </div>
        )}

        {!loading && !searched && (
          <VerifyEmptyHint />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 text-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {APP_NAME}. Plataforma de certificación digital para instituciones en Chile y
            Latinoamérica.
          </p>
        </div>
      </footer>
    </div>
  );
}

function VerifyLoadingSkeleton() {
  return (
    <div className="animate-fade-in space-y-6" aria-busy="true" aria-label="Verificando credencial">
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="h-40 sm:h-48 skeleton-shimmer" />
        <div className="p-6 space-y-4">
          <div className="h-6 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-full max-w-md rounded skeleton-shimmer" />
          <div className="flex gap-2 pt-2">
            <div className="h-7 w-32 rounded-full skeleton-shimmer" />
            <div className="h-7 w-28 rounded-full skeleton-shimmer" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="h-5 w-40 rounded skeleton-shimmer" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 rounded-xl skeleton-shimmer shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded skeleton-shimmer" />
                <div className="h-4 w-full max-w-xs rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
          <div className="aspect-[4/3] rounded-xl skeleton-shimmer mt-4" />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 h-48 skeleton-shimmer" />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 h-56 skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

function VerifyErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-100">
            <AlertCircle className="h-7 w-7 text-amber-600" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No fue posible verificar</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

function VerifyNotFoundState() {
  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <div className="rounded-2xl border border-red-100 bg-white p-8 sm:p-10 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Credencial no encontrada</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          No hay una certificación activa con ese código. Compruebe el código impreso en el diploma o contacte
          directamente a la institución emisora.
        </p>
      </div>
    </div>
  );
}

function VerifyEmptyHint() {
  return (
    <div className="mx-auto max-w-lg text-center animate-fade-in">
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-10">
        <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-600 leading-relaxed">
          Ingrese el código en formato <span className="font-mono font-semibold text-slate-800">CL-XXXXXX</span> para
          validar una credencial digital académica.
        </p>
      </div>
    </div>
  );
}

function VerifyHero({
  result,
  verificationCode,
  hasBlockchain,
  bannerBroken,
  onBannerError,
}: {
  result: CertificadoConDetalles;
  verificationCode: string;
  hasBlockchain: boolean;
  bannerBroken: boolean;
  onBannerError: () => void;
}) {
  const institution = result.otec?.nombre || "Institución emisora";
  const banner = result.cursos?.lineas_academicas?.banner_url?.trim();
  const initials = institutionInitials(institution);

  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_12px_40px_rgb(15,23,42,0.08)]">
      {banner && !bannerBroken ? (
        <>
          <img
            src={banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={onBannerError}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/85 to-slate-900/75" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}

      <div className="relative px-5 py-8 sm:px-8 sm:py-10 text-white">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
          <div
            className="flex h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 text-xl sm:text-2xl font-bold tracking-tight"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100 border border-emerald-400/30">
                <BadgeCheck className="h-3.5 w-3.5" />
                Credencial Digital Verificada
              </span>
              {hasBlockchain ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 border border-white/15">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Respaldo blockchain activo
                </span>
              ) : null}
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight tracking-tight">{institution}</h2>
            {academicLineDescription(result) ? (
              <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">{academicLineDescription(result)}</p>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Credencial digital emitida a través de {APP_NAME}</p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Número de certificado</p>
                <p className="text-lg sm:text-xl font-mono font-bold tracking-wide">{verificationCode}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CredentialDetailsCard({
  result,
  verificationCode,
  onCopyCode,
  copied,
}: {
  result: CertificadoConDetalles;
  verificationCode: string;
  onCopyCode: () => void;
  copied: boolean;
}) {
  const hasBlockchain = Boolean(result.tx_hash);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgb(15,23,42,0.05)] overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Datos de la credencial</h3>
        <p className="text-xs text-slate-500 mt-0.5">Información verificada del registro institucional</p>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <Detail icon={User} label="Persona certificada" value={personName(result)} highlight />
        <Detail icon={IdCard} label="RUT" value={studentRut(result)} mono />
        <Detail icon={BookOpen} label="Programa formativo" value={courseTitle(result)} />
        <Detail icon={GraduationCap} label="Línea académica" value={academicLineTitle(result)} />
        <Detail icon={Clock} label="Carga lectiva" value={courseHoursLabel(result)} />
        <Detail icon={Building2} label="Institución emisora" value={result.otec?.nombre || "—"} />
        <Detail icon={Calendar} label="Fecha de emisión" value={formatDate(result.fecha_emision)} />
        <div className="flex items-start gap-3 pt-1 border-t border-slate-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <FileText className="h-4 w-4 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">Número de certificado</p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-sm font-mono font-semibold text-slate-900 tracking-wide">{verificationCode}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs px-2"
                onClick={onCopyCode}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 px-4 py-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <BadgeCheck className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-900">Estado de verificación</p>
            <p className="text-sm text-emerald-800">
              {hasBlockchain ? "Credencial verificada con respaldo en blockchain" : "Registro académico verificado"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function DiplomaVisualSection({
  result,
  verificationCode,
  verifyPageUrl,
  imgBroken,
  onImgError,
}: {
  result: CertificadoConDetalles;
  verificationCode: string;
  verifyPageUrl: string;
  imgBroken: boolean;
  onImgError: () => void;
}) {
  const hasIpfsImage = Boolean(result.ipfs_image_url && !imgBroken);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgb(15,23,42,0.05)] overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Diploma digital</h3>
          <p className="text-xs text-slate-500 mt-0.5">Vista previa de la credencial emitida</p>
        </div>
        {result.ipfs_pdf_url ? (
          <Button variant="outline" size="sm" className="text-xs gap-1.5 shrink-0 hidden sm:inline-flex" asChild>
            <a href={result.ipfs_pdf_url} target="_blank" rel="noopener noreferrer" download>
              <Download className="h-3.5 w-3.5" />
              PDF
            </a>
          </Button>
        ) : null}
      </div>

      <div className="p-4 sm:p-6">
        {hasIpfsImage ? (
          <div className="diploma-elegant-frame">
            <div className="diploma-elegant-frame-inner">
              <img
                src={result.ipfs_image_url!}
                alt={`Diploma de ${personName(result)}`}
                className="w-full h-auto block max-h-[560px] object-contain object-center bg-white"
                onError={onImgError}
              />
            </div>
          </div>
        ) : result.ipfs_image_url && imgBroken ? (
          <DiplomaFallbackState message="La vista previa del diploma no está disponible desde este navegador." />
        ) : (
          <ScaledDiplomaPreview
            result={result}
            verificationCode={verificationCode}
            verifyPageUrl={verifyPageUrl}
          />
        )}
      </div>
    </section>
  );
}

function ScaledDiplomaPreview({
  result,
  verificationCode,
  verifyPageUrl,
}: {
  result: CertificadoConDetalles;
  verificationCode: string;
  verifyPageUrl: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / DIPLOMA_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="diploma-elegant-frame">
      <div ref={containerRef} className="diploma-elegant-frame-inner overflow-hidden" style={{ height: DIPLOMA_HEIGHT * scale }}>
        <div style={{ width: DIPLOMA_WIDTH, height: DIPLOMA_HEIGHT, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <DiplomaCertificateFrame
            institutionName={result.otec?.nombre || "Institución"}
            studentName={personName(result)}
            studentRut={result.alumnos?.rut}
            courseName={courseTitle(result)}
            courseHours={result.cursos?.horas ?? 0}
            issueDateLabel={formatDate(result.fecha_emision)}
            verificationCode={verificationCode}
            verifyUrl={verifyPageUrl}
            academicLineName={result.cursos?.lineas_academicas?.nombre}
            academicLineDescription={result.cursos?.lineas_academicas?.descripcion}
            bannerUrl={result.cursos?.lineas_academicas?.banner_url}
            programUrl={result.cursos?.programa_url}
          />
        </div>
      </div>
    </div>
  );
}

function DiplomaFallbackState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center py-16 px-6 text-center">
      <ShieldCheck className="h-10 w-10 text-slate-300 mb-3" />
      <p className="text-sm text-slate-600 max-w-sm leading-relaxed">{message}</p>
    </div>
  );
}

function TrustIndicators({ hasBlockchain }: { hasBlockchain: boolean }) {
  const items = [
    { icon: ShieldCheck, label: "Verificado en Blockchain", active: hasBlockchain },
    { icon: Building2, label: "Institución validada", active: true },
    { icon: Lock, label: "Registro inmutable", active: true },
    { icon: BadgeCheck, label: "Respaldo en red Solana", active: hasBlockchain },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_24px_rgb(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Indicadores de confianza</p>
      <ul className="space-y-2.5">
        {items.map(({ icon: Icon, label, active }) => (
          <li
            key={label}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
              active ? "bg-emerald-50/80 text-emerald-900 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-emerald-600" : "text-slate-300"}`} />
            <span className="font-medium text-xs sm:text-sm">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QrVerificationCard({ verificationCode, verifyPageUrl }: { verificationCode: string; verifyPageUrl: string }) {
  if (!verifyPageUrl) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_24px_rgb(15,23,42,0.05)] text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-4">Verificación rápida</p>
      <div className="inline-flex rounded-2xl border-2 border-slate-100 bg-white p-4 shadow-inner">
        <QRCodeSVG value={verifyPageUrl} size={160} level="M" includeMargin={false} />
      </div>
      <div className="mt-4 rounded-xl bg-slate-900 px-4 py-3">
        <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-1">Número de certificado</p>
        <p className="text-base font-mono font-bold text-white tracking-wide">{verificationCode}</p>
      </div>
      <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">Escanee para compartir o revalidar esta credencial</p>
    </div>
  );
}

function ActionPanel({
  result,
  blockchainUrl,
  linkCopied,
  onCopyLink,
  onShare,
}: {
  result: CertificadoConDetalles;
  blockchainUrl: string | null;
  linkCopied: boolean;
  onCopyLink: () => void;
  onShare: () => void;
}) {
  const program = programUrl(result);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_24px_rgb(15,23,42,0.05)] space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Acciones</p>

      {result.ipfs_pdf_url && (
        <Button className="w-full justify-start gap-2 h-11 bg-gradient-primary text-primary-foreground hover:opacity-90" asChild>
          <a href={result.ipfs_pdf_url} target="_blank" rel="noopener noreferrer" download>
            <Download className="h-4 w-4" />
            Descargar diploma PDF
          </a>
        </Button>
      )}

      {blockchainUrl && (
        <Button variant="outline" className="w-full justify-start gap-2 h-11 border-slate-200" asChild>
          <a href={blockchainUrl} target="_blank" rel="noopener noreferrer">
            <ShieldCheck className="h-4 w-4" />
            Ver registro blockchain
          </a>
        </Button>
      )}

      <Button variant="outline" className="w-full justify-start gap-2 h-11 border-slate-200" onClick={onShare}>
        <Share2 className="h-4 w-4" />
        Compartir credencial
      </Button>

      <Button variant="outline" className="w-full justify-start gap-2 h-11 border-slate-200" onClick={onCopyLink}>
        {linkCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
        {linkCopied ? "Enlace copiado" : "Copiar enlace"}
      </Button>

      {program && (
        <Button variant="outline" className="w-full justify-start gap-2 h-11 border-slate-200" asChild>
          <a href={program} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Ver programa académico
          </a>
        </Button>
      )}
    </div>
  );
}

function BlockchainRecordCard({
  result,
  blockchainUrl,
}: {
  result: CertificadoConDetalles;
  blockchainUrl: string | null;
}) {
  const mint = certificadoMintDisplay(result);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgb(15,23,42,0.05)] overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Respaldo digital</h3>
        <p className="text-xs text-slate-500 mt-0.5">Registro verificable en red distribuida</p>
      </div>
      <div className="p-5 sm:p-6 space-y-3">
        <div className="grid gap-3 text-xs">
          {mint && (
            <RecordRow label="Identificador de credencial" value={mint} />
          )}
          {result.tx_hash && <RecordRow label="Referencia de registro" value={result.tx_hash} />}
        </div>
        {blockchainUrl && (
          <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full sm:w-auto" asChild>
            <a href={blockchainUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Consultar registro público
            </a>
          </Button>
        )}
      </div>
    </section>
  );
}

function RecordRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
      <p className="text-slate-500 mb-0.5">{label}</p>
      <p className="font-mono text-slate-800 break-all text-[11px] leading-relaxed">{value}</p>
    </div>
  );
}

function personName(r: CertificadoConDetalles): string {
  return r.alumnos ? `${r.alumnos.nombre} ${r.alumnos.apellido}` : "—";
}

function studentRut(r: CertificadoConDetalles): string {
  return r.alumnos?.rut ? displayRut(r.alumnos.rut) : "—";
}

function courseTitle(r: CertificadoConDetalles): string {
  return r.cursos?.nombre ?? "—";
}

function academicLineTitle(r: CertificadoConDetalles): string {
  return r.cursos?.lineas_academicas?.nombre?.trim() || "—";
}

function academicLineDescription(r: CertificadoConDetalles): string | null {
  const d = r.cursos?.lineas_academicas?.descripcion?.trim();
  return d || null;
}

function courseHoursLabel(r: CertificadoConDetalles): string {
  if (r.cursos?.horas == null) return "—";
  return `${r.cursos.horas} horas`;
}

function programUrl(r: CertificadoConDetalles): string | null {
  const u = r.cursos?.programa_url?.trim();
  return u || null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function institutionInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "OT";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function InstitutionalAccessBanner({
  result,
  broken,
  onImgError,
}: {
  result: CertificadoConDetalles;
  broken: boolean;
  onImgError: () => void;
}) {
  const linea = result.cursos?.lineas_academicas;
  const banner = linea?.banner_url?.trim();
  const site = linea?.sitio_web?.trim();
  if (!banner && !site) return null;
  const href = site || banner || "#";

  let body: ReactNode = null;
  if (banner && !broken) {
    body = (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block bg-slate-50">
        <img
          src={banner}
          alt={`Portal de ${result.otec?.nombre ?? "la institución"}`}
          className="w-full max-h-52 object-contain object-center"
          onError={onImgError}
        />
      </a>
    );
  } else if (site) {
    body = (
      <div className="p-6 flex justify-center">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <a href={site} target="_blank" rel="noopener noreferrer">
            Sitio web de la institución
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  } else if (banner && broken) {
    body = (
      <div className="p-4 text-center text-xs text-slate-500">
        El enlace gráfico no está disponible; utilice el sitio web de la institución si fue configurado.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgb(15,23,42,0.04)] overflow-hidden">
      <p className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-500 pt-4 px-4">
        Acceso institucional
      </p>
      {body}
    </section>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  highlight,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p
          className={`leading-snug ${
            highlight ? "text-base font-semibold text-slate-900" : mono ? "text-sm font-mono font-medium text-slate-900" : "text-sm font-medium text-slate-900"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
