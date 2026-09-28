import { env } from '@/config/env'
import { ROTAS, ROTAS_DO_SITE, urlDoApp } from '@/config/rotas'

/** O primeiro trecho do caminho: `/cobrancas/parcelas` → `/cobrancas`. */
const raiz = (caminho: string) => `/${caminho.split('/')[1]}`

/**
 * O `_redirects` do projeto do site no Cloudflare Pages.
 *
 * Duas regras:
 * - **A versão de um documento** (`/termos-de-uso/2`) abre o HTML do documento, com status 200: a
 *   versão é lida da URL no navegador, e cada versão não precisa de um arquivo próprio.
 * - **Todo caminho do app que chegar ao site vai para o `app.`** com 301, no mesmo caminho (P5 da
 *   Sprint 33) — o e-mail antigo, o favorito e quem digita `kapaformaturas.com.br/login` por hábito. A
 *   lista sai de {@link ROTAS}, por trecho de raiz: `/cobrancas/*` já cobre `/cobrancas/parcelas`, e
 *   rota nova no app entra aqui sem ninguém lembrar. O Pages leva a query string junto.
 *
 * Uma linha por regra, sem tabela alinhada: o Pages lê espaço como separador, e o arquivo é gerado.
 * O Pages **ignora** destino com porta: numa build local (`localhost:5173`) os 301 não valem, e só se
 * testam com `VITE_APP_URL` sem porta.
 *
 * Com a lista de espera (Sprint 36), nenhuma das duas: o app não está no ar — mandar para ele seria
 * trocar o 404 do site por um erro de DNS —, e os documentos com versão saíram do site (P11).
 */
export function redirecionamentos() {
  if (env.VITE_LISTA_DE_ESPERA) return ''

  const doApp = new Set(
    Object.values(ROTAS)
      .filter((caminho) => !ROTAS_DO_SITE.includes(caminho))
      .map(raiz),
  )

  // As exatas antes das com `*`: é a ordem que o Pages casa mais rápido.
  const exatas = [...doApp].map((caminho) => `${caminho} ${urlDoApp(caminho)} 301`)
  const versoes = [ROTAS.termosDeUso, ROTAS.privacidade].map((caminho) => `${caminho}/* ${caminho} 200`)
  const abaixoDoApp = [...doApp].map((caminho) => `${caminho}/* ${urlDoApp(caminho)}/:splat 301`)

  return [...exatas, ...versoes, ...abaixoDoApp].join('\n') + '\n'
}
