import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import { paraDadosDoLancamento } from '../schemas/lancamento.schema'
import type { SolicitacaoDeCancelamento } from '../types/cobrancas.types'
import { SolicitacoesDeCancelamento } from './SolicitacoesDeCancelamento'

const SOLICITACOES = `${env.VITE_API_URL}/api/v1/cobrancas/solicitacoes-de-cancelamento`

const fotos: SolicitacaoDeCancelamento = {
  id: 's-1',
  usuario_id: 'u-1',
  nome: 'Ana Souza',
  item_de_cobranca_id: 'i-1',
  tipo: 'FotoEAlbum',
  descricao: 'Fotos',
  grupo: null,
  pedido_id: null,
  motivo: 'vou fotografar por conta',
  pedido_em: '2026-10-05T12:00:00Z',
  resposta_ate: '2026-10-12',
  status: 'Aberto',
  motivo_da_resposta: null,
  respondido_em: null,
  pago_em_centavos: 20_000,
}

function comApi() {
  const respostas: unknown[] = []
  servidor.use(
    http.get(SOLICITACOES, () => HttpResponse.json([fotos])),
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
      HttpResponse.json({ id: 'f-1', nome: 'Odonto 2027', status: 'Ativa' }),
    ),
    http.post(`${SOLICITACOES}/s-1/recusar`, async ({ request }) => {
      respostas.push(await request.json())
      return HttpResponse.json({ ...fotos, status: 'Recusado' })
    }),
  )
  return respostas
}

describe('SolicitacoesDeCancelamento', () => {
  afterEach(() => sessao.encerrar())

  /** D8: a Gestão inteira lê a fila; quem responde é a tesouraria, que mexe no dinheiro. */
  it('a comissão lê a fila mas não responde', async () => {
    entrarComo('Comissao')
    comApi()
    renderizar(<SolicitacoesDeCancelamento />)

    expect(await screen.findByText(/vou fotografar por conta/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Recusar/ })).not.toBeInTheDocument()
  })

  /** A recusa vai ao formando: sem motivo não sai. */
  it('a tesouraria recusa só com motivo', async () => {
    entrarComo('Tesoureiro')
    const respostas = comApi()
    renderizar(<SolicitacoesDeCancelamento />)

    await userEvent.click(await screen.findByRole('button', { name: /Recusar/ }))
    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Recusar' }))
    expect(
      await within(dialogo).findByText('Diga ao formando por que a comissão recusou.'),
    ).toBeInTheDocument()

    await userEvent.type(within(dialogo).getByLabelText('Motivo'), 'o fotógrafo já foi contratado')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Recusar' }))

    await expect.poll(() => respostas).toEqual([{ motivo: 'o fotógrafo já foi contratado' }])
  })
})

describe('paraDadosDoLancamento', () => {
  /** D23: o crédito (bolsa, desconto) vai negativo — é como a API o lê. */
  it('manda o crédito com sinal negativo', () => {
    const dados = paraDadosDoLancamento({
      usuario_id: 'u-1',
      descricao: ' Bolsa da comissão ',
      natureza: 'credito',
      valor_em_centavos: 30_000,
      numero_de_parcelas: '3',
      primeiro_vencimento: '2026-11-10',
    })

    expect(dados).toEqual({
      usuario_id: 'u-1',
      descricao: 'Bolsa da comissão',
      valor_em_centavos: -30_000,
      numero_de_parcelas: 3,
      primeiro_vencimento: '2026-11-10',
    })
  })
})
