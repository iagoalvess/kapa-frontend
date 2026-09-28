/**
 * Pré-renderiza o site (P1 da Sprint 33): um HTML por página, com o texto, o `<title>`, a
 * `description` e as tags `og:` dela — o que o buscador e o preview do WhatsApp leem sem JavaScript.
 *
 * Roda depois das duas builds do `npm run build:site`: a do navegador (`dist-site/`, que traz o
 * `site.html` com os scripts e o CSS com hash) e a do servidor (`dist-site-servidor/`, que traz o
 * `renderizar`). Cada página vira `caminho.html`, que o Cloudflare Pages serve em `/caminho` sem a
 * barra no fim; o caminho que não existe cai no `404.html`, com status 404.
 */
import { readFile, rm, writeFile } from 'node:fs/promises'

interface PaginaDoSite {
  caminho: string
  titulo: string
  descricao: string
}

interface Servidor {
  PAGINAS: readonly PaginaDoSite[]
  renderizar: (url: string) => Promise<string>
  redirecionamentos: () => string
}

const saida = new URL('../dist-site/', import.meta.url)
const pastaDoServidor = new URL('../dist-site-servidor/', import.meta.url)
const servidor = (await import(new URL('servidor.js', pastaDoServidor).href)) as Servidor

const urlDoSite = await lerDoEnv('VITE_SITE_URL')
const modelo = await readFile(new URL('site.html', saida), 'utf8')

const escapar = (texto: string) =>
  texto.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

function montar(pagina: PaginaDoSite, conteudo: string, indexavel: boolean) {
  const endereco = `${urlDoSite}${pagina.caminho}`
  const cabeca = [
    `<title>${escapar(pagina.titulo)}</title>`,
    `<meta name="description" content="${escapar(pagina.descricao)}" />`,
    `<meta property="og:title" content="${escapar(pagina.titulo)}" />`,
    `<meta property="og:description" content="${escapar(pagina.descricao)}" />`,
    indexavel
      ? `<link rel="canonical" href="${endereco}" />\n    <meta property="og:url" content="${endereco}" />`
      : '<meta name="robots" content="noindex" />',
  ].join('\n    ')

  return modelo.replace('<!--cabeca-->', cabeca).replace('<!--conteudo-->', conteudo)
}

for (const pagina of servidor.PAGINAS) {
  const arquivo = pagina.caminho === '/' ? 'index.html' : `${pagina.caminho.slice(1)}.html`
  await writeFile(new URL(arquivo, saida), montar(pagina, await servidor.renderizar(pagina.caminho), true))
}

const naoEncontrada = { caminho: '/404', titulo: 'Página não encontrada — Kapa', descricao: '' }
await writeFile(new URL('404.html', saida), montar(naoEncontrada, await servidor.renderizar('/404'), false))

await writeFile(new URL('_redirects', saida), servidor.redirecionamentos())

// O modelo não é página: publicado, `/site` abriria um HTML sem conteúdo.
await rm(new URL('site.html', saida))
await rm(pastaDoServidor, { recursive: true })

/** A variável como a build a viu: a do ambiente (o Pages) ou, sem ela, a do `.env*` do modo `site`. */
async function lerDoEnv(nome: string) {
  const { loadEnv } = await import('vite')
  const valor = loadEnv('site', process.cwd(), 'VITE_')[nome]
  if (!valor) throw new Error(`${nome} não está definida.`)
  return valor.replace(/\/+$/, '')
}
