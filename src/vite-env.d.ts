/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLATFORM_API_URL: string;
  readonly VITE_HOSTWEB_ORIGIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
