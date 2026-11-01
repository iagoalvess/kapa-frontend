import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { ProvedorConectado } from '../types/recebimentos.types'
import { AcoesDoMercadoPago } from './AcoesDoMercadoPago'

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
    http.get(`${env.VITE_API_URL}/api/v1/recebimentos/conta`, () =>
      HttpResponse.json({
        conta: {
          meios: {
            pix: {
              tipo_de_chave: 'Email',
              chave: 'turma@mp.dev',
              nome_do_titular: 'Helena',
              cidade: 'Curitiba',
              banco: null,
            },
            transferencia: null,
            dinheiro: null,
          },
          atualizada_em: '2026-09-24T12:00:00Z',
          conferida_em: '2026-09-24T12:00:00Z',
          conferida_por: 'Helena',
        },
      }),
    ),
    http.post(`${MERCADO_PAGO}/autorizacao`, () => HttpResponse.json({ enviada_para: 'pr***@kapa.dev' })),
  )
}

async function gerenciar() {
  await userEvent.click(await screen.findByRole('button', { name: 'Mercado Pago' }))
}

describe('AcoesDoMercadoPago', () => {
  afterEach(() => {
    sessao.encerrar()
    globalThis.location.hash = ''
  })

  /** Sprint 25, OAuth: conectar é mandar o navegador à página de autorização que a API devolve. */
  /** Revisão de segurança de 05/10/2026: o link de autorização vai ao e-mail, e a tela não sai do lugar. */
  it('o presidente pede a conexão e o link vai ao e-mail, com o passo a passo do Kapinha', async () => {
    entrarComo('Presidente')
    comApi()
    const antes = globalThis.location.href

    renderizar(<AcoesDoMercadoPago />)

    await userEvent.click(await screen.findByRole('button', { name: 'Conectar Mercado Pago' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Conectar Mercado Pago' })).toBeEnabled())
    expect(globalThis.location.href).toBe(antes)
    expect(screen.queryByRole('region', { name: 'Loja pública' })).not.toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('desconectar atualiza a conta sem alterar os meios manuais', async () => {
    entrarComo('Presidente')
    comApi(conectado)
    servidor.use(http.delete(MERCADO_PAGO, () => new HttpResponse(null, { status: 204 })))
    renderizar(<AcoesDoMercadoPago />)

    await gerenciar()
    await userEvent.click(screen.getByRole('button', { name: 'Desconectar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Desconectar', hidden: false }))

    expect(await screen.findByRole('button', { name: 'Conectar Mercado Pago' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Conectar Mercado Pago' })).toBeEnabled()
  })

  it('o retorno do Mercado Pago preserva o link de edição dos meios', async () => {
    entrarComo('Presidente')
    comApi(conectado)
    const { router } = renderizar(
      <AcoesDoMercadoPago />,
      '/formatura?mercado_pago=conectado&codigo=teste&trocar=meios#loja-publica',
    )

    await gerenciar()
    expect(await screen.findByText('turma@mp.dev')).toBeVisible()
    await waitFor(() => expect(router.state.location.search).toBe('?trocar=meios'))
    expect(router.state.location.hash).toBe('#loja-publica')
  })

  /** P3: a tesouraria vê, mas quem conecta é o Presidente. */
  it('a tesouraria vê a conta conectada sem poder mexer', async () => {
    entrarComo('Tesoureiro')
    comApi(conectado)

    renderizar(<AcoesDoMercadoPago />)

    await gerenciar()
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

    renderizar(<AcoesDoMercadoPago />)
    await gerenciar()
    await userEvent.click(screen.getByRole('switch', { name: /Cartão de crédito/ }))

    expect(await screen.findByText(/Quem pagou pode contestar a compra no banco/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quem paga no cartão' }))
    expect(screen.getByLabelText('Taxa do cartão (%)')).toHaveValue('4,98')
    await userEvent.click(screen.getByRole('button', { name: 'Ligar' }))

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

    renderizar(<AcoesDoMercadoPago />)
    await gerenciar()
    expect(await screen.findByText(/A turma absorve a taxa do cartão/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('switch', { name: /Cartão de crédito/ }))

    await expect.poll(() => configuracoes).toEqual([{ ligado: false, taxa_repassada: null }])
    expect(await screen.findByRole('switch', { name: /Cartão de crédito/ })).not.toBeChecked()
  })

  /** P7: a comissão não mexe no cartão — nem chega a ver a chave. */
  it('a comissão não vê o interruptor', async () => {
    entrarComo('Comissao')
    comApi(conectado)

    renderizar(<AcoesDoMercadoPago />)

    await gerenciar()
    expect(await screen.findByText('Cartão de crédito')).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })
})
