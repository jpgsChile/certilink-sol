import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  Link2,
  Loader2,
  Share2,
  Shield,
  User,
  Wallet,
  Download,
  Clock,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useStudentAcademicIdentity } from "@/hooks/useStudentAcademicIdentity";
import { useStudentWallet } from "@/hooks/useStudentWallet";
import { useToast } from "@/hooks/use-toast";
import { certificadosService, certificadoPublicExplorer, certificadoExplorerMintUrl } from "@/lib/services/certificados.service";
import { displayRut } from "@/lib/utils/rut";
import type { CertificadoConDetalles } from "@/lib/database.types";
import { APP_NAME } from "@/lib/constants";
import { buildVerifyPageUrl, getPublicAppBaseUrl } from "@/lib/public-app-url";

function verifyUrlForCert(cert: CertificadoConDetalles): string {
  const code = certificadosService.hashToCode(cert.hash_sha256);
  return buildVerifyPageUrl(code);
}

function buildShareSummary(params: {
  nombre: string;
  rut: string;
  institucion: string;
  certificados: CertificadoConDetalles[];
}): string {
  const origin = getPublicAppBaseUrl();
  const lines: string[] = [
    `Identidad académica — ${APP_NAME}`,
    `Persona: ${params.nombre}`,
    `RUT: ${params.rut}`,
    `Institución: ${params.institucion}`,
    "",
    "Credenciales y verificación pública:",
  ];
  for (const c of params.certificados) {
    const curso = c.cursos?.nombre ?? "Programa";
    const code = certificadosService.hashToCode(c.hash_sha256);
    lines.push(`• ${curso} — Código ${code}`);
    lines.push(`  Verificación: ${origin}/verificar/${encodeURIComponent(code)}`);
    if (c.tx_hash) lines.push(`  Registro digital: verificado en red`);
    lines.push("");
  }
  lines.push("Puede compartir cada enlace de verificación con quien deba comprobar una credencial.");
  return lines.join("\n");
}

export default function AcademicIdentity() {
  const { alumnoId } = useParams<{ alumnoId: string }>();
  const { otec } = useAuth();
  const { toast } = useToast();
  const { alumno, certificados, loading, error, forbidden, refetch } = useStudentAcademicIdentity(alumnoId);
  const walletState = useStudentWallet(alumno?.id ?? null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedPageLink, setCopiedPageLink] = useState(false);

  const fullName = alumno ? `${alumno.nombre} ${alumno.apellido}` : "";
  const institucion = otec?.nombre ?? "Institución";

  const shareSummary = useMemo(() => {
    if (!alumno) return "";
    return buildShareSummary({
      nombre: fullName,
      rut: displayRut(alumno.rut),
      institucion,
      certificados,
    });
  }, [alumno, certificados, fullName, institucion]);

  const handleCopySummary = async () => {
    if (!shareSummary) return;
    try {
      await navigator.clipboard.writeText(shareSummary);
      setCopiedSummary(true);
      toast({ title: "Resumen copiado", description: "Péguelo en un correo o mensaje para la persona certificada." });
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  const handleCopyPageLink = async () => {
    if (!alumno) return;
    const url = `${window.location.origin}/identidad-academica/${alumno.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPageLink(true);
      toast({
        title: "Enlace copiado",
        description: "Solo usuarios con acceso institucional podrán abrir esta vista.",
      });
      setTimeout(() => setCopiedPageLink(false), 2000);
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  const handleCopyVerify = async (cert: CertificadoConDetalles) => {
    const url = verifyUrlForCert(cert);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Enlace de verificación copiado" });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  if (forbidden) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">Acceso no autorizado</h2>
          <p className="text-sm text-muted-foreground mt-2">Este perfil no pertenece a su institución.</p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/estudiantes">Volver a estudiantes</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground" asChild>
          <Link to="/estudiantes">
            <ArrowLeft className="h-4 w-4" />
            Estudiantes
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Mi Identidad Académica"
        description={
          loading
            ? "Cargando perfil…"
            : alumno
              ? `Vista portable para ${fullName} — credenciales emitidas por ${institucion}. Sin requisitos de blockchain para la persona certificada.`
              : "Perfil académico y credenciales verificables"
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando identidad y credenciales…</p>
        </div>
      ) : error ? (
        <Card className="max-w-lg border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : !alumno ? (
        <p className="text-muted-foreground">Estudiante no encontrado.</p>
      ) : (
        <div className="space-y-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Identidad
              </CardTitle>
              <CardDescription>Datos registrados en {APP_NAME} para esta institución.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Nombre</p>
                <p className="font-medium">{fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">RUT</p>
                <p className="font-mono text-sm">{displayRut(alumno.rut)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Correo</p>
                <p className="text-sm">{alumno.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Institución</p>
                <p className="text-sm">{institucion}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-primary" />
                Perfil digital (custodia institucional)
              </CardTitle>
              <CardDescription>
                Billetera académica custodial en Solana {walletState.network}. La persona certificada no necesita
                instalar billetera ni conocer blockchain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {walletState.loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : walletState.wallet ? (
                <div className="space-y-2 text-sm">
                  <Badge variant="secondary">Activa</Badge>
                  <p className="font-mono text-xs break-all text-muted-foreground">{walletState.wallet.wallet_address}</p>
                  <p className="text-xs text-muted-foreground">
                    Las credenciales con registro en red se asocian a esta dirección como titular del registro digital.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Se creará automáticamente al emitir la primera credencial digital verificada.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-primary" />
                  Mis Credenciales
                </CardTitle>
                <CardDescription>Historial y enlaces de verificación pública.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleCopySummary} disabled={certificados.length === 0}>
                  {copiedSummary ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                  Compartir resumen
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void handleCopyPageLink()}>
                  {copiedPageLink ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                  Copiar enlace a esta vista
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground -mt-2 mb-4">
              <p>
                Use &quot;Compartir resumen&quot; para enviar códigos y enlaces de verificación pública. La vista interna
                requiere acceso institucional.
              </p>
            </CardContent>
            <CardContent className="space-y-6">
              {certificados.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Aún no hay credenciales emitidas para esta persona.</p>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Línea de tiempo académica
                    </h3>
                    <ol className="relative border-s border-border ms-3 space-y-6 ps-6">
                      {certificados.map((c) => (
                        <li key={c.id} className="ms-1">
                          <span className="absolute -start-1.5 mt-1.5 flex h-3 w-3 rounded-full border border-background bg-primary" />
                          <time className="text-xs text-muted-foreground">
                            {new Date(c.fecha_emision).toLocaleDateString("es-CL", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </time>
                          <p className="text-sm font-medium">{c.cursos?.nombre ?? "Curso"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{certificadosService.hashToCode(c.hash_sha256)}</p>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="space-y-4">
                    {certificados.map((c) => (
                      <Card key={c.id} className="border-border/80 shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-base">{c.cursos?.nombre ?? "Certificación"}</CardTitle>
                              <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(c.fecha_emision).toLocaleDateString("es-CL")}
                                </span>
                                <code className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">
                                  {certificadosService.hashToCode(c.hash_sha256)}
                                </code>
                              </CardDescription>
                            </div>
                            {c.tx_hash ? (
                              <Badge className="shrink-0 bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/20">
                                <BadgeCheck className="h-3 w-3 mr-1" />
                                Verificado en red
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="shrink-0">
                                Registro académico
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap pt-0">
                          <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => void handleCopyVerify(c)}>
                            <Copy className="h-3.5 w-3.5" />
                            Copiar verificación pública
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                            <a href={verifyUrlForCert(c)} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Abrir verificación
                            </a>
                          </Button>
                          {c.tx_hash && certificadoPublicExplorer(c) && (
                            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                              <a href={certificadoPublicExplorer(c)!} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                                Registro digital
                              </a>
                            </Button>
                          )}
                          {certificadoExplorerMintUrl(c) && (
                            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                              <a href={certificadoExplorerMintUrl(c)!} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                                Credencial en explorador
                              </a>
                            </Button>
                          )}
                          {c.ipfs_pdf_url && (
                            <Button type="button" variant="default" size="sm" className="gap-1.5 text-xs" asChild>
                              <a href={c.ipfs_pdf_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Exportación de billetera (preparación)</CardTitle>
              <CardDescription>
                Paso previo a una futura migración a autocustodia: la persona podrá llevar sus credenciales sin depender
                del navegador de la institución.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Hoy la custodia es institucional y transparente para el alumno.</li>
                <li>La exportación firmada y la autocustodia se habilitarán sin romper credenciales ya emitidas.</li>
              </ul>
              <Button type="button" variant="secondary" size="sm" disabled className="w-full sm:w-auto">
                Preparar exportación (próximamente)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
