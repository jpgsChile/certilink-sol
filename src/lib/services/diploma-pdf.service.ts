import { jsPDF } from "jspdf";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error("Lectura de imagen fallida"));
    fr.readAsDataURL(blob);
  });
}

/** PDF horizontal A4 con la imagen del diploma a ancho completo. */
export async function buildDiplomaPdfFromPngBlob(pngBlob: Blob): Promise<Blob> {
  const dataUrl = await blobToDataUrl(pngBlob);
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.addImage(dataUrl, "PNG", 0, 0, pageW, pageH, undefined, "MEDIUM");
  return pdf.output("blob");
}
