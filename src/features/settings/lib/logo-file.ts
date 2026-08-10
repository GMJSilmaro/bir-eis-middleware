const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
]);

/** Soft cap after compression — schema allows 500_000. */
export const MAX_LOGO_DATA_URL_LENGTH = 450_000;
/** Reject oversized source files before attempting compress. */
export const MAX_SOURCE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_EDGE_PX = 256;

export const LOGO_ACCEPT =
  "image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg";

export function isAcceptedLogoType(type: string): boolean {
  return ACCEPTED_TYPES.has(type.toLowerCase());
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read that file."));
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image could not be opened."));
    img.src = src;
  });
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number,
): string {
  return canvas.toDataURL(mime, quality);
}

/**
 * Convert an uploaded logo file to a size-bounded data URL suitable for DB storage.
 */
export async function fileToLogoDataUrl(file: File): Promise<string> {
  if (!isAcceptedLogoType(file.type)) {
    throw new Error("Use a PNG, JPG, WebP, or SVG logo.");
  }
  if (file.size > MAX_SOURCE_FILE_BYTES) {
    throw new Error("Logo must be 5 MB or smaller.");
  }

  if (file.type === "image/svg+xml") {
    const dataUrl = await readFileAsDataUrl(file);
    if (dataUrl.length > MAX_LOGO_DATA_URL_LENGTH) {
      throw new Error("That SVG is too large. Try a simpler or smaller file.");
    }
    return dataUrl;
  }

  const source = await readFileAsDataUrl(file);
  const img = await loadImage(source);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height, 1));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image.");
  ctx.drawImage(img, 0, 0, width, height);

  const preferPng = file.type === "image/png";
  const attempts: Array<{ mime: string; quality: number }> = preferPng
    ? [
        { mime: "image/png", quality: 1 },
        { mime: "image/webp", quality: 0.85 },
        { mime: "image/jpeg", quality: 0.82 },
        { mime: "image/webp", quality: 0.7 },
        { mime: "image/jpeg", quality: 0.65 },
      ]
    : [
        { mime: "image/webp", quality: 0.88 },
        { mime: "image/jpeg", quality: 0.85 },
        { mime: "image/webp", quality: 0.72 },
        { mime: "image/jpeg", quality: 0.68 },
      ];

  for (const attempt of attempts) {
    const dataUrl = canvasToDataUrl(canvas, attempt.mime, attempt.quality);
    if (dataUrl.length <= MAX_LOGO_DATA_URL_LENGTH) return dataUrl;
  }

  throw new Error(
    "That logo is still too large after compression. Try a smaller image.",
  );
}
