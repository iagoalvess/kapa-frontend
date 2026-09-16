import { act, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import RetornoDoCheckoutPage from './RetornoDoCheckoutPage'

const ASSINATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual/assinatura`

const plano = {
  id: 'p-1',
  codigo: 'completo',
  nome: 'Completo',
  preco_em_centavos: 34990,
  ciclo: 'Mensal',
  limite_de_formandos: 150,
  recomendado: true,
}

function entrarComoPresidente() {
  const corpo = { sub: 'u-1', name: 'Ana', formatura_id: 'f-1', papel: 'Presidente' }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

/** Responde a sequência de status, repetindo o último — o webhook "chega" quando a lista acaba. */
function comStatus(...status: string[]) {
  let pedidos = 0
  servidor.use(
    http.get(ASSINATURA, () => {
      const atual = status[Math.min(pedidos, status.length - 1)]
      pedidos++
      return HttpResponse.json({ id: 'a-1', status: atual, plano, criado_em: '2026-09-12T12:00:00Z' })
    }),
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
      HttpResponse.json({ id: 'f-1', status: 'Ativa' }),
    ),
  )
  return () => pedidos
}

describe('RetornoDoCheckoutPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    entrarComoPresidente()
  })

  afterEach(() => {
    vi.useRealTimers()
    sessao.encerrar()
  })

  it('consulta a cada 3 s e mostra a confirmação quando o webhook ativa', async () => {
    const pedidos = comStatus('Pendente', 'Ativa')

    renderizar(<RetornoDoCheckoutPage />)

    expect(await screen.findByText(/Não feche esta página/)).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(3_000))

    expect(await screen.findByText('Pagamento confirmado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para a turma' })).toBeInTheDocument()
    expect(pedidos()).toBe(2)
  })

  /** Sem este estado, o spinner fica girando para sempre e a pessoa paga de novo. */
  it('passados 60 s sem confirmação, avisa que é seguro sair', async () => {
    comStatus('Pendente')

    renderizar(<RetornoDoCheckoutPage />)
    expect(await screen.findByText(/Não feche esta página/)).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(60_000))

    expect(await screen.findByText(/sair desta página com segurança/)).toBeInTheDocument()
    expect(screen.queryByText(/Não feche esta página/)).not.toBeInTheDocument()
  })

  it('confirmada, para de consultar', async () => {
    const pedidos = comStatus('Ativa')

    renderizar(<RetornoDoCheckoutPage />)
    expect(await screen.findByText('Pagamento confirmado')).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(10_000))

    expect(pedidos()).toBe(1)
  })

  it('sem contratação em andamento, leva aos planos', async () => {
    servidor.use(
      http.get(ASSINATURA, () =>
        HttpResponse.json({ status: 404, codigo: 'assinatura.nao_encontrada' }, { status: 404 }),
      ),
    )

    renderizar(<RetornoDoCheckoutPage />)

    expect(await screen.findByText('Nenhuma contratação em andamento')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver planos' })).toBeInTheDocument()
  })
})
