import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, renderizar } from '@/test/utils'
import type { CompraNaGestao, ConviteDaCompra, PedidoNaGestao, ResumoDaLoja } from '../types/loja.types'
import ComprasDaLojaPage from './ComprasDaLojaPage'

const COMPRAS = `${env.VITE_API_URL}/api/v1/loja/compras`
const PEDIDOS = `${env.VITE_API_URL}/api/v1/loja/pedidos-de-cancelamento`

const resumo: ResumoDaLoja = {
  convites_vendidos: 42,
  aguardando_pix: 3,
  compras_a_devolver: 1,
  arrecadado_em_centavos: 1_050_000,
}

const compra = (dados: Partial<CompraNaGestao> = {}): CompraNaGestao => ({
  id: 'c-1',
  criada_em: '2026-09-24T15:00:00Z',
  nome: 'Maria Souza',
  email: 'maria@teste.dev',
  cpf: '***.982.247-**',
  item: 'Convite adulto',
  quantidade: 2,
  valor_em_centavos: 50_000,
  meio: 'Pix',
  status: 'Paga',
  expira_em: '2026-09-24T15:31:00Z',
  paga_em: '2026-09-24T15:05:00Z',
  valor_pago_em_centavos: 50_000,
  pagador_diferente: false,
  convites_cancelados: 0,
  valor_a_devolver_em_centavos: 0,
  pedido_de_cancelamento_aberto: false,
  ...dados,
})

const convite = (dados: Partial<ConviteDaCompra>): ConviteDaCompra => ({
  id: 'cv-1',
  sequencial: 1,
  codigo: 'MED27-AAAA',
  nome_do_convidado: 'Tia Carmem',
  validado_em: null,
  revogado_em: null,
  motivo_da_revogacao: null,
  ...dados,
})

describe('ComprasDaLojaPage', () => {
  afterEach(() => sessao.encerrar())

  beforeEach(() =>
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
        HttpResponse.json({ id: 'f-1', status: 'Ativa' }),
      ),
      http.get(PEDIDOS, () => HttpResponse.json([])),
    ),
  )

  it('mostra a conta da loja e marca o que é para devolver e o pagador diferente', async () => {
    entrarComo(PAPEIS.presidente)
    servidor.use(
      http.get(`${COMPRAS}/resumo`, () => HttpResponse.json(resumo)),
      http.get(COMPRAS, () =>
        HttpResponse.json(
          pagina([
            compra(),
            compra({ id: 'c-2', nome: 'João Lima', status: 'ADevolver', pagador_diferente: true }),
          ]),
        ),
      ),
    )

    renderizar(<ComprasDaLojaPage />)

    expect(await screen.findByText('João Lima')).toBeInTheDocument()
    expect(screen.getByText('A devolver', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Pagou outro CPF')).toBeInTheDocument()
    expect(screen.getAllByText('maria@teste.dev')).toHaveLength(2)
    expect(await screen.findByText('Aguardando PIX')).toBeInTheDocument()
  })

  it('o filtro de situação vai para a API', async () => {
    entrarComo(PAPEIS.presidente)
    const pedidos: string[] = []
    servidor.use(
      http.get(`${COMPRAS}/resumo`, () => HttpResponse.json(resumo)),
      http.get(COMPRAS, ({ request }) => {
        pedidos.push(new URL(request.url).searchParams.get('status') ?? '')
        return HttpResponse.json(pagina([compra()]))
      }),
    )
    const usuario = userEvent.setup()
    renderizar(<ComprasDaLojaPage />)

    await screen.findByText('Maria Souza')
    await usuario.click(screen.getByRole('button', { name: 'A devolver' }))

    await waitFor(() => expect(pedidos).toContain('ADevolver'))
  })

  it('cancela um convite escolhido, com motivo obrigatório (Sprint 38, P4)', async () => {
    entrarComo(PAPEIS.presidente)
    let corpo: unknown
    servidor.use(
      http.get(`${COMPRAS}/resumo`, () => HttpResponse.json(resumo)),
      http.get(COMPRAS, () => HttpResponse.json(pagina([compra()]))),
      http.get(`${COMPRAS}/c-1/convites`, () =>
        HttpResponse.json([
          convite({}),
          convite({
            id: 'cv-2',
            sequencial: 2,
            codigo: 'MED27-BBBB',
            nome_do_convidado: null,
            validado_em: '2026-09-28T23:00:00Z',
          }),
        ]),
      ),
      http.post(`${COMPRAS}/c-1/cancelamento`, async ({ request }) => {
        corpo = await request.json()
        return HttpResponse.json({ convites_cancelados: 1, estorno_em_centavos: 25_000 })
      }),
    )
    const usuario = userEvent.setup()
    renderizar(<ComprasDaLojaPage />)

    await usuario.click(await screen.findByRole('button', { name: 'Cancelar convites de Maria Souza' }))
    const dialogo = await screen.findByRole('alertdialog')
    const enviar = within(dialogo).getByRole('button', { name: 'Cancelar convites' })
    await usuario.click(await within(dialogo).findByRole('checkbox', { name: /Tia Carmem/ }))
    expect(within(dialogo).getByRole('checkbox', { name: /MED27-BBBB/ })).toBeDisabled()
    expect(within(dialogo).getByText('Já entrou')).toBeInTheDocument()
    expect(enviar).toBeDisabled()
    await usuario.type(within(dialogo).getByLabelText('Motivo'), 'Desistiu da festa')
    await usuario.click(enviar)

    await waitFor(() => expect(corpo).toEqual({ convite_ids: ['cv-1'], motivo: 'Desistiu da festa' }))
  })

  it('pedido de cancelamento aparece na fila e a recusa exige motivo (P1)', async () => {
    entrarComo(PAPEIS.presidente)
    const pedido: PedidoNaGestao = {
      id: 'p-1',
      compra_id: 'c-1',
      nome: 'Maria Souza',
      email: 'maria@teste.dev',
      item: 'Convite adulto',
      quantidade_da_compra: 2,
      convites: 1,
      motivo: 'Não vou poder ir',
      pedido_em: '2026-09-28T12:00:00Z',
    }
    let recusa: unknown
    servidor.use(
      http.get(`${COMPRAS}/resumo`, () => HttpResponse.json(resumo)),
      http.get(COMPRAS, () => HttpResponse.json(pagina([compra({ pedido_de_cancelamento_aberto: true })]))),
      http.get(PEDIDOS, () => HttpResponse.json([pedido])),
      http.post(`${PEDIDOS}/p-1/recusa`, async ({ request }) => {
        recusa = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const usuario = userEvent.setup()
    renderizar(<ComprasDaLojaPage />)

    expect(await screen.findByText('“Não vou poder ir”')).toBeInTheDocument()
    expect(screen.getByText('Pediu cancelamento')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Recusar o pedido de Maria Souza' }))
    const dialogo = await screen.findByRole('alertdialog')
    const recusar = within(dialogo).getByRole('button', { name: 'Recusar' })
    expect(recusar).toBeDisabled()
    await usuario.type(within(dialogo).getByLabelText('Motivo'), 'Fora do prazo')
    await usuario.click(recusar)

    await waitFor(() => expect(recusa).toEqual({ motivo: 'Fora do prazo' }))
  })
})
