import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import type { StatusDaFormatura } from '@/types/formatura'
import { FaixaDeStatus } from './FaixaDeStatus'

const ATUAL = `${env.VITE_API_URL}/api/v1/formaturas/atual`

function entrarNaFormatura() {
  const corpo = { sub: 'u-1', name: 'Ana', formatura_id: 'f-1', papel: 'Presidente' }
  sessao.autenticar({
    accessToken: `c.${btoa(JSON.stringify(corpo))}.a`,
    expiraEm: new Date(Date.now() + 900_000).toISOString(),
  })
}

function comStatus(status: StatusDaFormatura) {
  servidor.use(
    http.get(ATUAL, () => HttpResponse.json({ id: 'f-1', status, encerradaEm: '2026-12-20T15:00:00Z' })),
  )
}

describe('FaixaDeStatus', () => {
  afterEach(() => sessao.encerrar())

  it.each([
    ['Rascunho', /ainda não está ativa/],
    ['AguardandoPagamento', /ainda não está ativa/],
    ['Suspensa', /modo leitura/],
    ['Encerrada', /encerrada em 20\/12\/2026/],
  ] as const)('com a formatura %s, avisa', async (status, texto) => {
    entrarNaFormatura()
    comStatus(status)

    renderizar(<FaixaDeStatus />)

    expect(await screen.findByRole('status')).toHaveTextContent(texto)
  })

  it('leva o Presidente aos planos; o resto da comissão só lê o aviso', async () => {
    entrarNaFormatura()
    comStatus('Suspensa')

    const { unmount } = renderizar(<FaixaDeStatus />)
    expect(await screen.findByRole('link', { name: 'Regularizar' })).toBeInTheDocument()
    unmount()

    const corpo = { sub: 'u-2', name: 'Bia', formatura_id: 'f-1', papel: 'Comissao' }
    sessao.autenticar({
      accessToken: `c.${btoa(JSON.stringify(corpo))}.a`,
      expiraEm: new Date(Date.now() + 900_000).toISOString(),
    })
    renderizar(<FaixaDeStatus />)

    expect(await screen.findByRole('status')).toHaveTextContent(/modo leitura/)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('com a formatura ativa, não aparece', async () => {
    entrarNaFormatura()
    let pedidos = 0
    servidor.use(
      http.get(ATUAL, () => {
        pedidos++
        return HttpResponse.json({ id: 'f-1', status: 'Ativa' })
      }),
    )

    renderizar(<FaixaDeStatus />)

    await waitFor(() => expect(pedidos).toBe(1))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  /** Sem formatura selecionada não há o que perguntar — nem requisição. */
  it('sem formatura selecionada, não consulta a API', () => {
    renderizar(<FaixaDeStatus />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
