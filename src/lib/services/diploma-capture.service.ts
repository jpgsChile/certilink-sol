import * as htmlToImage from "html-to-image";

const CAPTURE_OPTIONS: Parameters<typeof htmlToImage.toBlob>[1] = {
  pixelRatio: 3,
  cacheBust: true,
  backgroundColor: "#faf9f6",
  skipFonts: true,
};

export async function captureDiplomaElementToPngBlob(node: HTMLElement): Promise<Blob> {
  const blob = await htmlToImage.toBlob(node, CAPTURE_OPTIONS);
  if (!blob) {
    throw new Error("No se pudo generar la imagen del diploma");
  }
  return blob;
}
