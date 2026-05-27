import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Award, Search, Plus, ExternalLink, Copy, Check, Loader2, Trash2, MoreHorizontal } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { MintProgressModal } from "@/components/MintProgressModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCertificados } from "@/hooks/useCertificados";
import { useAlumnos } from "@/hooks/useAlumnos";
import { useCursos } from "@/hooks/useCursos";
import { useAuth } from "@/hooks/useAuth";
import { useInstitutionProfile } from "@/hooks/useInstitutionProfile";
import { useOtecWallet } from "@/hooks/useOtecWallet";
import { useMintCertificate, type IssueCertificateParams } from "@/hooks/useMintCertificate";
import { isPinataConfigured } from "@/lib/services/pinata.service";
import { DiplomaCaptureHost, type DiplomaCaptureHandle } from "@/components/credential/DiplomaCaptureHost";
import { CredentialPreviewDialog } from "@/components/credential/CredentialPreviewDialog";
import { IssuanceDiagnosticsPanel } from "@/components/operational/IssuanceDiagnosticsPanel";
import type { DiplomaCertificateFrameProps } from "@/components/credential/DiplomaCertificateFrame";
import { useToast } from "@/hooks/use-toast";
import type { Certificado, CursoAlumnoConAlumno } from "@/lib/database.types";
import { certificadosService, certificadoPublicExplorer } from "@/lib/services/certificados.service";
import { cursoAlumnosService } from "@/lib/services/curso-alumnos.service";
import { formatSupabaseUserError } from "@/lib/supabase-error";
import { cleanRut, displayRut, normalizeRut, rutMatchesSearch, validateRut } from "@/lib/utils/rut";
import { brandingToDiplomaExtras, resolveInstitutionBranding } from "@/lib/institution-branding";

export default function Certificates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAlumno, setSelectedAlumno] = useState("");
  const [selectedCurso, setSelectedCurso] = useState("");
  const [cursoEnrollments, setCursoEnrollments] = useState<CursoAlumnoConAlumno[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState<string | null>(null);
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split("T")[0]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [credentialPreviewOpen, setCredentialPreviewOpen] = useState(false);
  const [pendingCredentialIssue, setPendingCredentialIssue] = useState<IssueCertificateParams | null>(null);
  const [credentialIssueSubmitting, setCredentialIssueSubmitting] = useState(false);
  const [retryCertificadoId, setRetryCertificadoId] = useState<string | null>(null);

  const credentialCaptureRef = useRef<DiplomaCaptureHandle | null>(null);
  const { certificados, loading, error: certificadosError, deleteCertificado, emitidosCount, pendientesCount, refetch } =
    useCertificados();
  const { alumnos, loading: alumnosLoading, error: alumnosError } = useAlumnos();
  const { cursos, loading: cursosLoading, error: cursosError } = useCursos();
  const { otec } = useAuth();
  const { profile } = useInstitutionProfile();
  const branding = resolveInstitutionBranding(otec, profile);
  const diplomaBranding = brandingToDiplomaExtras(branding);
  const { isVerified, isConnected } = useOtecWallet();
  const { state: mintState, issueCertificate, reset: resetMint, lastParamsRef } = useMintCertificate(credentialCaptureRef);
  const { toast } = useToast();

  const listsLoading = alumnosLoading || cursosLoading;
  const dialogListsLoading = listsLoading || (!!selectedCurso && enrollmentsLoading);

  const loadCursoEnrollments = useCallback(
    async (cursoId: string) => {
      if (!otec?.id) {
        setCursoEnrollments([]);
        setEnrollmentsError(null);
        return;
      }
      setEnrollmentsLoading(true);
      setEnrollmentsError(null);
      try {
        const rows = await cursoAlumnosService.listByCurso(otec.id, cursoId);
        setCursoEnrollments(rows);
      } catch (err: unknown) {
        setCursoEnrollments([]);
        setEnrollmentsError(formatSupabaseUserError(err));
      } finally {
        setEnrollmentsLoading(false);
      }
    },
    [otec?.id]
  );

  useEffect(() => {
    if (!selectedCurso) {
      setCursoEnrollments([]);
      setEnrollmentsError(null);
      return;
    }
    void loadCursoEnrollments(selectedCurso);
  }, [selectedCurso, loadCursoEnrollments]);

  const approvedCount = useMemo(() => cursoEnrollments.filter((e) => e.aprobado).length, [cursoEnrollments]);

  const mintFailedCount = useMemo(
    () => certificados.filter((c) => c.nft_status === "mint_failed").length,
    [certificados]
  );
  const pendingOnChainCount = useMemo(
    () => certificados.filter((c) => c.nft_status === "pending_onchain" || c.nft_status === "retrying").length,
    [certificados]
  );

  const selectedEnrollment = useMemo(
    () => cursoEnrollments.find((e) => e.alumno_id === selectedAlumno) ?? null,
    [cursoEnrollments, selectedAlumno]
  );

  const canEmitCredential = Boolean(selectedEnrollment?.aprobado);

  useEffect(() => {
    const c = searchParams.get("cursoId");
    const a = searchParams.get("alumnoId");
    if (!c || !a) return;
    setSelectedCurso(c);
    setSelectedAlumno(a);
    setDialogOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("cursoId");
    next.delete("alumnoId");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedCurso) return;
    const ids = new Set(cursoEnrollments.map((e) => e.alumno_id));
    if (selectedAlumno && !ids.has(selectedAlumno)) setSelectedAlumno("");
  }, [selectedCurso, selectedAlumno, cursoEnrollments]);

  const filteredCerts = certificados.filter((c) => {
    const qRaw = search.trim();
    if (!qRaw) return true;
    const studentName = c.alumnos ? `${c.alumnos.nombre} ${c.alumnos.apellido}` : "";
    const courseName = c.cursos?.nombre || "";
    const code = certificadosService.hashToCode(c.hash_sha256);
    const q = qRaw.toLowerCase();
    const rutQ = cleanRut(qRaw);
    const studentRut = c.alumnos?.rut ?? "";
    return (
      studentName.toLowerCase().includes(q) ||
      courseName.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q) ||
      (rutQ.length > 0 && rutMatchesSearch(studentRut, qRaw))
    );
  });

  const credentialPreviewDiploma = useMemo((): DiplomaCertificateFrameProps | null => {
    if (!pendingCredentialIssue) return null;
    const issueDateLabel = new Date(pendingCredentialIssue.fechaEmision).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return {
      institutionName: pendingCredentialIssue.institutionName,
      studentName: pendingCredentialIssue.studentName,
      studentRut: pendingCredentialIssue.studentRut,
      courseName: pendingCredentialIssue.courseName,
      courseHours: pendingCredentialIssue.courseHours,
      issueDateLabel,
      verificationCode: "CL-······",
      verifyUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/verificar`,
      isPreview: true,
      academicLineName: pendingCredentialIssue.academicLineName,
      academicLineDescription: pendingCredentialIssue.academicLineDescription,
      bannerUrl: pendingCredentialIssue.academicLineBannerUrl,
      programUrl: pendingCredentialIssue.programUrl,
      logoUrl: pendingCredentialIssue.diplomaBranding?.logoUrl,
      primaryColor: pendingCredentialIssue.diplomaBranding?.primaryColor,
      secondaryColor: pendingCredentialIssue.diplomaBranding?.secondaryColor,
      certificateAccentColor: pendingCredentialIssue.diplomaBranding?.certificateAccentColor,
      signatureName: pendingCredentialIssue.diplomaBranding?.signatureName,
      signatureRole: pendingCredentialIssue.diplomaBranding?.signatureRole,
      signatureImageUrl: pendingCredentialIssue.diplomaBranding?.signatureImageUrl,
      legalText: pendingCredentialIssue.diplomaBranding?.legalText,
      showBlockchainBadge: pendingCredentialIssue.diplomaBranding?.showBlockchainBadge,
    };
  }, [pendingCredentialIssue]);

  const handleConfirmCredentialPreview = async () => {
    const params = pendingCredentialIssue;
    if (!params || credentialIssueSubmitting) return;
    setCredentialIssueSubmitting(true);
    try {
      setCredentialPreviewOpen(false);
      setMintModalOpen(true);
      const { result, error, certificadoId } = await issueCertificate(params);
      setPendingCredentialIssue(null);
      if (result) {
        setRetryCertificadoId(null);
        await refetch();
        toast({
          title: "Emisión verificada completada",
          description: "Credencial digital con diploma, IPFS y registro blockchain guardada correctamente.",
        });
      } else if (error) {
        if (certificadoId) setRetryCertificadoId(certificadoId);
        toast({ title: "No se pudo completar la emisión", description: error, variant: "destructive" });
      }
    } finally {
      setCredentialIssueSubmitting(false);
    }
  };

  const handleCopy = async (hash: string) => {
    const code = certificadosService.hashToCode(hash);
    const url = `${window.location.origin}/verificar/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(hash);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast({
        title: "No se pudo copiar al portapapeles",
        description: "Copie manualmente la dirección o permita el acceso al portapapeles en el navegador.",
        variant: "destructive",
      });
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialogListsLoading) {
      toast({ title: "Espere un momento", description: "Cargando cursos e inscripciones aprobadas…", variant: "destructive" });
      return;
    }
    if (!selectedAlumno || !selectedCurso) {
      toast({ title: "Error", description: "Seleccione curso y participante aprobado", variant: "destructive" });
      return;
    }

    if (!otec?.id) {
      toast({ title: "Sesión incompleta", description: "No se encontró la institución.", variant: "destructive" });
      return;
    }

    const enrollment = await cursoAlumnosService.getApprovedEnrollment(otec.id, selectedCurso, selectedAlumno);
    if (!enrollment) {
      toast({
        title: "Emisión no permitida",
        description:
          "El participante debe estar inscrito en el curso y marcado como aprobado en Cursos → Participantes del curso.",
        variant: "destructive",
      });
      return;
    }

    // Find selected student and course details
    const alumno = alumnos.find((a) => a.id === selectedAlumno);
    const curso = cursos.find((c) => c.id === selectedCurso);
    if (!alumno || !curso || !otec) return;

    // Check if wallet is connected for blockchain minting
    if (isConnected && isVerified) {
      if (!isPinataConfigured()) {
        toast({
          title: "Configuración incompleta",
          description:
            "Para la emisión verificada con diploma e IPFS, configure VITE_PINATA_JWT en .env (Pinata JWT) y reinicie el entorno.",
          variant: "destructive",
        });
        return;
      }

      setDialogOpen(false);
      setPendingCredentialIssue({
        alumnoId: alumno.id,
        cursoId: curso.id,
        fechaEmision,
        studentName: `${alumno.nombre} ${alumno.apellido}`,
        studentRut: validateRut(alumno.rut) ? normalizeRut(alumno.rut).formatted : alumno.rut,
        institutionName: branding.issuerDisplayName,
        courseName: curso.nombre,
        courseHours: curso.horas,
        academicLineName: curso.lineas_academicas?.nombre ?? null,
        academicLineDescription: curso.lineas_academicas?.descripcion ?? null,
        academicLineBannerUrl: curso.lineas_academicas?.banner_url?.trim() || null,
        programUrl: curso.programa_url?.trim() || null,
        diplomaBranding: {
          logoUrl: diplomaBranding.logoUrl,
          primaryColor: diplomaBranding.primaryColor,
          secondaryColor: diplomaBranding.secondaryColor,
          certificateAccentColor: diplomaBranding.certificateAccentColor,
          signatureName: diplomaBranding.signatureName,
          signatureRole: diplomaBranding.signatureRole,
          signatureImageUrl: diplomaBranding.signatureImageUrl,
          legalText: diplomaBranding.legalText,
          showBlockchainBadge: diplomaBranding.showBlockchainBadge,
        },
      });
      setCredentialPreviewOpen(true);
      return;
    }

    try {
      const cert = await certificadosService.create(otec.id, selectedAlumno, selectedCurso, fechaEmision);
      const code = certificadosService.hashToCode(cert.hash_sha256);
      toast({
        title: "Certificado registrado",
        description: `Código: ${code}. Conecte su billetera institucional para registrarlo en la red de verificación.`,
      });
      await refetch();
      setDialogOpen(false);
      setSelectedAlumno("");
      setSelectedCurso("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al emitir";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteCertificado(deletingId);
      toast({ title: "Certificado eliminado", description: "El certificado fue eliminado" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleMintModalClose = () => {
    setMintModalOpen(false);
    resetMint();
    setSelectedAlumno("");
    setSelectedCurso("");
    setPendingCredentialIssue(null);
    setRetryCertificadoId(null);
  };

  const handleMintRetry = () => {
    const params = lastParamsRef.current;
    if (!params) return;
    setMintModalOpen(true);
    void issueCertificate(params, { existingCertificadoId: retryCertificadoId ?? undefined }).then(({ result, error, certificadoId }) => {
      if (result) {
        setRetryCertificadoId(null);
        void refetch();
      } else if (certificadoId) {
        setRetryCertificadoId(certificadoId);
      }
      if (error) {
        toast({ title: "No se pudo completar la emisión", description: error, variant: "destructive" });
      }
    });
  };

  const columns = [
    {
      key: "estudiante",
      label: "Estudiante",
      render: (_: unknown, row: Record<string, unknown>) => {
        const al = row.alumnos as { nombre: string; apellido: string } | null;
        return al ? `${al.nombre} ${al.apellido}` : "—";
      },
    },
    {
      key: "curso",
      label: "Curso",
      render: (_: unknown, row: Record<string, unknown>) => {
        const cu = row.cursos as { nombre: string } | null;
        return cu?.nombre || "—";
      },
    },
    { key: "fecha_emision", label: "Fecha" },
    {
      key: "hash_sha256",
      label: "Código",
      render: (value: unknown) => {
        const hash = value as string;
        const code = certificadosService.hashToCode(hash);
        return (
          <div className="flex items-center gap-2">
            <code className="rounded-md bg-secondary px-2 py-0.5 text-xs font-mono text-foreground">
              {code}
            </code>
            <button
              onClick={() => handleCopy(hash)}
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {copiedCode === hash ? (
                <Check className="h-3.5 w-3.5 text-accent" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        );
      },
    },
    {
      key: "registro",
      label: "Registro Digital",
      render: (_: unknown, row: Record<string, unknown>) => {
        const cert = row as unknown as Certificado;
        const explorerUrl = certificadoPublicExplorer(cert);
        if (cert.tx_hash && explorerUrl) {
          return (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              Verificado <ExternalLink className="h-3 w-3" />
            </a>
          );
        }
        return <span className="text-xs text-muted-foreground">Pendiente</span>;
      },
    },
    { key: "estado", label: "Estado" },
    {
      key: "acciones",
      label: "",
      render: (_: unknown, row: Record<string, unknown>) => {
        const hash = row.hash_sha256 as string;
        const code = certificadosService.hashToCode(hash);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={`/verificar/${code}`} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" /> Verificar
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-destructive"
                onClick={() => { setDeletingId(row.id as string); setDeleteDialogOpen(true); }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Emisión de Certificados"
        description="Emita y gestione certificados digitales verificables"
        actionLabel="Emitir credencial"
        actionIcon={Plus}
        onAction={() => {
          if (listsLoading) {
            toast({
              title: "Espere un momento",
              description: "Cargando cursos…",
            });
            return;
          }
          setDialogOpen(true);
        }}
      />

      {(certificadosError || alumnosError || cursosError) && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">No se pudieron cargar algunos datos</p>
          <p className="mt-1 text-destructive/90">
            {[certificadosError, alumnosError, cursosError].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-muted">
            <Award className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">En cadena</p>
            <p className="text-lg font-bold text-foreground">{emitidosCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-muted">
            <Award className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Solo registro</p>
            <p className="text-lg font-bold text-foreground">{pendientesCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{certificados.length}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <IssuanceDiagnosticsPanel
          emitidosOnChainCount={emitidosCount}
          pendingOnChainCount={pendingOnChainCount}
          mintFailedCount={mintFailedCount}
        />
      </div>

      {/* Wallet notice */}
      {!isVerified && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-muted p-3.5">
          <Award className="h-5 w-5 text-warning shrink-0" />
          <p className="text-xs text-warning">
            {!isConnected
              ? "Conecte su billetera institucional en el Panel para habilitar el registro en la red de verificación."
              : "La billetera conectada no coincide con la registrada. Los certificados se crearán sin registro digital."}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por estudiante, curso o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Cargando certificados…</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCerts as unknown as Record<string, unknown>[]}
          emptyMessage="No se encontraron certificados. Emita el primero."
        />
      )}

      {/* Issue Certificate Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Emitir credencial</DialogTitle>
            <DialogDescription>
              Elija el curso y el participante inscrito. Solo los marcados como <span className="font-medium text-foreground">aprobados</span> en Cursos pueden emitir credencial.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleIssue} className="space-y-4 mt-2">
            {enrollmentsError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                No se pudieron cargar las inscripciones: {enrollmentsError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select
                value={selectedCurso}
                onValueChange={(v) => {
                  setSelectedCurso(v);
                  setSelectedAlumno("");
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} ({c.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Participante del curso</Label>
              <Select value={selectedAlumno} onValueChange={setSelectedAlumno} disabled={!selectedCurso || enrollmentsLoading}>
                <SelectTrigger className="h-10">
                  <SelectValue
                    placeholder={
                      !selectedCurso
                        ? "Seleccione un curso primero"
                        : enrollmentsLoading
                          ? "Cargando participantes…"
                          : "Seleccionar participante"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {cursoEnrollments.map((en) => {
                    const s = en.alumnos;
                    if (!s) return null;
                    const estado = en.aprobado ? "Aprobado" : "Pendiente de aprobación";
                    return (
                      <SelectItem key={en.id} value={s.id}>
                        {s.nombre} {s.apellido} — {displayRut(s.rut)} · {estado}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedCurso && !enrollmentsLoading && !enrollmentsError && cursoEnrollments.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay participantes inscritos en este curso. Use{" "}
                  <span className="font-medium text-foreground">Cursos → Participantes del curso → Inscribir alumno</span>.
                </p>
              )}
              {selectedCurso && !enrollmentsLoading && !enrollmentsError && cursoEnrollments.length > 0 && approvedCount === 0 && (
                <p className="text-xs text-muted-foreground">
                  Hay {cursoEnrollments.length} participante{cursoEnrollments.length !== 1 ? "s" : ""} inscrito
                  {cursoEnrollments.length !== 1 ? "s" : ""}, pero ninguno está <span className="font-medium text-foreground">aprobado</span>. En{" "}
                  <span className="font-medium text-foreground">Cursos → Participantes del curso</span> use{" "}
                  <span className="font-medium text-foreground">Gestionar → Marcar como aprobado</span>.
                </p>
              )}
              {selectedEnrollment && !selectedEnrollment.aprobado && (
                <p className="text-xs text-amber-800 dark:text-amber-200/90">
                  El participante seleccionado aún no está aprobado; no se puede emitir hasta aprobarlo en Cursos.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fecha de emisión</Label>
              <Input
                type="date"
                className="h-10"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
              />
            </div>

            {/* Blockchain status info */}
            <div className="rounded-lg border border-border bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">
                {dialogListsLoading
                  ? "Cargando datos…"
                  : isVerified
                    ? "Se abrirá una previsualización del diploma. Requiere JWT de Pinata (VITE_PINATA_JWT) y autorización en su billetera institucional."
                    : "El certificado será creado en la base de datos. Conecte su billetera institucional para registrarlo en la red de verificación."}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 gap-2"
                disabled={
                  cursos.length === 0 ||
                  dialogListsLoading ||
                  !selectedCurso ||
                  !selectedAlumno ||
                  cursoEnrollments.length === 0 ||
                  !canEmitCredential
                }
              >
                {dialogListsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                Emitir credencial
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Minting Progress Modal */}
      <MintProgressModal
        open={mintModalOpen}
        onClose={handleMintModalClose}
        step={mintState.step}
        progress={mintState.progress}
        result={mintState.result}
        error={mintState.error}
        onRetry={mintState.step === "error" && lastParamsRef.current ? handleMintRetry : undefined}
      />

      <DiplomaCaptureHost ref={credentialCaptureRef} />

      {credentialPreviewDiploma && (
        <CredentialPreviewDialog
          open={credentialPreviewOpen}
          onOpenChange={(o) => {
            setCredentialPreviewOpen(o);
            if (!o && !credentialIssueSubmitting) setPendingCredentialIssue(null);
          }}
          diploma={credentialPreviewDiploma}
          onConfirm={handleConfirmCredentialPreview}
          loading={credentialIssueSubmitting}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar certificado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el certificado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}