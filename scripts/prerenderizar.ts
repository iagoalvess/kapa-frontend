/**
 * Pré-renderiza o site (P1 da Sprint 33): um HTML por página, com o texto, o `<title>`, a
 * `description` e as tags `og:` dela — o que o buscador e o preview do WhatsApp leem sem JavaScript.
 *
 * Roda depois das duas builds do `npm run build:site`: a do navegador (`dist-site/`, que traz o
 * `site.html` com os scripts e o CSS com hash) e a do servidor (`dist-site-servidor/`, que traz o
 * `renderizar`). Cada página vira `caminho.html`, que o Cloudflare Pages serve em `/caminho` sem a
 * barra no fim; o caminho que não existe cai no `404.html`, com status 404.
 *
 * Também escreve o que depende da lista de páginas: o `sitemap.xml`, o `_redirects` e, com a lista de
 * espera ligada (Sprint 36), a CSP que deixa entrar o Turnstile.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'

interface PaginaDoSite {
  caminho: string
  titulo: string
  descricao: string
}

interface Servidor {
  PAGINAS: readonly PaginaDoSite[]
  renderizar: (url: string) => Promise<string>
  redirecionamentos: () => string
  listaDeEspera: boolean
}

/** De onde o widget do Turnstile carrega o script e o quadro (docs da Cloudflare). */
const TURNSTILE = 'https://challenges.cloudflare.com'

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
  const arquivo = new URL(pagina.caminho === '/' ? 'index.html' : `${pagina.caminho.slice(1)}.html`, saida)
  // `/lista-de-espera/privacidade` vira `lista-de-espera/privacidade.html`: a pasta precisa existir.
  await mkdir(new URL('.', arquivo), { recursive: true })
  await writeFile(arquivo, montar(pagina, await servidor.renderizar(pagina.caminho), true))
}

// Da mesma lista das páginas: com a lista de espera, os documentos legais saem daqui também (P11).
const urls = servidor.PAGINAS.map((pagina) => `  <url><loc>${urlDoSite}${pagina.caminho}</loc></url>`)
await writeFile(
  new URL('sitemap.xml', saida),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n'),
)

if (servidor.listaDeEspera) await liberarTurnstileNaCsp()

const naoEncontrada = { caminho: '/404', titulo: 'Página não encontrada — Kapa', descricao: '' }
await writeFile(new URL('404.html', saida), montar(naoEncontrada, await servidor.renderizar('/404'), false))

await writeFile(new URL('_redirects', saida), servidor.redirecionamentos())

// O modelo não é página: publicado, `/site` abriria um HTML sem conteúdo.
await rm(new URL('site.html', saida))
await rm(pastaDoServidor, { recursive: true })

/**
 * Acrescenta o Turnstile à CSP do `_headers`: o script e o quadro do widget vêm da Cloudflare. Só no
 * site com a lista de espera — a CSP do app e a do site sem ela ficam como estão. Se o texto da CSP
 * mudar e a troca não casar, a build cai, em vez de publicar um formulário que o navegador bloqueia.
 */
async function liberarTurnstileNaCsp() {
  const arquivo = new URL('_headers', saida)
  const original = await readFile(arquivo, 'utf8')
  const liberada = original
    .replace("script-src 'self'", `script-src 'self' ${TURNSTILE}`)
    .replace('frame-ancestors', `frame-src ${TURNSTILE}; frame-ancestors`)
  if (!liberada.includes(`script-src 'self' ${TURNSTILE}`) || !liberada.includes(`frame-src ${TURNSTILE}`))
    throw new Error('A CSP do _headers mudou: ajuste liberarTurnstileNaCsp.')
  await writeFile(arquivo, liberada)
}

/** A variável como a build a viu: a do ambiente (o Pages) ou, sem ela, a do `.env*` do modo `site`. */
async function lerDoEnv(nome: string) {
  const { loadEnv } = await import('vite')
  const valor = loadEnv('site', process.cwd(), 'VITE_')[nome]
  if (!valor) throw new Error(`${nome} não está definida.`)
  return valor.replace(/\/+$/, '')
}
