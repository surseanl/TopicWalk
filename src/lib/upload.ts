const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
};

const MAX_BYTES = 10 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type))
    return "Only image files (JPEG, PNG, WebP, HEIC, GIF) are allowed.";
  if (file.size > MAX_BYTES) return "Photo must be under 10 MB.";
  return null;
}

export function imageExt(file: File): string {
  return MIME_TO_EXT[file.type] ?? "jpg";
}
