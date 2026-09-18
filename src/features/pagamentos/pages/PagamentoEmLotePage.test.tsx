import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { reais, renderizar } from '@/test/utils'
import { pagaDeTeste, parcelaDeTeste, vencidaDeTeste } from '../dadosDeTeste'
import PagamentoEmLotePage from './PagamentoEmLotePage'

/** Um BR Code de verdade — o do manual do Banco Central. */
const COPIA_E_COLA =
  '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D'

const vencida = vencidaDeTeste()
const aberta = parcelaDeTeste({ id: 'pa-aberta', numero: 5, vencimento: '2026-10-10' })

const renderizarLote = (parcelas = 'pa-venc,pa-aberta') =>
  renderizar(
    <PagamentoEmLotePage />,
    { pathname: '/minhas-parcelas/pagar', search: `?parcelas=${parcelas}` },
    '/minhas-parcelas/pagar',
  )

/** @returns Os multipart que o "Já paguei" mandou, e a query com que o PIX foi pedido. */
function responder() {
  const informes: FormData[] = []
  const pedidos: string[][] = []

  servidor.use(
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
      HttpResponse.json({ id: 'f-1', status: 'Ativa' }),
    ),
    http.get(`${env.VITE_API_URL}/api/v1/extrato/eu`, () =>
      HttpResponse.json({
        em_aberto_em_centavos: 71_120,
        proxima: vencida,
        parcelas: [pagaDeTeste(), vencida, aberta],
      }),
    ),
    http.get(`${env.VITE_API_URL}/api/v1/parcelas/pix`, ({ request }) => {
      pedidos.push(new URL(request.url).searchParams.getAll('parcela_ids'))
      return HttpResponse.json({
        copia_e_cola: COPIA_E_COLA,
        valor_em_centavos: 71_120,
        chave: '52998224725',
        nome_do_titular: 'Comissão Medicina 2027',
        identificador: 'KAPA0123456789ABCDEF01234',
      })
    }),
    http.post(`${env.VITE_API_URL}/api/v1/parcelas/informes`, async ({ request }) => {
      informes.push(await request.formData())
      return HttpResponse.json([
        { ...vencida, em_conferencia: true },
        { ...aberta, em_conferencia: true },
      ])
    }),
  )

  return { informes, pedidos }
}

describe('PagamentoEmLotePage', () => {
  it('pede um PIX só com a soma e mostra o que ele cobre', async () => {
    const { pedidos } = responder()

    renderizarLote()

    // A soma é da API: a tela mostra o valor do QR, e não uma conta refeita aqui.
    expect(await screen.findByText(reais(71_120))).toBeInTheDocument()
    expect(pedidos).toEqual([['pa-venc', 'pa-aberta']])
    expect(screen.getByText('2 parcelas num pagamento só')).toBeInTheDocument()
    expect(screen.getByText('Comissão Medicina 2027')).toBeInTheDocument()

    const cobertas = screen.getByText('O que este pagamento cobre').closest('div')!
    expect(within(cobertas).getByText(/vence 10\/08\/2026/)).toBeInTheDocument()
    expect(within(cobertas).getByText(/vence 10\/10\/2026/)).toBeInTheDocument()
  })

  it('o "Já paguei" avisa as duas parcelas de uma vez, com o valor do QR', async () => {
    const { informes } = responder()

    renderizarLote()

    await userEvent.click(await screen.findByRole('button', { name: 'Já paguei' }))
    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(informes).toHaveLength(1))
    expect(informes[0]!.getAll('parcela_ids').map(String)).toEqual(['pa-venc', 'pa-aberta'])
    expect(informes[0]!.get('valor_em_centavos')).toBe('71120')
  })

  it('sem conta cadastrada, explica e não deixa avisar', async () => {
    responder()
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/parcelas/pix`, () =>
        HttpResponse.json(
          { status: 409, codigo: 'pagamento.sem_conta', detail: 'Sem conta.' },
          { status: 409 },
        ),
      ),
    )

    renderizarLote()

    expect(
      await screen.findByText(/A comissão ainda está configurando a conta de recebimento/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Já paguei' })).toBeDisabled()
  })
})
