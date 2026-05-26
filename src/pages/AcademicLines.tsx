import { useState, type FormEvent } from "react";
import { GraduationCap, Search, MoreHorizontal, Pencil, Trash2, Loader2, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLineasAcademicas } from "@/hooks/useLineasAcademicas";
import { useToast } from "@/hooks/use-toast";
import { formatSupabaseUserError } from "@/lib/supabase-error";
import type { LineaAcademica } from "@/lib/database.types";

const emptyForm = { nombre: "", descripcion: "", sitio_web: "", banner_url: "" };

export default function AcademicLines() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLinea, setEditingLinea] = useState<LineaAcademica | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const { lineas, loading, error, createLinea, updateLinea, deleteLinea } = useLineasAcademicas();
  const { toast } = useToast();

  const filteredLineas = lineas.filter((l) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      l.nombre.toLowerCase().includes(q) ||
      (l.descripcion ?? "").toLowerCase().includes(q) ||
      (l.sitio_web ?? "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditingLinea(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (linea: LineaAcademica) => {
    setEditingLinea(linea);
    setForm({
      nombre: linea.nombre,
      descripcion: linea.descripcion ?? "",
      sitio_web: linea.sitio_web ?? "",
      banner_url: linea.banner_url ?? "",
    });
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Indique el nombre de la línea académica.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const row = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        sitio_web: form.sitio_web.trim() || null,
        banner_url: form.banner_url.trim() || null,
      };
      if (editingLinea) {
        await updateLinea(editingLinea.id, row);
        toast({ title: "Línea actualizada", description: row.nombre });
      } else {
        await createLinea(row);
        toast({ title: "Línea creada", description: row.nombre });
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingLinea(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: formatSupabaseUserError(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteLinea(deletingId);
      toast({ title: "Línea eliminada", description: "La línea académica fue eliminada." });
    } catch (err: unknown) {
      toast({ title: "Error", description: formatSupabaseUserError(err), variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const columns = [
    { key: "nombre", label: "Nombre" },
    {
      key: "descripcion",
      label: "Descripción",
      render: (v: unknown) => {
        const text = (v as string | null)?.trim();
        if (!text) return "—";
        return text.length > 80 ? `${text.slice(0, 80)}…` : text;
      },
    },
    {
      key: "sitio_web",
      label: "Sitio web",
      render: (v: unknown) => {
        const url = (v as string | null)?.trim();
        if (!url) return "—";
        return (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[200px]">
            {url.replace(/^https?:\/\//, "")}
          </a>
        );
      },
    },
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
            <DropdownMenuItem className="gap-2" onClick={() => openEdit(row as unknown as LineaAcademica)}>
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
        title="Líneas académicas"
        description="Defina el catálogo de líneas de su institución para asociarlas a cursos y mostrar información en la verificación pública"
        actionLabel="Nueva línea"
        actionIcon={Plus}
        onAction={openCreate}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {loading ? "Cargando..." : `${filteredLineas.length} línea${filteredLineas.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredLineas as unknown as Record<string, unknown>[]}
          emptyMessage="No hay líneas académicas. Cree la primera para asignarla a sus cursos."
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-1 pr-2">
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {editingLinea ? "Editar línea académica" : "Nueva línea académica"}
            </DialogTitle>
            <DialogDescription>
              La descripción, sitio web y banner se muestran en la verificación pública de certificados vinculados a cursos de esta línea.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Formación continua"
                className="h-10"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={3}
                disabled={submitting}
                placeholder="Texto breve visible en la cabecera de verificación…"
              />
            </div>
            <div className="space-y-2">
              <Label>Sitio web (opcional)</Label>
              <Input
                type="url"
                value={form.sitio_web}
                onChange={(e) => setForm({ ...form, sitio_web: e.target.value })}
                placeholder="https://www.institución.cl"
                className="h-10"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label>URL del banner (opcional)</Label>
              <Input
                type="url"
                value={form.banner_url}
                onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                placeholder="https://…/banner.png"
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando…
                  </span>
                ) : editingLinea ? (
                  "Guardar cambios"
                ) : (
                  "Crear línea"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar línea académica?</AlertDialogTitle>
            <AlertDialogDescription>
              Los cursos que la tengan asignada quedarán sin línea. Esta acción no elimina cursos ni certificados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
