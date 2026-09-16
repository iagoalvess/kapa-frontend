import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { diaDeHoje, formatarCentavos } from '@/lib/formato'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import { pagaDeTeste, parcelaDeTeste } from '../dadosDeTeste'
import type { Parcela } from '../types/pagamentos.types'
import PagamentoPage from './PagamentoPage'

const PARCELA = `${env.VITE_API_URL}/api/v1/parcelas/pa-1`

/** Um BR Code de verdade — o do manual do Banco Central. */
const COPIA_E_COLA =
  '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D'

const renderizarPagamento = () =>
  renderizar(<PagamentoPage />, '/extrato/parcelas/pa-1/pagar', '/extrato/parcelas/:id/pagar')

function responder(parcela: Parcela = parcelaDeTeste()) {
  const informes: FormData[] = []
  servidor.use(
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
      HttpResponse.json({ id: 'f-1', status: 'Ativa' }),
    ),
    http.get(PARCELA, () => HttpResponse.json(parcela)),
    http.get(`${PARCELA}/pix`, () =>
      HttpResponse.json({
        copia_e_cola: COPIA_E_COLA,
        valor_em_centavos: 35_000,
        chave: '52998224725',
        nome_do_titular: 'Comissão Medicina 2027',
        identificador: 'KAPA0123456789ABCDEF01234',
      }),
    ),
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
    const copiar = screen.getByRole('button', { name: 'Copiar código PIX' })
    const qr = screen.getByRole('img', { name: 'QR Code do PIX' })
    expect(copiar.compareDocumentPosition(qr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(
      screen.getByText('Confira se o seu banco mostra este nome antes de confirmar.'),
    ).toBeInTheDocument()
  })

  it('sem chave cadastrada, explica que a comissão ainda está configurando', async () => {
    responder()
    servidor.use(
      http.get(`${PARCELA}/pix`, () =>
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
    await userEvent.click(screen.getByRole('button', { name: 'Avisar a tesouraria' }))

    expect(await screen.findByText(/Avisamos a tesouraria\. Você recebe um e-mail/)).toBeInTheDocument()
    expect(informes).toHaveLength(1)
    expect(informes[0]?.get('pago_em')).toBe(diaDeHoje())
    expect(informes[0]?.get('valor_em_centavos')).toBe('35000')
    expect(informes[0]?.has('comprovante')).toBe(false)
  })

  it('parcela paga não pede PIX nenhum', async () => {
    responder(pagaDeTeste({ id: 'pa-1' }))

    renderizarPagamento()

    expect(await screen.findByText(/A tesouraria confirmou/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Já paguei' })).not.toBeInTheDocument()
  })
})
