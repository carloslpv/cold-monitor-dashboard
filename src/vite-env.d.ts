/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the cold-monitor backend. Defaults to http://localhost:8080; empty means the page's own origin. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
