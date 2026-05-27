/** Validación y optimización de imágenes institucionales (client-side). */

export const INSTITUTION_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const INSTITUTION_LOGO_MAX_PX = 512;

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
]);

export type OptimizedImage = {
  blob: Blob;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  dataUrl: string;
};

export function validateInstitutionImageFile(file: File): string | null {
  if (!ALLOWED_MIME.has(file.type)) {
    return "Formato no permitido. Use PNG, JPG, SVG o WebP.";
  }
  if (file.size > INSTITUTION_LOGO_MAX_BYTES) {
    return "El archivo supera el límite de 2 MB.";
  }
  return null;
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/svg+xml":
      return "svg";
    case "image/webp":
      return "webp";
    default:
      return "png";
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error("Lectura fallida"));
    fr.readAsDataURL(blob);
  });
}

/** Redimensiona raster; SVG se devuelve sin transformar. */
export async function optimizeInstitutionImage(file: File): Promise<OptimizedImage> {
  const validationError = validateInstitutionImageFile(file);
  if (validationError) throw new Error(validationError);

  if (file.type === "image/svg+xml") {
    const dataUrl = await blobToDataUrl(file);
    return {
      blob: file,
      mimeType: file.type,
      extension: "svg",
      width: 0,
      height: 0,
      dataUrl,
    };
  }

  const img = await loadImageFromFile(file);
  const maxSide = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = maxSide > INSTITUTION_LOGO_MAX_PX ? INSTITUTION_LOGO_MAX_PX / maxSide : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(img, 0, 0, width, height);

  const mimeType = file.type === "image/webp" ? "image/webp" : "image/png";
  const quality = mimeType === "image/webp" ? 0.88 : undefined;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Optimización fallida"))),
      mimeType,
      quality
    );
  });

  if (blob.size > INSTITUTION_LOGO_MAX_BYTES) {
    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Optimización fallida"))), "image/jpeg", 0.85);
    });
    const dataUrl = await blobToDataUrl(jpegBlob);
    return { blob: jpegBlob, mimeType: "image/jpeg", extension: "jpg", width, height, dataUrl };
  }

  const dataUrl = await blobToDataUrl(blob);
  return { blob, mimeType, extension: extensionForMime(mimeType), width, height, dataUrl };
}
