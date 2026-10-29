import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { MODULOS } from '@/config/planos'
import { ROTAS } from '@/config/rotas'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { PLANO_COMPLETO, PLANO_GRATUITO, entrarComo, renderizar } from '@/test/utils'
import { ExigeModulo } from './ExigeModulo'

const PLANOS = `${env.VITE_API_URL}/api/v1/planos`

/** O catálogo: é dele que sai o "Disponível no plano Premium" da vitrine da área. */
const catalogo = [
  { id: 'p-1', codigo: 'essencial', nome: 'Essencial', preco_em_centavos: 2990, modulos: [MODULOS.festa] },
  {
    id: 'p-2',
    codigo: 'premium',
    nome: 'Premium',
    preco_em_centavos: 4990,
    modulos: [MODULOS.festa, MODULOS.mural],
  },
]

/** Uma tela de dentro do guarda que também lê o plano, como o mural. */
function Tela() {
  usePlanoDaTurma()
  return <p>tela do mural</p>
}

describe('ExigeModulo', () => {
  beforeEach(() => servidor.use(http.get(PLANOS, () => HttpResponse.json(catalogo))))
  afterEach(() => sessao.encerrar())

  it('fora do plano, mostra a vitrine da área com o plano mais barato que a libera', async () => {
    entrarComo(PAPEIS.presidente)

    renderizar(<ExigeModulo modulo={MODULOS.mural} />, '/', '*', PLANO_GRATUITO)

    expect(
      screen.getByRole('heading', { name: 'Mural, documentos e o orçamento da festa' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Disponível no plano Premium')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver planos' })).toHaveAttribute('href', ROTAS.planos)
  })

  it('para quem não é o Presidente, diz a quem pedir em vez de levar aos planos', async () => {
    entrarComo(PAPEIS.tesoureiro)

    renderizar(<ExigeModulo modulo={MODULOS.festa} />, '/', '*', PLANO_GRATUITO)

    expect(await screen.findByText('Disponível no plano Essencial')).toBeInTheDocument()
    expect(screen.getByText('Peça ao presidente da comissão para contratar.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver planos' })).not.toBeInTheDocument()
  })

  it('com o módulo no plano, deixa a rota passar', () => {
    entrarComo(PAPEIS.presidente)

    renderizar(<ExigeModulo modulo={MODULOS.mural} />, '/', '*', PLANO_COMPLETO)

    expect(screen.queryByRole('heading', { name: /Mural/ })).not.toBeInTheDocument()
  })
  /**
   * No React Query 5, refazer a leitura que falhou volta a `pending`. Se o guarda tratasse isso como "carregando",
   * a tela de dentro desmontava, remontava, pedia o plano de novo — e com a API em 429, era um laço sem fim.
   */
  it('com a leitura do plano falhando, não entra em laço de requisições', async () => {
    let chamadas = 0
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual/plano`, () => {
        chamadas++
        return HttpResponse.json({ status: 429, codigo: 'limite.excedido' }, { status: 429 })
      }),
    )
    entrarComo(PAPEIS.presidente)

    const router = createMemoryRouter(
      [{ element: <ExigeModulo modulo={MODULOS.mural} />, children: [{ path: '/', element: <Tela /> }] }],
      { initialEntries: ['/'] },
    )
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('tela do mural')).toBeInTheDocument()
    await new Promise((fim) => setTimeout(fim, 500))
    expect(chamadas).toBeLessThanOrEqual(2)
  })
})
