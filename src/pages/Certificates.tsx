import { useState } from "react";
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
import { useOtecWallet } from "@/hooks/useOtecWallet";
import { useMintCertificate, type IssueCertificateParams } from "@/hooks/useMintCertificate";
import { useToast } from "@/hooks/use-toast";
import { certificadosService } from "@/lib/services/certificados.service";

export default function Certificates() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAlumno, setSelectedAlumno] = useState("");
  const [selectedCurso, setSelectedCurso] = useState("");
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split("T")[0]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [mintModalOpen, setMintModalOpen] = useState(false);

  const { certificados, loading, deleteCertificado, emitidosCount, pendientesCount, refetch } = useCertificados();
  const { alumnos } = useAlumnos();
  const { cursos } = useCursos();
  const { otec } = useAuth();
  const { isVerified, isConnected } = useOtecWallet();
  const { state: mintState, issueCertificate, reset: resetMint } = useMintCertificate();
  const { toast } = useToast();

  const filteredCerts = certificados.filter((c) => {
    const studentName = c.alumnos ? `${c.alumnos.nombre} ${c.alumnos.apellido}` : "";
    const courseName = c.cursos?.nombre || "";
    const code = certificadosService.hashToCode(c.hash_sha256);
    const q = search.toLowerCase();
    return (
      studentName.toLowerCase().includes(q) ||
      courseName.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q)
    );
  });

  const handleCopy = (hash: string) => {
    const code = certificadosService.hashToCode(hash);
    navigator.clipboard.writeText(`${window.location.origin}/verificar/${code}`);
    setCopiedCode(hash);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlumno || !selectedCurso) {
      toast({ title: "Error", description: "Seleccione estudiante y curso", variant: "destructive" });
      return;
    }

    // Find selected student and course details
    const alumno = alumnos.find((a) => a.id === selectedAlumno);
    const curso = cursos.find((c) => c.id === selectedCurso);
    if (!alumno || !curso || !otec) return;

    // Check if wallet is connected for blockchain minting
    if (isConnected && isVerified) {
      // Full blockchain minting flow
      setDialogOpen(false);
      setMintModalOpen(true);

      const params: IssueCertificateParams = {
        alumnoId: alumno.id,
        cursoId: curso.id,
        fechaEmision,
        studentName: `${alumno.nombre} ${alumno.apellido}`,
        studentRut: alumno.rut,
        institutionName: otec.nombre,
        courseName: curso.nombre,
        courseHours: curso.horas,
      };

      const result = await issueCertificate(params);
      if (result) {
        await refetch();
      }
    } else {
      // Database-only flow (no blockchain, for when wallet is not connected)
      try {
        const cert = await certificadosService.create(
          otec.id,
          selectedAlumno,
          selectedCurso,
          fechaEmision
        );
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
        const txHash = row.tx_hash as string | null;
        const explorerUrl = row.explorer_url as string | null;
        if (txHash && explorerUrl) {
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
        actionLabel="Emitir Certificado"
        actionIcon={Plus}
        onAction={() => setDialogOpen(true)}
      />

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-muted">
            <Award className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Emitidos</p>
            <p className="text-lg font-bold text-foreground">{emitidosCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-muted">
            <Award className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
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
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
            <DialogTitle>Emitir Certificado</DialogTitle>
            <DialogDescription>
              Seleccione el estudiante y curso para generar un certificado digital verificable
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4 mt-2" onSubmit={handleIssue}>
            <div className="space-y-2">
              <Label>Estudiante</Label>
              <Select value={selectedAlumno} onValueChange={setSelectedAlumno}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {alumnos.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre} {s.apellido} - {s.rut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Curso completado</Label>
              <Select value={selectedCurso} onValueChange={setSelectedCurso}>
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
                {isVerified
                  ? "El certificado será registrado en la red de verificación digital con su autorización institucional."
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
                disabled={alumnos.length === 0 || cursos.length === 0}
              >
                <Award className="h-4 w-4" />
                Emitir Certificado
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
      />

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