import { useState, useEffect, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, Search, CheckCircle, XCircle, Award, Calendar, BookOpen, User, Building2, Loader2, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/BrandLogo";
import { APP_NAME } from "@/lib/constants";
import { certificadosService } from "@/lib/services/certificados.service";
import type { CertificadoConDetalles } from "@/lib/database.types";

export default function Verify() {
  const { codigo } = useParams<{ codigo?: string }>();
  const [searchCode, setSearchCode] = useState(codigo || "");
  const [result, setResult] = useState<CertificadoConDetalles | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const doVerify = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const cert = await certificadosService.verifyByCode(code.trim());
      setResult(cert);
      setSearched(true);
    } catch {
      setErrorMsg("Error al verificar. Intente nuevamente.");
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codigo) doVerify(codigo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    doVerify(searchCode);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <BrandLogo to="/" size="md" />
          <Link to="/login">
            <Button variant="outline" size="sm" className="text-sm">
              Acceso institucional
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-muted mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Verificación de Certificados
          </h1>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Ingrese el código de verificación para comprobar la autenticidad de un certificado emitido por una institución OTEC
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mx-auto max-w-md mb-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Ej: CL-8A3F2B"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="h-12 pl-10 text-base bg-card"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-6 bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
            </Button>
          </div>
        </form>

        {/* Results */}
        {searched && !loading && (
          <div className="animate-fade-in">
            {errorMsg ? (
              <div className="mx-auto max-w-md text-center">
                <div className="rounded-2xl border-2 border-destructive/20 bg-card p-8 shadow-enterprise">
                  <p className="text-sm text-destructive">{errorMsg}</p>
                </div>
              </div>
            ) : result ? (
              <div className="mx-auto max-w-lg">
                <div className="rounded-2xl border-2 border-accent bg-card overflow-hidden shadow-enterprise-lg">
                  {/* Status Banner */}
                  <div className="bg-gradient-accent px-6 py-4 flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-accent-foreground" />
                    <div>
                      <p className="text-base font-bold text-accent-foreground">
                        Certificado Válido
                      </p>
                      <p className="text-sm text-accent-foreground/80">
                        {result.tx_hash
                          ? "Verificado con registro digital inmutable"
                          : "Este certificado ha sido verificado exitosamente"}
                      </p>
                    </div>
                  </div>

                  {/* Certificate Details */}
                  <div className="p-6 space-y-5">
                    {/* Seal */}
                    <div className="flex justify-center py-4">
                      <div className="seal-pulse flex h-20 w-20 items-center justify-center rounded-full bg-primary-muted border-4 border-primary/20">
                        <Award className="h-10 w-10 text-primary" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <DetailRow
                        icon={User}
                        label="Estudiante"
                        value={result.alumnos ? `${result.alumnos.nombre} ${result.alumnos.apellido}` : "—"}
                      />
                      <DetailRow
                        icon={BookOpen}
                        label="Curso"
                        value={result.cursos ? `${result.cursos.nombre} (${result.cursos.horas} horas)` : "—"}
                      />
                      <DetailRow
                        icon={Building2}
                        label="Institución"
                        value={result.otecs?.nombre || "Institución OTEC"}
                      />
                      <DetailRow
                        icon={Calendar}
                        label="Fecha de Emisión"
                        value={new Date(result.fecha_emision).toLocaleDateString("es-CL", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      />
                      <DetailRow
                        icon={ShieldCheck}
                        label="Código de Verificación"
                        value={certificadosService.hashToCode(result.hash_sha256)}
                        mono
                      />
                    </div>

                    {/* On-chain verification badge */}
                    {result.tx_hash && (
                      <div className="rounded-lg border border-accent/30 bg-accent-muted/50 p-3.5">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="h-3.5 w-3.5 text-accent" />
                          <p className="text-xs font-semibold text-accent">Registro Digital Verificado</p>
                        </div>
                        <div className="space-y-1.5 text-[11px] text-muted-foreground">
                          {result.mint_address && (
                            <div className="flex justify-between items-center">
                              <span>ID de credencial:</span>
                              <span className="font-mono">{result.mint_address.substring(0, 12)}...</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span>Transacción:</span>
                            <span className="font-mono">{result.tx_hash.substring(0, 12)}...</span>
                          </div>
                        </div>
                        {result.explorer_url && (
                          <a
                            href={result.explorer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2.5 flex items-center justify-center gap-1.5 rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver registro público completo
                          </a>
                        )}
                      </div>
                    )}

                    <div className="rounded-lg bg-secondary/50 p-3.5 text-center">
                      <p className="text-xs text-muted-foreground">
                        Este certificado fue emitido y registrado de forma segura por la plataforma {APP_NAME}.
                        {result.tx_hash
                          ? " Su autenticidad está respaldada por registro digital inmutable en red distribuida."
                          : " Su autenticidad está respaldada por tecnología de registros inmutables."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-md text-center">
                <div className="rounded-2xl border-2 border-destructive/20 bg-card p-8 shadow-enterprise">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                      <XCircle className="h-7 w-7 text-destructive" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    Certificado No Encontrado
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    No se encontró un certificado válido con el código ingresado. Verifique que el código sea correcto e intente nuevamente.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help section */}
        {!searched && !loading && (
          <div className="mx-auto max-w-md text-center animate-fade-in-delay">
            <p className="text-sm text-muted-foreground">
              Ingrese un código de verificación con formato CL-XXXXXX para consultar la autenticidad de un certificado.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card mt-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 {APP_NAME}. Plataforma de certificación digital para instituciones OTEC en Chile.
          </p>
        </div>
      </footer>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}