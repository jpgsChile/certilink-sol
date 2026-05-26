import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { DiplomaCertificateFrame, type DiplomaCertificateFrameProps } from "./DiplomaCertificateFrame";
import { captureDiplomaElementToPngBlob } from "@/lib/services/diploma-capture.service";

export type DiplomaCaptureHandle = {
  captureToPng: (data: DiplomaCertificateFrameProps) => Promise<Blob>;
};

export const DiplomaCaptureHost = forwardRef<DiplomaCaptureHandle, object>(function DiplomaCaptureHost(_, ref) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [payload, setPayload] = useState<DiplomaCertificateFrameProps | null>(null);

  useImperativeHandle(ref, () => ({
    async captureToPng(data) {
      setPayload(data);
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 120));
      const node = innerRef.current?.querySelector(".diploma-export-root") as HTMLElement | null;
      if (!node) {
        setPayload(null);
        throw new Error("No se pudo preparar el lienzo del diploma");
      }
      try {
        return await captureDiplomaElementToPngBlob(node);
      } finally {
        setPayload(null);
      }
    },
  }));

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed -left-[12000px] top-0 overflow-visible"
      style={{ zIndex: -1 }}
    >
      <div ref={innerRef}>
        {payload ? <DiplomaCertificateFrame {...payload} /> : null}
      </div>
    </div>
  );
});
