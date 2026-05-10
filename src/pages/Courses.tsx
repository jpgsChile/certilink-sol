import { useState } from "react";
import { Plus, Search, Clock, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { useCursos } from "@/hooks/useCursos";
import { useToast } from "@/hooks/use-toast";
import type { Curso } from "@/lib/database.types";

const emptyForm = { codigo: "", nombre: "", horas: "", descripcion: "" };

export default function Courses() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const { cursos, loading, createCurso, updateCurso, deleteCurso } = useCursos();
  const { toast } = useToast();

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
    });
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Gestión de Cursos"
        description="Administre los programas de capacitación de su institución"
        actionLabel="Nuevo Curso"
        actionIcon={Plus}
        onAction={openCreate}
      />

      {/* Search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {loading ? "Cargando..." : `${filteredCourses.length} curso${filteredCourses.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Course Cards */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="card-enterprise p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No se encontraron cursos. Cree el primero.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <div key={course.id} className="card-enterprise p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{course.codigo}</p>
                    <h3 className="text-base font-semibold text-foreground leading-snug">{course.nombre}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-md p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{course.descripcion}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {course.horas} hrs
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
                <span className="text-[11px] text-muted-foreground">
                  {new Date(course.created_at).toLocaleDateString("es-CL")}
                </span>
                <span className="badge-success">Activo</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCurso ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
            <DialogDescription>
              {editingCurso
                ? "Modifique los datos del curso"
                : "Registre un nuevo programa de capacitación"}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
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
            <div className="grid grid-cols-2 gap-4">
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
            <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el curso y todos sus datos asociados.
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