/// <reference types="vitest/config" />
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { type Plugin, defineConfig, loadEnv } from 'vite'

const pacote = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

// No CI o hash do commit identifica o build melhor que a versão do package.json, que raramente
// é bumpada. Localmente cai na versão mesmo.
const versao = process.env.GITHUB_SHA?.slice(0, 7) ?? pacote.version

/**
 * Os arquivos que o Cloudflare Pages lê na raiz de cada projeto (Sprint 33): `borda/` vai para as
 * duas builds, `borda/app/` e `borda/site/` só para a sua. Os `%VITE_*%` viram o valor do ambiente,
 * como o Vite faz no HTML — é assim que a CSP recebe o endereço da API. Variável faltando derruba a
 * build: CSP com o marcador literal bloquearia a API em produção sem aviso.
 */
function arquivosDaBorda(lado: 'app' | 'site', ambiente: Record<string, string>): Plugin {
  return {
    name: 'arquivos-da-borda',
    apply: (_, { command, isSsrBuild }) => command === 'build' && !isSsrBuild,
    generateBundle() {
      for (const pasta of ['borda', `borda/${lado}`]) {
        for (const arquivo of readdirSync(pasta, { withFileTypes: true }).filter((item) => item.isFile())) {
          const caminho = `${pasta}/${arquivo.name}`
          const conteudo = readFileSync(caminho, 'utf8').replaceAll(/%(VITE_\w+)%/g, (_, nome: string) => {
            const valor = ambiente[nome]
            if (!valor) throw new Error(`${caminho} usa ${nome}, que não está definida.`)
            return valor.replace(/\/+$/, '')
          })
          this.emitFile({ type: 'asset', fileName: arquivo.name, source: conteudo })
        }
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  // Duas builds do mesmo código (Sprint 33): o app (`index.html` → `dist/`) e o site pré-renderizado
  // (`site.html` → `dist-site/`), cada uma no seu projeto do Pages. Ver docs/operacao/deploy.md.
  const site = mode === 'site'

  return {
    define: {
      __VERSAO__: JSON.stringify(versao),
    },

    plugins: [
      react(),
      // React Compiler: memoiza sozinho. Ver docs/decisoes.md — useMemo/useCallback na mão
      // são proibidos aqui justamente porque este passo já faz o trabalho.
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      arquivosDaBorda(site ? 'site' : 'app', loadEnv(mode, process.cwd(), 'VITE_')),
      // No dev do site, toda navegação abre o site.html — sem isto o Vite serviria o index.html do app.
      site && {
        name: 'dev-do-site',
        configureServer: (servidor) => {
          servidor.middlewares.use((requisicao, _, seguir) => {
            if (requisicao.headers.accept?.includes('text/html')) requisicao.url = '/site.html'
            seguir()
          })
        },
      },
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      port: site ? 5180 : 5173,
      // Falha em vez de escolher outra porta sozinho: a origem precisa bater com o CORS da API.
      strictPort: true,
    },

    build: {
      outDir: site ? 'dist-site' : 'dist',
      ...(site ? { rolldownOptions: { input: 'site.html' } } : {}),
      // Aviso a partir de 600 kB por chunk. Subir o teto em vez de investigar é como o bundle cresce.
      chunkSizeWarningLimit: 600,
      sourcemap: true,
      // Fonte nunca vira `data:`: a CSP (`borda/_headers`) tem `font-src 'self'`, e o woff2 pequeno que o Vite
      // embutiria no CSS era bloqueado em produção. O resto segue o limite padrão (imagem em `data:`
      // a CSP libera).
      assetsInlineLimit: (arquivo) => (/\.(woff2?|ttf|otf)$/.test(arquivo) ? false : undefined),
    },

    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      // O padrão do Vitest são 5s, e um teste de formulário com `userEvent` gasta metade disso só
      // digitando — cada tecla é um evento. Com a suíte inteira em paralelo, os mais lentos passavam
      // sozinhos e falhavam no conjunto, sem nada a ver com o que testam. O teto maior não esconde
      // regressão: teste quebrado falha por asserção, não por relógio.
      testTimeout: 15_000,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/components/ui/**'],
      },
    },
  }
})
