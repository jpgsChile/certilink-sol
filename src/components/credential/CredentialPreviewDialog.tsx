import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DiplomaCertificateFrame, type DiplomaCertificateFrameProps } from "./DiplomaCertificateFrame";
import { Award } from "lucide-react";

type CredentialPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diploma: DiplomaCertificateFrameProps;
  onConfirm: () => void;
  loading?: boolean;
};

export function CredentialPreviewDialog({
  open,
  onOpenChange,
  diploma,
  onConfirm,
  loading,
}: CredentialPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Previsualización — Credencial digital
          </DialogTitle>
          <DialogDescription>
            Revise el diploma tal como lo verán terceros en la verificación pública. Al confirmar, se generará el
            archivo, se subirá de forma segura y se registrará la credencial en blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(70vh,640px)] overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
          <div className="mx-auto w-full overflow-x-auto flex justify-center pb-2">
            <div
              className="origin-top scale-[0.32] sm:scale-[0.42] md:scale-[0.5]"
              style={{ width: 1120, height: 792 }}
            >
              <DiplomaCertificateFrame {...diploma} />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Volver
          </Button>
          <Button
            type="button"
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Procesando…" : "Confirmar emisión verificada"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
