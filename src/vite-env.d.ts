/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CMS_URL: string;
  /** Alleen gebruikt op localhost. */
  readonly VITE_ENTITY_SLUG?: string;
  readonly VITE_RECAPTCHA_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
