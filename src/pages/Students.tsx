import { useState, type FormEvent } from "react";
import { UserPlus, Search, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAlumnos } from "@/hooks/useAlumnos";
import { useToast } from "@/hooks/use-toast";
import type { Alumno } from "@/lib/database.types";

const emptyForm = { nombre: "", apellido: "", rut: "", email: "", telefono: "" };

export default function Students() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAlumno, setEditingAlumno] = useState<Alumno | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const { alumnos, loading, createAlumno, updateAlumno, deleteAlumno } = useAlumnos();
  const { toast } = useToast();

  const filteredStudents = alumnos.filter(
    (s) =>
      s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      s.apellido.toLowerCase().includes(search.toLowerCase()) ||
      s.rut.includes(search) ||
      (s.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingAlumno(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (alumno: Alumno) => {
    setEditingAlumno(alumno);
    setForm({
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      rut: alumno.rut,
      email: alumno.email ?? "",
      telefono: alumno.telefono || "",
    });
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAlumno) {
        await updateAlumno(editingAlumno.id, form);
        toast({ title: "Estudiante actualizado", description: `${form.nombre} ${form.apellido} fue actualizado` });
      } else {
        await createAlumno(form);
        toast({ title: "Estudiante creado", description: `${form.nombre} ${form.apellido} fue inscrito` });
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
      await deleteAlumno(deletingId);
      toast({ title: "Estudiante eliminado", description: "El registro fue eliminado exitosamente" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const columns = [
    {
      key: "nombre",
      label: "Nombre",
      render: (_: unknown, row: Record<string, unknown>) =>
        `${row.nombre} ${row.apellido}`,
    },
    { key: "rut", label: "RUT" },
    { key: "email", label: "Correo" },
    { key: "telefono", label: "Teléfono", render: (v: unknown) => (v as string) || "—" },
    {
      key: "acciones",
      label: "Acciones",
      render: (_: unknown, row: Record<string, unknown>) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-md p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onClick={() => openEdit(row as unknown as Alumno)}>
              <Pencil className="h-3.5 w-3.5" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => openDelete(row.id as string)}>
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Gestión de Estudiantes"
        description="Administre los estudiantes inscritos en su institución"
        actionLabel="Nuevo Estudiante"
        actionIcon={UserPlus}
        onAction={openCreate}
      />

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, RUT o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {loading ? "Cargando..." : `${filteredStudents.length} estudiante${filteredStudents.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredStudents as unknown as Record<string, unknown>[]}
          emptyMessage="No se encontraron estudiantes. Agregue el primero."
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAlumno ? "Editar Estudiante" : "Nuevo Estudiante"}</DialogTitle>
            <DialogDescription>
              {editingAlumno
                ? "Modifique los datos del estudiante"
                : "Complete los datos para inscribir un nuevo estudiante"}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  placeholder="María"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="h-10"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input
                  placeholder="González"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  className="h-10"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>RUT</Label>
              <Input
                placeholder="12.345.678-9"
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
                className="h-10"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                placeholder="maria@mail.cl"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-10"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono (opcional)</Label>
              <Input
                placeholder="+56 9 1234 5678"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="h-10"
                disabled={submitting}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                  </span>
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el registro del estudiante permanentemente.
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