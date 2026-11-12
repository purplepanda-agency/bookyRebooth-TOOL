/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CMS_URL: string;
  readonly VITE_ENTITY_SLUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
