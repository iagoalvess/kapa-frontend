/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const pacote = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

// No CI o hash do commit identifica o build melhor que a versão do package.json, que raramente
// é bumpada. Localmente cai na versão mesmo.
const versao = process.env.GITHUB_SHA?.slice(0, 7) ?? pacote.version

export default defineConfig({
  define: {
    __VERSAO__: JSON.stringify(versao),
  },

  plugins: [
    react(),
    // React Compiler: memoiza sozinho. Ver docs/decisoes.md — useMemo/useCallback na mão
    // são proibidos aqui justamente porque este passo já faz o trabalho.
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
    // Falha em vez de escolher outra porta sozinho: a origem precisa bater com o CORS da API.
    strictPort: true,
  },

  build: {
    // Aviso a partir de 600 kB por chunk. Subir o teto em vez de investigar é como o bundle cresce.
    chunkSizeWarningLimit: 600,
    sourcemap: true,
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/components/ui/**'],
    },
  },
})
