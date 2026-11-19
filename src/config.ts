export const CMS_URL = (import.meta.env.VITE_CMS_URL || "").replace(/\/$/, "");

/** Alleen voor lokaal testen. Live kiest de entiteit via het domein. */
export const ENTITY_SLUG = (
  import.meta.env.VITE_ENTITY_SLUG || ""
).trim().toLowerCase();

export function isLocalDevHost(host = "") {
  const name = host.trim().toLowerCase().replace(/:\d+$/, "");
  return (
    name === "localhost" ||
    name === "127.0.0.1" ||
    name === "0.0.0.0" ||
    name.endsWith(".localhost")
  );
}
export const RECAPTCHA_SITE_KEY = (
  import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""
).trim();

export function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return CMS_URL ? `${CMS_URL}${normalized}` : normalized;
}
