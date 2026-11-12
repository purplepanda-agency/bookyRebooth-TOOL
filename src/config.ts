export const CMS_URL = (import.meta.env.VITE_CMS_URL || "").replace(/\/$/, "");
export const ENTITY_SLUG = (
  import.meta.env.VITE_ENTITY_SLUG || ""
).trim().toLowerCase();

export function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) {
    // Prefer relative path so Vite proxy serves /media in dev
    return path;
  }
  return `${CMS_URL}/${path}`;
}
