import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Award,
  UserPlus,
  Check,
  GraduationCap,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCursos } from "@/hooks/useCursos";
import { useLineasAcademicas } from "@/hooks/useLineasAcademicas";
import { useCursoAlumnos } from "@/hooks/useCursoAlumnos";
import { useAlumnos } from "@/hooks/useAlumnos";
import { useAuth } from "@/hooks/useAuth";
import { useInstitutionProfile } from "@/hooks/useInstitutionProfile";
import { brandingToDiplomaExtras, resolveInstitutionBranding } from "@/lib/institution-branding";
import { useOtecWallet } from "@/hooks/useOtecWallet";
import { useMintCertificate, type IssueCertificateParams } from "@/hooks/useMintCertificate";
import { useBulkIssuanceQueue, createBulkJob } from "@/hooks/useBulkIssuanceQueue";
import { useToast } from "@/hooks/use-toast";
import { formatSupabaseUserError } from "@/lib/supabase-error";
import { cleanRut, displayRut, rutMatchesSearch, validateRut, normalizeRut } from "@/lib/utils/rut";
import { certificadosService } from "@/lib/services/certificados.service";
import { isPinataConfigured } from "@/lib/services/pinata.service";
import { DiplomaCaptureHost, type DiplomaCaptureHandle } from "@/components/credential/DiplomaCaptureHost";
import { BulkIssuanceDashboard } from "@/components/credential/BulkIssuanceDashboard";
import type { Certificado } from "@/lib/database.types";
import type { Curso, CursoAlumnoConAlumno, CursoAlumnoEstado } from "@/lib/database.types";

const emptyForm = { codigo: "", nombre: "", horas: "", descripcion: "", programa_url: "", linea_academica_id: "" };

const estadoLabels: Record<CursoAlumnoEstado, string> = {
  inscrito: "Inscrito",
  en_curso: "En curso",
  finalizado: "Finalizado",
  retirado: "Retirado",
};

/** Copia curso/OTEC al abrir el modal: el Sheet anidado puede perder `participantsCurso` y el submit quedaba en silencio. */
type EnrollTarget = { cursoId: string; otecId: string };

export default function Courses() {
  const navigate = useNavigate();
  const { otec } = useAuth();
  const { profile } = useInstitutionProfile();
  const branding = resolveInstitutionBranding(otec, profile);
  const diplomaBranding = brandingToDiplomaExtras(branding);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [participantsCurso, setParticipantsCurso] = useState<Curso | null>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollAlumnoId, setEnrollAlumnoId] = useState("");
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<EnrollTarget | null>(null);
  const [editParticipant, setEditParticipant] = useState<CursoAlumnoConAlumno | null>(null);
  const [editNota, setEditNota] = useState("");
  const [editAsistencia, setEditAsistencia] = useState("");
  const [editEstado, setEditEstado] = useState<CursoAlumnoEstado>("inscrito");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [selectedApprovedIds, setSelectedApprovedIds] = useState<Set<string>>(new Set());
  const [cursoCertByAlumno, setCursoCertByAlumno] = useState<
    Map<string, Pick<Certificado, "id" | "tx_hash" | "hash_sha256">>
  >(new Map());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkDashboardOpen, setBulkDashboardOpen] = useState(false);
  const [bulkFechaEmision, setBulkFechaEmision] = useState(new Date().toISOString().split("T")[0]);

  const bulkCaptureRef = useRef<DiplomaCaptureHandle | null>(null);
  const { issueCertificate } = useMintCertificate(bulkCaptureRef);
  const bulkQueue = useBulkIssuanceQueue(issueCertificate);
  const { isVerified, isConnected } = useOtecWallet();

  const { cursos, loading, createCurso, updateCurso, deleteCurso } = useCursos();
  const { lineas } = useLineasAcademicas();
  const { alumnos, loading: alumnosLoading, error: alumnosError, refetch: refetchAlumnos } = useAlumnos();
  const {
    inscripciones,
    loading: inscripcionesLoading,
    error: inscripcionesError,
    enroll,
    patchInscripcion,
    removeInscripcion,
  } = useCursoAlumnos(participantsCurso?.id ?? null);
  const { toast } = useToast();

  const enrolledIds = useMemo(() => new Set(inscripciones.map((i) => i.alumno_id)), [inscripciones]);
  const alumnosDisponibles = useMemo(
    () => alumnos.filter((a) => !enrolledIds.has(a.id)),
    [alumnos, enrolledIds]
  );

  const alumnosDisponiblesFiltrados = useMemo(() => {
    const raw = enrollSearch.trim();
    const q = raw.toLowerCase();
    if (!raw) return alumnosDisponibles;
    const rutQ = cleanRut(raw);
    return alumnosDisponibles.filter((a) => {
      const blob = `${a.nombre} ${a.apellido} ${a.rut} ${a.email ?? ""}`.toLowerCase();
      return blob.includes(q) || (rutQ.length > 0 && rutMatchesSearch(a.rut, raw));
    });
  }, [alumnosDisponibles, enrollSearch]);

  useEffect(() => {
    if (!enrollAlumnoId) return;
    if (!alumnosDisponiblesFiltrados.some((a) => a.id === enrollAlumnoId)) {
      setEnrollAlumnoId("");
    }
  }, [enrollAlumnoId, alumnosDisponiblesFiltrados]);

  const sortedInscripciones = useMemo(() => {
    return [...inscripciones].sort((a, b) => {
      const na = a.alumnos ? `${a.alumnos.apellido} ${a.alumnos.nombre}` : "";
      const nb = b.alumnos ? `${b.alumnos.apellido} ${b.alumnos.nombre}` : "";
      return na.localeCompare(nb, "es");
    });
  }, [inscripciones]);

  const participantsCursoDetail = useMemo(
    () => (participantsCurso ? cursos.find((c) => c.id === participantsCurso.id) ?? participantsCurso : null),
    [participantsCurso, cursos]
  );

  const approvedInscripciones = useMemo(
    () => sortedInscripciones.filter((row) => row.aprobado),
    [sortedInscripciones]
  );

  const loadCursoCertSummaries = useCallback(async (cursoId: string) => {
    if (!otec?.id) {
      setCursoCertByAlumno(new Map());
      return;
    }
    try {
      const rows = await certificadosService.listSummariesByCurso(otec.id, cursoId);
      const map = new Map<string, Pick<Certificado, "id" | "tx_hash" | "hash_sha256">>();
      for (const row of rows) map.set(row.alumno_id, row);
      setCursoCertByAlumno(map);
    } catch {
      setCursoCertByAlumno(new Map());
    }
  }, [otec?.id]);

  useEffect(() => {
    if (!participantsCurso?.id) {
      setCursoCertByAlumno(new Map());
      setSelectedApprovedIds(new Set());
      return;
    }
    void loadCursoCertSummaries(participantsCurso.id);
    setSelectedApprovedIds(new Set());
  }, [participantsCurso?.id, loadCursoCertSummaries]);

  const filteredCourses = cursos.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingCurso(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setForm({
      codigo: curso.codigo,
      nombre: curso.nombre,
      horas: curso.horas.toString(),
      descripcion: curso.descripcion || "",
      programa_url: curso.programa_url || "",
      linea_academica_id: curso.linea_academica_id || "",
    });
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const openParticipants = (curso: Curso) => {
    setSelectedApprovedIds(new Set());
    setParticipantsCurso(curso);
  };

  const toggleApprovedSelection = (alumnoId: string) => {
    setSelectedApprovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(alumnoId)) next.delete(alumnoId);
      else next.add(alumnoId);
      return next;
    });
  };

  const selectAllApprovedEligible = () => {
    const eligible = approvedInscripciones.filter((row) => {
      const cert = cursoCertByAlumno.get(row.alumno_id);
      return !cert?.tx_hash;
    });
    setSelectedApprovedIds(new Set(eligible.map((r) => r.alumno_id)));
  };

  const buildIssueParams = (row: CursoAlumnoConAlumno, curso: Curso, fecha: string): IssueCertificateParams | null => {
    const al = row.alumnos;
    if (!al || !otec) return null;
    return {
      alumnoId: row.alumno_id,
      cursoId: curso.id,
      fechaEmision: fecha,
      studentName: `${al.nombre} ${al.apellido}`,
      studentRut: validateRut(al.rut) ? normalizeRut(al.rut).formatted : al.rut,
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
    };
  };

  const openBulkConfirm = () => {
    if (!participantsCursoDetail || !otec) return;
    if (selectedApprovedIds.size === 0) {
      toast({ title: "Seleccione participantes", description: "Marque al menos un participante aprobado.", variant: "destructive" });
      return;
    }
    if (!isConnected || !isVerified) {
      toast({
        title: "Billetera requerida",
        description: "Conecte y verifique su billetera institucional para emitir credenciales en blockchain.",
        variant: "destructive",
      });
      return;
    }
    if (!isPinataConfigured()) {
      toast({
        title: "Configuración incompleta",
        description: "Configure VITE_PINATA_JWT para emisión verificada con diploma e IPFS.",
        variant: "destructive",
      });
      return;
    }
    setBulkConfirmOpen(true);
  };

  const startBulkIssuance = async () => {
    const curso = participantsCursoDetail;
    if (!curso || !otec) return;

    const rows = approvedInscripciones.filter((r) => selectedApprovedIds.has(r.alumno_id));
    const jobs = rows.map((row) => {
      const cert = cursoCertByAlumno.get(row.alumno_id);
      const params = buildIssueParams(row, curso, bulkFechaEmision);
      if (!params) {
        return createBulkJob({
          alumnoId: row.alumno_id,
          studentName: row.alumnos ? `${row.alumnos.nombre} ${row.alumnos.apellido}` : "Participante",
          studentRut: row.alumnos?.rut ?? "",
          params: {
            alumnoId: row.alumno_id,
            cursoId: curso.id,
            fechaEmision: bulkFechaEmision,
            studentName: "",
            studentRut: "",
            institutionName: otec.nombre,
            courseName: curso.nombre,
            courseHours: curso.horas,
          },
          status: "skipped",
          skipReason: "Datos del participante incompletos",
        });
      }
      if (cert?.tx_hash) {
        return createBulkJob({
          alumnoId: row.alumno_id,
          studentName: params.studentName,
          studentRut: params.studentRut,
          params,
          certificadoId: cert.id,
          status: "skipped",
          skipReason: "Credencial ya emitida con registro blockchain",
        });
      }
      return createBulkJob({
        alumnoId: row.alumno_id,
        studentName: params.studentName,
        studentRut: params.studentRut,
        params,
        certificadoId: cert?.id ?? null,
      });
    });

    setBulkConfirmOpen(false);
    setBulkDashboardOpen(true);
    await bulkQueue.enqueueAndStart(jobs);
    if (participantsCurso?.id) void loadCursoCertSummaries(participantsCurso.id);
  };

  const handleBulkDashboardClose = () => {
    if (bulkQueue.running) return;
    setBulkDashboardOpen(false);
    bulkQueue.reset();
    setSelectedApprovedIds(new Set());
    if (participantsCurso?.id) void loadCursoCertSummaries(participantsCurso.id);
  };

  const openEnroll = () => {
    if (!otec || !participantsCurso) {
      toast({
        title: "No se puede inscribir",
        description: "Falta la sesión de la institución o el curso. Cierre el panel y vuelva a abrir «Participantes del curso».",
        variant: "destructive",
      });
      return;
    }
    setEnrollTarget({ cursoId: participantsCurso.id, otecId: otec.id });
    setEnrollAlumnoId("");
    setEnrollSearch("");
    void refetchAlumnos();
    setEnrollDialogOpen(true);
  };

  const openEditParticipant = (row: CursoAlumnoConAlumno) => {
    setEditParticipant(row);
    setEditNota(row.nota != null ? String(row.nota) : "");
    setEditAsistencia(row.asistencia != null ? String(row.asistencia) : "");
    setEditEstado(row.estado);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        codigo: form.codigo,
        nombre: form.nombre,
        horas: parseInt(form.horas) || 0,
        descripcion: form.descripcion || null,
        programa_url: form.programa_url.trim() || null,
        linea_academica_id: form.linea_academica_id.trim() || null,
      };
      if (editingCurso) {
        await updateCurso(editingCurso.id, payload);
        toast({ title: "Curso actualizado", description: `${form.nombre} fue actualizado` });
      } else {
        await createCurso(payload);
        toast({ title: "Curso creado", description: `${form.nombre} fue registrado` });
      }
      setDialogOpen(false);
      setForm(emptyForm);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteCurso(deletingId);
      toast({ title: "Curso eliminado", description: "El curso fue eliminado exitosamente" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const submitEnrollment = async () => {
    if (enrollSubmitting) return;
    const target = enrollTarget;
    if (!target) {
      toast({
        title: "Contexto perdido",
        description: "Cierre el diálogo, vuelva a abrir «Participantes del curso» e intente de nuevo.",
        variant: "destructive",
      });
      return;
    }
    if (!enrollAlumnoId) {
      toast({
        title: "Seleccione un alumno",
        description: "Elija un participante en la lista desplegable antes de confirmar.",
        variant: "destructive",
      });
      return;
    }
    setEnrollSubmitting(true);
    try {
      await enroll({
        curso_id: target.cursoId,
        alumno_id: enrollAlumnoId,
        otec_id: target.otecId,
        estado: "inscrito",
        nota: null,
        asistencia: null,
        aprobado: false,
        fecha_inscripcion: new Date().toISOString().split("T")[0],
      });
      toast({ title: "Inscripción registrada", description: "El alumno fue agregado al curso." });
      setEnrollDialogOpen(false);
      setEnrollAlumnoId("");
      setEnrollSearch("");
      setEnrollTarget(null);
    } catch (err: unknown) {
      toast({
        title: "No se pudo inscribir",
        description: formatSupabaseUserError(err),
        variant: "destructive",
      });
    } finally {
      setEnrollSubmitting(false);
    }
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    void submitEnrollment();
  };

  const handleToggleAprobado = async (row: CursoAlumnoConAlumno) => {
    try {
      await patchInscripcion(row.id, { aprobado: !row.aprobado });
      toast({
        title: row.aprobado ? "Aprobación revocada" : "Participante aprobado",
        description: row.aprobado
          ? "El participante ya no figura como aprobado."
          : "Puede proceder a emitir la credencial desde certificados.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleRemoveParticipant = async (id: string) => {
    try {
      await removeInscripcion(id);
      toast({ title: "Participante retirado", description: "Se eliminó la inscripción del curso." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleSaveEditParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editParticipant) return;
    const notaParsed = editNota.trim() === "" ? null : Number(editNota);
    const asisParsed = editAsistencia.trim() === "" ? null : Number(editAsistencia);
    if (notaParsed != null && (Number.isNaN(notaParsed) || notaParsed < 0)) {
      toast({ title: "Nota inválida", description: "Ingrese un número válido o deje el campo vacío.", variant: "destructive" });
      return;
    }
    if (asisParsed != null && (Number.isNaN(asisParsed) || asisParsed < 0 || asisParsed > 100)) {
      toast({
        title: "Asistencia inválida",
        description: "Use un porcentaje entre 0 y 100 o deje el campo vacío.",
        variant: "destructive",
      });
      return;
    }
    setEditSubmitting(true);
    try {
      await patchInscripcion(editParticipant.id, {
        estado: editEstado,
        nota: notaParsed,
        asistencia: asisParsed,
      });
      toast({ title: "Datos actualizados", description: "Se guardaron nota, asistencia y estado." });
      setEditParticipant(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setEditSubmitting(false);
    }
  };

  const goEmitCredential = (cursoId: string, alumnoId: string) => {
    navigate(`/certificados?cursoId=${encodeURIComponent(cursoId)}&alumnoId=${encodeURIComponent(alumnoId)}`);
    setParticipantsCurso(null);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Gestión de Cursos"
        description="Administre los programas de capacitación de su institución"
        actionLabel="Nuevo Curso"
        actionIcon={Plus}
        onAction={openCreate}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2 shrink-0" asChild>
          <Link to="/lineas-academicas">
            <GraduationCap className="h-4 w-4" />
            Líneas académicas
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground sm:ml-auto">
          {loading ? "Cargando..." : `${filteredCourses.length} curso${filteredCourses.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="card-enterprise p-12 text-center">
          <p className="text-muted-foreground text-sm">No se encontraron cursos. Cree el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <div key={course.id} className="card-enterprise flex flex-col justify-between p-5">
              <div>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">{course.codigo}</p>
                    <h3 className="text-base font-semibold leading-snug text-foreground">{course.nombre}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => openParticipants(course)}>
                        <Users className="h-3.5 w-3.5" /> Participantes del curso
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => openEdit(course)}>
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive" onClick={() => openDelete(course.id)}>
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {course.descripcion && (
                  <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{course.descripcion}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {course.horas} hrs
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {new Date(course.created_at).toLocaleDateString("es-CL")}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => openParticipants(course)}
                >
                  <Users className="h-3.5 w-3.5" />
                  Participantes
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-1 pr-2">
            <DialogTitle>{editingCurso ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
            <DialogDescription>
              {editingCurso ? "Modifique los datos del curso" : "Registre un nuevo programa de capacitación"}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Nombre del curso</Label>
              <Input
                placeholder="Gestión de Proyectos"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="h-10"
                required
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  placeholder="GP-2024"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  className="h-10"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Horas</Label>
                <Input
                  type="number"
                  placeholder="120"
                  value={form.horas}
                  onChange={(e) => setForm({ ...form, horas: e.target.value })}
                  className="h-10"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                placeholder="Descripción del programa de capacitación..."
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={3}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Línea académica (opcional)</Label>
              <Select
                value={form.linea_academica_id || "__none__"}
                onValueChange={(v) => setForm({ ...form, linea_academica_id: v === "__none__" ? "" : v })}
                disabled={submitting}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sin línea asignada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin línea asignada</SelectItem>
                  {lineas.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Defina líneas en{" "}
                <Link to="/lineas-academicas" className="font-medium text-primary hover:underline">
                  Líneas académicas
                </Link>{" "}
                para asociar descripción, sitio y banner institucional.
                {lineas.length === 0 && (
                  <span className="block mt-1 text-warning-foreground/90">
                    Aún no hay líneas registradas.{" "}
                    <Link to="/lineas-academicas" className="font-medium text-primary hover:underline">
                      Crear la primera
                    </Link>
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Enlace al programa en la web (opcional)</Label>
              <Input
                type="url"
                placeholder="https://www.institución.cl/programa"
                value={form.programa_url}
                onChange={(e) => setForm({ ...form, programa_url: e.target.value })}
                className="h-10"
                disabled={submitting}
              />
            </div>
            <DialogFooter className="gap-2 pt-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                  </span>
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet
        open={!!participantsCurso}
        onOpenChange={(o) => !o && setParticipantsCurso(null)}
        modal={!enrollDialogOpen}
      >
        <SheetContent className="flex w-full max-w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle>Participantes del curso</SheetTitle>
            <SheetDescription className="line-clamp-2">
              {participantsCurso ? `${participantsCurso.codigo} · ${participantsCurso.nombre}` : ""}
            </SheetDescription>
          </SheetHeader>

          {inscripcionesError && (
            <div className="mx-4 mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {inscripcionesError}
            </div>
          )}
          {alumnosError && (
            <div className="mx-4 mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              No se pudieron cargar los alumnos: {alumnosError}
            </div>
          )}

          <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" size="sm" className="gap-1.5 shrink-0" onClick={openEnroll} disabled={alumnosLoading}>
                {alumnosLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Inscribir alumno
              </Button>
              {approvedInscripciones.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={selectAllApprovedEligible}>
                    Seleccionar elegibles
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5 h-8 bg-gradient-primary text-primary-foreground hover:opacity-90"
                    onClick={openBulkConfirm}
                    disabled={selectedApprovedIds.size === 0 || bulkQueue.running}
                  >
                    <Award className="h-3.5 w-3.5" />
                    Emitir credenciales ({selectedApprovedIds.size})
                  </Button>
                </div>
              )}
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">
              {alumnosLoading
                ? "Cargando alumnos de la institución…"
                : alumnos.length === 0 ? (
                    <>
                      Sin alumnos registrados.{" "}
                      <Link to="/estudiantes" className="font-medium text-accent underline-offset-2 hover:underline">
                        Ir a Estudiantes
                      </Link>
                    </>
                  ) : alumnosDisponibles.length === 0 ? (
                    "Todos los alumnos de su institución ya figuran en este curso."
                  ) : (
                    <>
                      {alumnosDisponibles.length} alumno{alumnosDisponibles.length !== 1 ? "s" : ""} disponible
                      {alumnosDisponibles.length !== 1 ? "s" : ""} para inscribir.
                    </>
                  )}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
            {inscripcionesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : sortedInscripciones.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay participantes inscritos. Use &quot;Inscribir alumno&quot; para comenzar el flujo operativo.
              </p>
            ) : (
              <ul className="space-y-3">
                {sortedInscripciones.map((row) => {
                  const al = row.alumnos;
                  const nombre = al ? `${al.nombre} ${al.apellido}` : `Alumno (${row.alumno_id.slice(0, 8)}…)`;
                  const cert = cursoCertByAlumno.get(row.alumno_id);
                  const hasBlockchain = Boolean(cert?.tx_hash);
                  const canBulkSelect = row.aprobado && !hasBlockchain;
                  const isSelected = selectedApprovedIds.has(row.alumno_id);
                  return (
                    <li
                      key={row.id}
                      className={`rounded-xl border bg-card p-4 shadow-sm ${isSelected ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          {canBulkSelect ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleApprovedSelection(row.alumno_id)}
                              className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
                              aria-label={`Seleccionar ${nombre} para emisión masiva`}
                            />
                          ) : (
                            <span className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                          )}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-sm font-semibold leading-snug text-foreground">{nombre}</p>
                            <p className="text-xs text-muted-foreground">{displayRut(al?.rut)}</p>
                            {hasBlockchain && (
                              <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                Credencial emitida · {certificadosService.hashToCode(cert!.hash_sha256)}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={
                            row.aprobado
                              ? "shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400"
                              : "shrink-0 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                          }
                        >
                          {row.aprobado ? "Aprobado" : "Pendiente"}
                        </span>
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div>
                          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Estado
                          </dt>
                          <dd className="mt-0.5 text-foreground">{estadoLabels[row.estado]}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Nota</dt>
                          <dd className="mt-0.5 tabular-nums text-foreground">{row.nota != null ? row.nota : "—"}</dd>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Asistencia
                          </dt>
                          <dd className="mt-0.5 tabular-nums text-foreground">
                            {row.asistencia != null ? `${row.asistencia}%` : "—"}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4 space-y-2 border-t border-border pt-3">
                        {!row.aprobado ? (
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 w-full gap-2"
                            onClick={() => void handleToggleAprobado(row)}
                          >
                            <Check className="h-4 w-4 shrink-0" />
                            Marcar como aprobado
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-9 w-full gap-2"
                            onClick={() => {
                              if (participantsCurso) goEmitCredential(participantsCurso.id, row.alumno_id);
                            }}
                          >
                            <Award className="h-4 w-4 shrink-0" />
                            Emitir credencial digital
                          </Button>
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 min-w-0 flex-1 gap-2"
                            onClick={() => openEditParticipant(row)}
                          >
                            <Pencil className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Nota y asistencia</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 shrink-0 px-3"
                                aria-label="Más acciones sobre el participante"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[13rem]">
                              {row.aprobado && (
                                <DropdownMenuItem onSelect={() => void handleToggleAprobado(row)}>
                                  Revocar aprobación
                                </DropdownMenuItem>
                              )}
                              {!row.aprobado && (
                                <DropdownMenuItem onSelect={() => void handleToggleAprobado(row)}>
                                  Marcar como aprobado
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => void handleRemoveParticipant(row.id)}
                              >
                                Quitar del curso
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            Flujo operativo: apruebe participantes, selecciónelos y use{" "}
            <span className="font-medium text-foreground">Emitir credenciales</span> para emisión masiva con diploma, IPFS y
            registro blockchain. También puede emitir de forma individual desde Certificados.
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={enrollDialogOpen}
        onOpenChange={(o) => {
          setEnrollDialogOpen(o);
          if (!o) {
            setEnrollAlumnoId("");
            setEnrollSearch("");
            setEnrollTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inscribir alumno</DialogTitle>
            <DialogDescription>
              Seleccione un alumno de su institución que aún no esté en este curso. Puede buscar por nombre, RUT o correo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-4">
            {alumnosError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {alumnosError}
              </div>
            )}

            {alumnosLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                Cargando listado de alumnos…
              </div>
            ) : alumnos.length === 0 ? (
              <div className="rounded-lg border border-border bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
                <p className="mb-3">Aún no hay alumnos registrados en su institución.</p>
                <Button type="button" variant="secondary" size="sm" asChild>
                  <Link to="/estudiantes">Registrar alumnos en Estudiantes</Link>
                </Button>
              </div>
            ) : alumnosDisponibles.length === 0 ? (
              <div className="rounded-lg border border-border bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
                Todos los alumnos de su institución ya están inscritos en este curso. Puede gestionar la lista abajo o
                registrar nuevos alumnos en{" "}
                <Link to="/estudiantes" className="font-medium text-accent underline-offset-2 hover:underline">
                  Estudiantes
                </Link>
                .
              </div>
            ) : (
              <>
                {alumnosDisponibles.length > 6 && (
                  <div className="space-y-2">
                    <Label htmlFor="enroll-filter">Buscar alumno</Label>
                    <Input
                      id="enroll-filter"
                      placeholder="Nombre, apellido, RUT o correo…"
                      value={enrollSearch}
                      onChange={(e) => setEnrollSearch(e.target.value)}
                      className="h-10"
                      autoComplete="off"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Alumno</Label>
                  <Select value={enrollAlumnoId || undefined} onValueChange={setEnrollAlumnoId}>
                    <SelectTrigger className="h-10 w-full min-w-0">
                      <SelectValue placeholder="Seleccionar alumno" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="max-h-60 w-[var(--radix-select-trigger-width)]">
                      {alumnosDisponiblesFiltrados.length === 0 ? (
                        <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                          Ningún alumno coincide con la búsqueda. Borre el filtro o ajuste el texto.
                        </p>
                      ) : (
                        alumnosDisponiblesFiltrados.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <span className="truncate">
                              {a.nombre} {a.apellido} — {displayRut(a.rut)}
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEnrollDialogOpen(false)}
                disabled={enrollSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={
                  enrollSubmitting ||
                  alumnosLoading ||
                  !enrollAlumnoId ||
                  alumnosDisponibles.length === 0 ||
                  !enrollTarget
                }
                onClick={() => void submitEnrollment()}
              >
                {enrollSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar inscripción"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editParticipant} onOpenChange={(o) => !o && setEditParticipant(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar participante</DialogTitle>
            <DialogDescription>
              {editParticipant?.alumnos
                ? `${editParticipant.alumnos.nombre} ${editParticipant.alumnos.apellido}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEditParticipant} className="space-y-4">
            <div className="space-y-2">
              <Label>Estado de la inscripción</Label>
              <Select value={editEstado} onValueChange={(v) => setEditEstado(v as CursoAlumnoEstado)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(estadoLabels) as CursoAlumnoEstado[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {estadoLabels[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nota</Label>
                <Input value={editNota} onChange={(e) => setEditNota(e.target.value)} placeholder="Ej. 6.2" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Asistencia (%)</Label>
                <Input
                  value={editAsistencia}
                  onChange={(e) => setEditAsistencia(e.target.value)}
                  placeholder="0–100"
                  className="h-10"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditParticipant(null)} disabled={editSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el curso y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Emitir credenciales</DialogTitle>
            <DialogDescription>
              Se procesarán {selectedApprovedIds.size} participante{selectedApprovedIds.size !== 1 ? "s" : ""} aprobado
              {selectedApprovedIds.size !== 1 ? "s" : ""} en cola secuencial. Deberá autorizar cada registro en su billetera
              institucional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-fecha">Fecha de emisión</Label>
            <Input
              id="bulk-fecha"
              type="date"
              value={bulkFechaEmision}
              onChange={(e) => setBulkFechaEmision(e.target.value)}
              className="h-10"
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setBulkConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => void startBulkIssuance()}
            >
              Iniciar emisión masiva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkIssuanceDashboard
        open={bulkDashboardOpen}
        onOpenChange={(o) => {
          if (!o) handleBulkDashboardClose();
          else setBulkDashboardOpen(true);
        }}
        jobs={bulkQueue.jobs}
        stats={bulkQueue.stats}
        running={bulkQueue.running}
        overallProgress={bulkQueue.overallProgress}
        activeJob={bulkQueue.activeJob}
        courseLabel={
          participantsCursoDetail
            ? `${participantsCursoDetail.codigo} · ${participantsCursoDetail.nombre}`
            : undefined
        }
        onRetryFailed={() => void bulkQueue.retryFailed()}
        onClose={handleBulkDashboardClose}
      />

      <DiplomaCaptureHost ref={bulkCaptureRef} />
    </DashboardLayout>
  );
}
