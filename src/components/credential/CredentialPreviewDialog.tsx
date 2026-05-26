import { useEffect, useRef, useState } from "react";
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

const DIPLOMA_WIDTH = 1120;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.45);

  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      setScale(Math.min(1, Math.max(0.28, w / DIPLOMA_WIDTH)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Previsualización — Credencial digital
          </DialogTitle>
          <DialogDescription>
            Revise el diploma tal como lo verán terceros en la verificación pública. Al confirmar, se generará el
            archivo en alta resolución, se subirá de forma segura y se registrará la credencial en blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(70vh,680px)] overflow-y-auto rounded-xl border border-border bg-muted/30 p-3 sm:p-5">
          <div ref={containerRef} className="mx-auto w-full overflow-hidden flex justify-center">
            <div
              className="diploma-elegant-frame shrink-0"
              style={{
                width: DIPLOMA_WIDTH * scale,
                height: 792 * scale,
              }}
            >
              <div
                style={{
                  width: DIPLOMA_WIDTH,
                  height: 792,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <DiplomaCertificateFrame {...diploma} />
              </div>
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
