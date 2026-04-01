import { imageSize } from "image-size";

/** Plan thumbnails in the list use a small box; uploaded logo images must not exceed this on either side. */
export const PLAN_LOGO_MAX_DIMENSION = 300;

const RASTER_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export function isRasterImageContentType(contentType: string): boolean {
  const t = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return RASTER_IMAGE_TYPES.has(t);
}

/** Whether this file can be chosen as the plan logo (raster only; SVG etc. are attachments only). */
export function canUseAsPlanLogoContentType(contentType: string): boolean {
  return isRasterImageContentType(contentType);
}

/** Returns `true` if valid, or an error message string. */
export function validatePlanRasterImageDimensions(buffer: Buffer): true | string {
  try {
    const r = imageSize(buffer);
    const w = r.width;
    const h = r.height;
    if (typeof w !== "number" || typeof h !== "number") {
      return "Could not read image dimensions";
    }
    if (w > PLAN_LOGO_MAX_DIMENSION || h > PLAN_LOGO_MAX_DIMENSION) {
      return `Image must be at most ${PLAN_LOGO_MAX_DIMENSION}×${PLAN_LOGO_MAX_DIMENSION} pixels (this file is ${w}×${h}).`;
    }
    return true;
  } catch {
    return "Unsupported or invalid image file";
  }
}
