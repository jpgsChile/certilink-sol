import { useCallback, useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { validateInstitutionImageFile } from "@/lib/image-optimize";

type LogoUploadZoneProps = {
  currentUrl?: string | null;
  label?: string;
  hint?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  disabled?: boolean;
  aspectSquare?: boolean;
};

export function LogoUploadZone({
  currentUrl,
  label = "Logo institucional",
  hint = "PNG, JPG o SVG · máx. 2 MB · cuadrado recomendado",
  onUpload,
  onRemove,
  disabled,
  aspectSquare = true,
}: LogoUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewBroken, setPreviewBroken] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const err = validateInstitutionImageFile(file);
      if (err) throw new Error(err);
      setUploading(true);
      try {
        await onUpload(file);
        setPreviewBroken(false);
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files[0];
    if (!file) return;
    try {
      await handleFile(file);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await handleFile(file);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const showPreview = Boolean(currentUrl?.trim()) && !previewBroken;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {showPreview && onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-destructive hover:text-destructive"
            disabled={disabled || uploading}
            onClick={() => void onRemove()}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Eliminar
          </Button>
        ) : null}
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => void onDrop(e)}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
          aspectSquare ? "aspect-square max-w-[220px]" : "min-h-[140px]",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-secondary/50",
          (disabled || uploading) && "pointer-events-none opacity-60"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => void onInputChange(e)}
          disabled={disabled || uploading}
        />

        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : showPreview ? (
          <img
            src={currentUrl!}
            alt="Vista previa"
            className="max-h-[85%] max-w-[85%] object-contain"
            onError={() => setPreviewBroken(true)}
          />
        ) : (
          <>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              {dragging ? (
                <Upload className="h-5 w-5 text-primary" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground">Arrastre o haga clic</p>
            <p className="mt-1 px-4 text-center text-xs text-muted-foreground">{hint}</p>
          </>
        )}
      </div>
    </div>
  );
}
