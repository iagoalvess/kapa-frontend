import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { diaDeHoje, formatarCentavos } from '@/lib/formato'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import { simularMercadoPago } from '@/test/mercadoPago'
import {
  cartaoDoMercadoPagoDeTeste,
  cobrancaDeTeste,
  dinheiroDeTeste,
  pagaDeTeste,
  parcelaDeTeste,
  pixDeTeste,
  pixDoMercadoPagoDeTeste,
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
  it('mostra para quem vai o dinheiro — nome, documento e conferência — e o copiar, acima do QR', async () => {
    responder()

    renderizarPagamento()

    const recebedor = await screen.findByRole('region', { name: 'Quem recebe' })
    expect(recebedor).toHaveTextContent('Comissão Medicina 2027 · CPF ***.982.247-**')
    expect(recebedor).toHaveTextContent('Titularidade conferida pela comissão em 14/09/2026')
    const copiar = screen.getByRole('button', { name: 'Copiar' })
    const qr = screen.getByRole('img', { name: 'QR Code do PIX' })
    expect(recebedor.compareDocumentPosition(qr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(copiar.compareDocumentPosition(qr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(
      screen.getByText('Confira se o seu banco mostra este nome antes de confirmar.'),
    ).toBeInTheDocument()
  })

  /** Sprint 22, decisão 8: a conta a conferir avisa, mas não impede. */
  it('conta a conferir avisa, e o pagamento continua possível', async () => {
    const pix = pixDeTeste()
    responder(parcelaDeTeste(), cobrancaDeTeste([{ ...pix, pix: { ...pix.pix!, conferida_em: null } }]))

    renderizarPagamento()

    expect(await screen.findByText(/A comissão ainda não confirmou no banco/)).toBeInTheDocument()
    expect(screen.queryByText(/Titularidade conferida/)).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'QR Code do PIX' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Já paguei' })).toBeEnabled()
  })

  /** Critério de aceite da Sprint 18: turma que nunca abriu a tela de meios não vê seletor nenhum. */
  it('com um meio só, não há escolha a fazer', async () => {
    responder()

    renderizarPagamento()

    await screen.findByText('Comissão Medicina 2027')
    expect(screen.queryByRole('group', { name: 'Como você quer pagar?' })).not.toBeInTheDocument()
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
      await screen.findByText(/A comissão ainda está configurando como a turma receberá pagamentos/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Já paguei' })).not.toBeInTheDocument()
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

  it('parcela paga não pede cobrança nenhuma, e abre o recibo numa aba', async () => {
    responder(pagaDeTeste({ id: 'pa-1' }))
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/recebimentos/rc-1/recibo`, () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('%PDF-1.4').buffer, {
          headers: { 'Content-Type': 'application/pdf' },
        }),
      ),
    )
    URL.createObjectURL = vi.fn<(objeto: Blob) => string>(() => 'blob:recibo')
    URL.revokeObjectURL = vi.fn<(endereco: string) => void>()
    const aba = { location: { href: '' }, close: vi.fn<() => void>() }
    vi.spyOn(window, 'open').mockReturnValue(aba as unknown as Window)

    renderizarPagamento()

    expect(await screen.findByText(/A tesouraria confirmou/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Já paguei' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Recibo da parcela 1/24' }))
    await waitFor(() => expect(aba.location.href).toBe('blob:recibo'))
    vi.restoreAllMocks()
  })

  /** Sprint 25: o PIX do Mercado Pago vem primeiro e não pede aviso — a parcela baixa sozinha. */
  it('com o Mercado Pago da turma, o PIX dele abre a tela e não pede "já paguei"', async () => {
    responder(parcelaDeTeste(), cobrancaDeTeste([pixDeTeste()], [pixDoMercadoPagoDeTeste()]))

    renderizarPagamento()

    expect(await screen.findByText('Confirmação automática pelo Mercado Pago da turma.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'QR Code do PIX' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Não precisa avisar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Já paguei' })).not.toBeInTheDocument()

    /** Sprint 35: com os dois PIX, o da comissão não se chama "PIX" de novo. */
    await userEvent.click(screen.getByRole('button', { name: 'Chave PIX' }))

    expect(await screen.findByRole('button', { name: 'Já paguei' })).toBeInTheDocument()
  })

  /**
   * Sprint 39, P2 e P3: com a taxa repassada, a tela mostra o valor do PIX e o do cartão antes de pagar; o
   * formulário do Mercado Pago é montado com a chave da turma e o valor do cartão, e o envio paga com ele.
   */
  it('no cartão, mostra os dois valores e paga pelo formulário do Mercado Pago', async () => {
    responder(
      parcelaDeTeste(),
      cobrancaDeTeste([pixDeTeste()], [pixDoMercadoPagoDeTeste(), cartaoDoMercadoPagoDeTeste(1_842)]),
    )
    const pagamentos: unknown[] = []
    servidor.use(
      http.post(`${env.VITE_API_URL}/api/v1/parcelas/cartao`, async ({ request }) => {
        pagamentos.push(await request.json())
        return HttpResponse.json({ situacao: 'Pago' })
      }),
    )
    const formulario = simularMercadoPago()

    renderizarPagamento()
    await userEvent.click(await screen.findByRole('button', { name: 'Cartão de crédito' }))

    expect(await screen.findByText('No cartão')).toBeInTheDocument()
    expect(screen.getByText('No cartão').nextElementSibling).toHaveTextContent(/R\$\s368,42/)
    expect(screen.getByText(/O cartão inclui R\$\s18,42 da taxa do cartão/)).toBeInTheDocument()
    await waitFor(() => expect(formulario.chavePublica()).toBe('APP_USR-publica'))
    expect(formulario.valorEmReais()).toBe(368.42)

    await formulario.enviar('tok-1', 'master', 3)

    expect(pagamentos).toEqual([
      { parcela_ids: ['pa-1'], token: 'tok-1', bandeira: 'master', parcelas: 3, valor_em_centavos: 36_842 },
    ])
  })

  /** Sprint 39: o cartão recusado rejeita o envio — o formulário do Mercado Pago volta para outra tentativa. */
  it('cartão recusado rejeita o envio para tentar de novo', async () => {
    responder(parcelaDeTeste(), cobrancaDeTeste([pixDeTeste()], [cartaoDoMercadoPagoDeTeste(0)]))
    servidor.use(
      http.post(`${env.VITE_API_URL}/api/v1/parcelas/cartao`, () =>
        HttpResponse.json(
          { status: 409, codigo: 'pagamento.cartao_recusado', detail: 'O cartão foi recusado.' },
          { status: 409 },
        ),
      ),
    )
    const formulario = simularMercadoPago()

    renderizarPagamento()
    await userEvent.click(await screen.findByRole('button', { name: 'Cartão de crédito' }))
    await waitFor(() => expect(formulario.chavePublica()).toBe('APP_USR-publica'))

    await expect(formulario.enviar('tok-1')).rejects.toBeTruthy()
    expect(screen.queryByText('No cartão')).not.toBeInTheDocument()
  })
})
