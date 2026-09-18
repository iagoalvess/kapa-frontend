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
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

function comStatus(status: StatusDaFormatura) {
  servidor.use(
    http.get(ATUAL, () => HttpResponse.json({ id: 'f-1', status, encerrada_em: '2026-12-20T15:00:00Z' })),
  )
}

describe('FaixaDeStatus', () => {
  afterEach(() => sessao.encerrar())

  it.each([
    ['Rascunho', /ainda não está ativa/],
    ['AguardandoPagamento', /ainda não está ativa/],
    ['Suspensa', /plano da turma venceu/],
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
    expect(await screen.findByRole('link', { name: 'Renovar plano' })).toBeInTheDocument()
    unmount()

    const corpo = { sub: 'u-2', name: 'Bia', formatura_id: 'f-1', papel: 'Comissao' }
    sessao.autenticar({
      access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
      expira_em: new Date(Date.now() + 900_000).toISOString(),
    })
    renderizar(<FaixaDeStatus />)

    expect(await screen.findByRole('status')).toHaveTextContent(/plano da turma venceu/)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  /** Quem contrata é o Presidente: o resto da comissão não recebe a tarefa dele. */
  it('antes de contratar, pede o plano ao Presidente e explica a espera ao resto', async () => {
    entrarNaFormatura()
    comStatus('Rascunho')

    const { unmount } = renderizar(<FaixaDeStatus />)
    expect(await screen.findByRole('status')).toHaveTextContent(/Contrate um plano/)
    unmount()

    const corpo = { sub: 'u-2', name: 'Bia', formatura_id: 'f-1', papel: 'Tesoureiro' }
    sessao.autenticar({
      access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
      expira_em: new Date(Date.now() + 900_000).toISOString(),
    })
    renderizar(<FaixaDeStatus />)

    expect(await screen.findByRole('status')).toHaveTextContent(/Falta o presidente concluir/)
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

  /**
   * A saída vem antes do status da turma: para quem já não está nela, "o plano da turma venceu" não
   * é a informação que falta — e a frase precisa dizer que o histórico dele continua de pé (P5).
   */
  it('avisa quem foi desligado, na frente do status da turma', async () => {
    const corpo = {
      sub: 'u-1',
      name: 'Ana',
      formatura_id: 'f-1',
      papel: 'Formando',
      desligado_em: '2026-09-16T12:00:00Z',
    }
    sessao.autenticar({
      access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
      expira_em: new Date(Date.now() + 900_000).toISOString(),
    })
    comStatus('Suspensa')

    renderizar(<FaixaDeStatus />)

    const faixa = await screen.findByRole('status')
    expect(faixa).toHaveTextContent(/desligado desta turma em 16\/09\/2026/)
    expect(faixa).not.toHaveTextContent(/plano da turma venceu/)
  })
})
