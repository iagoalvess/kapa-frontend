/// <reference types="vite/client" />

/** Versão do build, injetada pelo Vite. Hash do commit no CI, versão do package.json local. */
declare const __VERSAO__: string

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NOME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
