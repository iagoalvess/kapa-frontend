import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { ProvedorConectado } from '../types/recebimentos.types'
import { CartaoDoMercadoPago } from './CartaoDoMercadoPago'

const MERCADO_PAGO = `${env.VITE_API_URL}/api/v1/recebimentos/conta/mercado-pago`

const conectado: ProvedorConectado = {
  conta_no_provedor: 'turma@mp.dev',
  conectado_em: '2026-09-24T12:00:00Z',
  conectado_por: 'Helena Araújo',
}

/** @param provedor Ausente: a turma ainda não conectou. */
function comApi(provedor: ProvedorConectado | null = null) {
  servidor.use(
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
      HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' }),
    ),
    http.get(MERCADO_PAGO, () => HttpResponse.json({ provedor })),
    http.post(`${MERCADO_PAGO}/autorizacao`, () =>
      HttpResponse.json({ url: '#autorizacao-do-mercado-pago' }),
    ),
  )
}

describe('CartaoDoMercadoPago', () => {
  afterEach(() => {
    sessao.encerrar()
    globalThis.location.hash = ''
  })

  /** Sprint 25, OAuth: conectar é mandar o navegador à página de autorização que a API devolve. */
  it('o presidente conecta indo para a autorização do Mercado Pago, com o passo a passo do Kapinha', async () => {
    entrarComo('Presidente')
    comApi()

    renderizar(<CartaoDoMercadoPago />)

    await userEvent.click(await screen.findByRole('button', { name: 'Conectar Mercado Pago' }))

    // A URL é só um âncora aqui: o jsdom navega por hash, e é assim que dá para ver a ida ao Mercado Pago.
    await expect.poll(() => globalThis.location.hash).toBe('#autorizacao-do-mercado-pago')
    await userEvent.click(screen.getByText('Como conectar? O Kapinha explica'))
    expect(screen.getByText(/o dinheiro fica na conta Mercado Pago até vocês/)).toBeVisible()
  })

  /** P3: a tesouraria vê, mas quem conecta é o Presidente. */
  it('a tesouraria vê a conta conectada sem poder mexer', async () => {
    entrarComo('Tesoureiro')
    comApi(conectado)

    renderizar(<CartaoDoMercadoPago />)

    expect(await screen.findByText('turma@mp.dev')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Trocar de conta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desconectar' })).not.toBeInTheDocument()
  })
})
