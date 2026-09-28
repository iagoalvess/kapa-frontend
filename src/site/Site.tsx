import { QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { PaginaNaoEncontrada } from '@/components/layout/PaginaNaoEncontrada'
import { env } from '@/config/env'
import { ROTAS, SUFIXO_DE_VERSAO } from '@/config/rotas'
import { queryClient } from '@/lib/query/client'
import { paginaDo } from './paginas'

// `React.lazy`, e não o `lazy` de rota do app: é o que o `prerender` espera resolver no servidor e o
// que o `hydrateRoot` aguarda sem descartar o HTML que já chegou pronto.
const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'))
const TermosPage = lazy(() => import('@/features/legal/pages/TermosPage'))
const PrivacidadePage = lazy(() => import('@/features/legal/pages/PrivacidadePage'))
const OperadoresPage = lazy(() => import('@/features/privacidade/pages/OperadoresPage'))
const AvisoDaListaDeEsperaPage = lazy(() => import('@/features/landing/pages/AvisoDaListaDeEsperaPage'))

/**
 * O site (`kapaformaturas.com.br`): a página institucional e os documentos legais (Sprint 33).
 *
 * É uma build à parte do app, pré-renderizada — cada página sai como HTML com o texto dentro, e o
 * React só assume os eventos no navegador. Sem sessão, sem guarda e sem `LayoutApp`: o login mora no
 * app, e o que o site sabe dele é o endereço (`urlDoApp`).
 *
 * Os documentos continuam lendo o texto da API (P3): o cadastro no app mostra a mesma versão.
 *
 * Com a lista de espera ligada (Sprint 36, P11), os documentos saem e entra o aviso da lista — e o
 * site não chama a API em nada. As rotas acompanham `PAGINAS`.
 */
export function Site() {
  return (
    <QueryClientProvider client={queryClient}>
      <TituloDaPagina />
      <Suspense>
        <Routes>
          <Route index element={<LandingPage />} />
          {env.VITE_LISTA_DE_ESPERA ? (
            <Route path={ROTAS.avisoDaListaDeEspera} element={<AvisoDaListaDeEsperaPage />} />
          ) : (
            <>
              <Route path={ROTAS.termosDeUso + SUFIXO_DE_VERSAO} element={<TermosPage />} />
              <Route path={ROTAS.privacidade + SUFIXO_DE_VERSAO} element={<PrivacidadePage />} />
              <Route path={ROTAS.operadores} element={<OperadoresPage />} />
            </>
          )}
          <Route path="*" element={<PaginaNaoEncontrada destino={ROTAS.landing} />} />
        </Routes>
      </Suspense>
    </QueryClientProvider>
  )
}

/**
 * O `<title>` ao navegar entre as páginas sem recarregar. O da primeira carga já vem no HTML
 * pré-renderizado; este só acompanha os cliques do rodapé.
 */
function TituloDaPagina() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = paginaDo(pathname).titulo
  }, [pathname])

  return null
}
