import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { reais, renderizar } from '@/test/utils'
import { cobrancaDeTeste, pagaDeTeste, parcelaDeTeste, vencidaDeTeste } from '../dadosDeTeste'
import PagamentoEmLotePage from './PagamentoEmLotePage'

const vencida = vencidaDeTeste()
const aberta = parcelaDeTeste({ id: 'pa-aberta', numero: 5, vencimento: '2026-10-10' })

const renderizarLote = (parcelas = 'pa-venc,pa-aberta') =>
  renderizar(
    <PagamentoEmLotePage />,
    { pathname: '/minhas-parcelas/pagar', search: `?parcelas=${parcelas}` },
    '/minhas-parcelas/pagar',
  )

/** @returns Os multipart que o "Já paguei" mandou, e a query com que a cobrança foi pedida. */
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
    http.get(`${env.VITE_API_URL}/api/v1/parcelas/cobranca`, ({ request }) => {
      pedidos.push(new URL(request.url).searchParams.getAll('parcela_ids'))
      return HttpResponse.json({ ...cobrancaDeTeste(), valor_em_centavos: 71_120 })
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
  it('pede uma cobrança só com a soma e mostra o que ela cobre', async () => {
    const { pedidos } = responder()

    renderizarLote()

    // A soma é da API: a tela mostra o valor cobrado, e não uma conta refeita aqui.
    expect(await screen.findByText(reais(71_120))).toBeInTheDocument()
    expect(pedidos).toEqual([['pa-venc', 'pa-aberta']])
    expect(screen.getByText('2 parcelas num pagamento só')).toBeInTheDocument()
    expect(screen.getByText('Comissão Medicina 2027')).toBeInTheDocument()

    const cobertas = screen.getByText('O que este pagamento cobre').closest('div')!
    expect(within(cobertas).getByText(/vence 10\/08\/2026/)).toBeInTheDocument()
    expect(within(cobertas).getByText(/vence 10\/10\/2026/)).toBeInTheDocument()
  })

  it('o "Já paguei" avisa as duas parcelas de uma vez, com o valor cobrado e o meio', async () => {
    const { informes } = responder()

    renderizarLote()

    await userEvent.click(await screen.findByRole('button', { name: 'Já paguei' }))
    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(informes).toHaveLength(1))
    expect(informes[0]!.getAll('parcela_ids').map(String)).toEqual(['pa-venc', 'pa-aberta'])
    expect(informes[0]!.get('valor_em_centavos')).toBe('71120')
    expect(informes[0]!.get('meio')).toBe('Pix')
  })

  it('sem meio cadastrado, explica e não deixa avisar', async () => {
    responder()
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/parcelas/cobranca`, () =>
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
