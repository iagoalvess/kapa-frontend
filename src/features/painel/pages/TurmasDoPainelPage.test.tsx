import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import TurmasDoPainelPage from './TurmasDoPainelPage'

const TURMAS = `${env.VITE_API_URL}/api/v1/admin/suporte/turmas`

const ANALYTICS = env.VITE_API_URL + '/api/v1/admin/analytics'

/** Só o que a lista lê do analytics: o total e a divisão por licença. */
const RESUMO = {
  contas: { total: 0, no_periodo: 0, confirmadas: 0, sem_turma: 0 },
  formaturas: {
    total: 12,
    novas_no_periodo: 3,
    pagantes: 5,
    por_licenca: [
      { licenca: 'Gratuito', turmas: 6 },
      { licenca: 'Premium', turmas: 5 },
      { licenca: 'Suspensa', turmas: 1 },
    ],
    membros_por_turma_media: 0,
    membros_por_turma_mediana: 0,
  },
}

const PREMIUM = {
  id: 'f-1',
  nome: 'Medicina 2027',
  instituicao: 'UFPR',
  curso: 'Medicina',
  status: 'Ativa',
  licenca: 'Premium',
  membros: 82,
  criada_em: '2026-09-01T12:00:00Z',
}

/** Registra a lista e devolve a query string de cada pedido. */
function interceptarTurmas() {
  const pedidos: URLSearchParams[] = []

  servidor.use(
    http.get(ANALYTICS, () => HttpResponse.json(RESUMO)),
    http.get(TURMAS, ({ request }) => {
      pedidos.push(new URL(request.url).searchParams)
      return HttpResponse.json({
        itens: [PREMIUM],
        pagina: 1,
        tamanho: 20,
        total: 1,
        total_paginas: 1,
        tem_proxima: false,
      })
    }),
  )

  return pedidos
}

describe('TurmasDoPainelPage', () => {
  /** D2: o filtro é do servidor, e o chip vai na query — a lista não filtra a página que já veio. */
  it('filtra pela licença no servidor ao escolher o chip', async () => {
    const pedidos = interceptarTurmas()
    const usuario = userEvent.setup()
    renderizar(<TurmasDoPainelPage />, '/painel/turmas')

    expect(await screen.findByRole('link', { name: 'Medicina 2027' })).toHaveAttribute(
      'href',
      '/painel/turmas/f-1',
    )
    await usuario.click(await screen.findByRole('button', { name: /^Premium/ }))

    await expect.poll(() => pedidos.at(-1)?.get('licenca')).toBe('Premium')
  })

  /** A URL é a dona do estado: o link com filtro e busca abre a mesma lista. */
  it('lê licença e busca da URL', async () => {
    const pedidos = interceptarTurmas()
    renderizar(<TurmasDoPainelPage />, '/painel/turmas?licenca=Suspensa&busca=medicina')

    expect(await screen.findByText('Medicina 2027')).toBeInTheDocument()
    expect(pedidos[0]?.get('licenca')).toBe('Suspensa')
    expect(pedidos[0]?.get('termo')).toBe('medicina')
  })

  /** Os números dos chips vêm do analytics dos 30 dias — licença sem turma mostra zero, e não some. */
  it('mostra quantas turmas há em cada licença nos chips', async () => {
    interceptarTurmas()
    renderizar(<TurmasDoPainelPage />, '/painel/turmas')

    expect(await screen.findByRole('button', { name: /Premium.*5/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Essencial.*0/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Todas.*12/ })).toBeInTheDocument()
  })

  it('ignora licença que não é um dos chips', async () => {
    const pedidos = interceptarTurmas()
    renderizar(<TurmasDoPainelPage />, '/painel/turmas?licenca=toString')

    expect(await screen.findByText('Medicina 2027')).toBeInTheDocument()
    expect(pedidos[0]?.has('licenca')).toBe(false)
  })
})
