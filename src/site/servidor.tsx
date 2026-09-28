import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import { Site } from './Site'

export { PAGINAS } from './paginas'
export { redirecionamentos } from './redirecionamentos'

/**
 * O HTML de uma página do site, com as partes preguiçosas já resolvidas.
 *
 * É a ponta de servidor da build do site: `scripts/prerenderizar.ts` chama isto para cada página na
 * hora da build. O que depende da API (preços, texto dos documentos) sai no esqueleto e é carregado
 * no navegador — o buscador lê o texto da página, e o preço continua o mesmo do checkout.
 *
 * @param url O caminho da página.
 */
export async function renderizar(url: string) {
  const { prelude } = await prerender(
    <StaticRouter location={url}>
      <Site />
    </StaticRouter>,
  )

  return new Response(prelude).text()
}
