import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { diaDeHoje, formatarCentavos } from '@/lib/formato'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import {
  cobrancaDeTeste,
  dinheiroDeTeste,
  pagaDeTeste,
  parcelaDeTeste,
  pixDeTeste,
  tedDeTeste,
} from '../dadosDeTeste'
import type { Parcela } from '../types/pagamentos.types'
import PagamentoPage from './PagamentoPage'

const PARCELA = `${env.VITE_API_URL}/api/v1/parcelas/pa-1`

const renderizarPagamento = () =>
  renderizar(<PagamentoPage />, '/extrato/parcelas/pa-1/pagar', '/extrato/parcelas/:id/pagar')

function responder(parcela: Parcela = parcelaDeTeste(), cobranca = cobrancaDeTeste()) {
  const informes: FormData[] = []
  servidor.use(
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
      HttpResponse.json({ id: 'f-1', status: 'Ativa' }),
    ),
    http.get(PARCELA, () => HttpResponse.json(parcela)),
    http.get(`${PARCELA}/cobranca`, () => HttpResponse.json(cobranca)),
    http.post(`${PARCELA}/informes`, async ({ request }) => {
      informes.push(await request.formData())
      return HttpResponse.json({ ...parcela, em_conferencia: true })
    }),
  )
  return informes
}

describe('PagamentoPage', () => {
  it('mostra para quem vai o dinheiro e o botão de copiar acima do QR', async () => {
    responder()

    renderizarPagamento()

    expect(await screen.findByText('Comissão Medicina 2027')).toBeInTheDocument()
    const copiar = screen.getByRole('button', { name: 'Copiar' })
    const qr = screen.getByRole('img', { name: 'QR Code do PIX' })
    expect(copiar.compareDocumentPosition(qr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(
      screen.getByText('Confira se o seu banco mostra este nome antes de confirmar.'),
    ).toBeInTheDocument()
  })

  /** Critério de aceite da Sprint 18: turma que nunca abriu a tela de meios não vê seletor nenhum. */
  it('com um meio só, não há escolha a fazer', async () => {
    responder()

    renderizarPagamento()

    await screen.findByText('Comissão Medicina 2027')
    expect(screen.queryByRole('group', { name: 'Como você quer pagar' })).not.toBeInTheDocument()
  })

  it('com dois meios, escolher dinheiro troca o conteúdo e o aviso vai com o meio escolhido', async () => {
    const informes = responder(parcelaDeTeste(), cobrancaDeTeste([pixDeTeste(), dinheiroDeTeste()]))

    renderizarPagamento()

    await userEvent.click(await screen.findByRole('button', { name: 'Dinheiro' }))
    expect(screen.getByText('Entregue a Bruna Tesoureira, nas reuniões de quinta.')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'QR Code do PIX' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Já paguei' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(informes[0]?.get('meio')).toBe('Dinheiro')
    expect(informes[0]?.has('comprovante')).toBe(false)
  })

  it('a transferência mostra os dados da conta, e não um QR', async () => {
    responder(parcelaDeTeste(), cobrancaDeTeste([tedDeTeste()]))

    renderizarPagamento()

    expect(await screen.findByText('Banco do Brasil')).toBeInTheDocument()
    expect(screen.getByText('1234-5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copiar agência' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'QR Code do PIX' })).not.toBeInTheDocument()
  })

  it('sem meio cadastrado, explica que a comissão ainda está configurando', async () => {
    responder()
    servidor.use(
      http.get(`${PARCELA}/cobranca`, () =>
        HttpResponse.json(
          { status: 409, codigo: 'pagamento.sem_conta', detail: 'Sem conta.' },
          { status: 409 },
        ),
      ),
    )

    renderizarPagamento()

    expect(
      await screen.findByText(/A comissão ainda está configurando a conta de recebimento/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Já paguei' })).toBeDisabled()
  })

  it('o "Já paguei" avisa com o dia de hoje e o valor do QR, e a tela diz o que acontece', async () => {
    const informes = responder()

    renderizarPagamento()

    await userEvent.click(await screen.findByRole('button', { name: 'Já paguei' }))
    expect(screen.getByLabelText('Dia do pagamento')).toHaveValue(diaDeHoje())
    await waitFor(() => expect(screen.getByLabelText('Valor pago')).toHaveValue(formatarCentavos(35_000)))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText(/Avisamos a tesouraria\. Você recebe um e-mail/)).toBeInTheDocument()
    expect(informes).toHaveLength(1)
    expect(informes[0]?.get('pago_em')).toBe(diaDeHoje())
    expect(informes[0]?.get('valor_em_centavos')).toBe('35000')
    expect(informes[0]?.get('meio')).toBe('Pix')
    expect(informes[0]?.has('comprovante')).toBe(false)
  })

  it('parcela paga não pede cobrança nenhuma', async () => {
    responder(pagaDeTeste({ id: 'pa-1' }))

    renderizarPagamento()

    expect(await screen.findByText(/A tesouraria confirmou/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Já paguei' })).not.toBeInTheDocument()
  })
})
