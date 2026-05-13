import * as htmlToImage from "html-to-image";

const CAPTURE_OPTIONS: Parameters<typeof htmlToImage.toBlob>[1] = {
  pixelRatio: 2,
  cacheBust: true,
  backgroundColor: "#f8fafc",
  skipFonts: true,
};

export async function captureDiplomaElementToPngBlob(node: HTMLElement): Promise<Blob> {
  const blob = await htmlToImage.toBlob(node, CAPTURE_OPTIONS);
  if (!blob) {
    throw new Error("No se pudo generar la imagen del diploma");
  }
  return blob;
}
