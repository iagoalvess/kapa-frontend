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
  cartao: { disponivel: true, ligado_em: null, ligado_por: null, taxa_repassada: null },
  cobranca_automatica_em: null,
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
    expect(screen.getByText(/o dinheiro fica na conta Mercado Pago até você/)).toBeVisible()
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

  /**
   * Sprint 39, P2, P4 e P7: a tesouraria liga o cartão pelo interruptor — lê o risco da contestação e escolhe quem
   * paga a taxa, com o percentual em base 10.000 na ida.
   */
  it('a tesouraria liga o cartão repassando a taxa a quem paga', async () => {
    entrarComo('Tesoureiro')
    comApi(conectado)
    const configuracoes: unknown[] = []
    servidor.use(
      http.put(`${MERCADO_PAGO}/cartao`, async ({ request }) => {
        configuracoes.push(await request.json())
        return HttpResponse.json({
          provedor: {
            ...conectado,
            cartao: {
              disponivel: true,
              ligado_em: '2026-09-29T12:00:00Z',
              ligado_por: 'Bruna',
              taxa_repassada: 498,
            },
          },
        })
      }),
    )

    renderizar(<CartaoDoMercadoPago />)
    await userEvent.click(await screen.findByRole('switch', { name: /Cartão de crédito/ }))

    expect(await screen.findByText(/Quem pagou pode contestar a compra no banco/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quem paga no cartão' }))
    expect(screen.getByLabelText('Taxa do cartão (%)')).toHaveValue('4,98')
    await userEvent.click(screen.getByRole('button', { name: 'Ligar cartão' }))

    expect(await screen.findByText(/paga 4,98% a mais/)).toBeInTheDocument()
    expect(configuracoes).toEqual([{ ligado: true, taxa_repassada: 498 }])
    expect(screen.getByRole('switch', { name: /Cartão de crédito/ })).toBeChecked()
  })

  /** P7: desligar grava na hora, sem diálogo — não apaga nada. */
  it('desligar o cartão grava na hora', async () => {
    entrarComo('Presidente')
    const ligado = {
      ...conectado,
      cartao: {
        disponivel: true,
        ligado_em: '2026-09-29T12:00:00Z',
        ligado_por: 'Bruna',
        taxa_repassada: null,
      },
    }
    comApi(ligado)
    const configuracoes: unknown[] = []
    servidor.use(
      http.put(`${MERCADO_PAGO}/cartao`, async ({ request }) => {
        configuracoes.push(await request.json())
        return HttpResponse.json({ provedor: conectado })
      }),
    )

    renderizar(<CartaoDoMercadoPago />)
    expect(await screen.findByText(/A turma absorve a taxa do cartão/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('switch', { name: /Cartão de crédito/ }))

    await expect.poll(() => configuracoes).toEqual([{ ligado: false, taxa_repassada: null }])
    expect(await screen.findByRole('switch', { name: /Cartão de crédito/ })).not.toBeChecked()
  })

  /** 29/09/2026: um modo ou o outro — ligar a cobrança automática passa por confirmação e grava na API. */
  it('a tesouraria liga a cobrança pelo Mercado Pago depois de confirmar', async () => {
    entrarComo('Tesoureiro')
    comApi(conectado)
    const modos: unknown[] = []
    servidor.use(
      http.put(`${MERCADO_PAGO}/cobranca`, async ({ request }) => {
        modos.push(await request.json())
        return HttpResponse.json({
          provedor: { ...conectado, cobranca_automatica_em: '2026-09-29T12:00:00Z' },
        })
      }),
    )

    renderizar(<CartaoDoMercadoPago />)
    await userEvent.click(await screen.findByRole('switch', { name: /Cobrar parcelas e opcionais/ }))
    expect(modos).toEqual([])
    await userEvent.click(await screen.findByRole('button', { name: 'Ligar' }))

    await expect.poll(() => modos).toEqual([{ automatica: true }])
    expect(await screen.findByRole('switch', { name: /Cobrar parcelas e opcionais/ })).toBeChecked()
  })

  /** A troca bloqueada pela API continua desligada; quem diz o que fazer é o toast, com a mensagem dela. */
  it('a troca recusada pela API não muda o interruptor', async () => {
    entrarComo('Tesoureiro')
    comApi(conectado)
    let tentativas = 0
    servidor.use(
      http.put(`${MERCADO_PAGO}/cobranca`, () => {
        tentativas += 1
        return HttpResponse.json(
          {
            status: 409,
            codigo: 'recebimento.avisos_pendentes',
            detail: 'Há 2 aviso(s) de pagamento esperando conferência.',
          },
          { status: 409 },
        )
      }),
    )

    renderizar(<CartaoDoMercadoPago />)
    await userEvent.click(await screen.findByRole('switch', { name: /Cobrar parcelas e opcionais/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Ligar' }))

    await expect.poll(() => tentativas).toBe(1)
    expect(screen.getByRole('switch', { name: /Cobrar parcelas e opcionais/ })).not.toBeChecked()
  })

  /** P7: a comissão não mexe no cartão — nem chega a ver a chave. */
  it('a comissão não vê o interruptor', async () => {
    entrarComo('Comissao')
    comApi(conectado)

    renderizar(<CartaoDoMercadoPago />)

    expect(await screen.findByText('Cartão de crédito')).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })
})
