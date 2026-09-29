import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { simularMercadoPago } from '@/test/mercadoPago'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import type { MeuConvite } from '@/types/festa'
import type { Compra } from '../types/loja.types'
import CompraPage from './CompraPage'

const TOKEN = 'abc.def'
const COMPRA = `${env.VITE_API_URL}/api/v1/loja/compras/${encodeURIComponent(TOKEN)}`

const convite = (dados: Partial<MeuConvite> = {}): MeuConvite => ({
  id: 'cv-1',
  sequencial: 1,
  codigo: 'MED27-7QK4',
  token: null,
  nome_do_convidado: null,
  tipo_do_documento: null,
  documento: null,
  email_do_convidado: null,
  emitido_em: '2026-09-24T12:00:00Z',
  validado_em: null,
  ...dados,
})

const compra = (dados: Partial<Compra> = {}): Compra => ({
  id: 'c-1',
  status: 'Pendente',
  item: 'Convite adulto',
  quantidade: 2,
  valor_em_centavos: 50_000,
  meio: 'Pix',
  expira_em: '2030-01-01T00:00:00Z',
  paga_em: null,
  nome_do_comprador: 'Maria Souza',
  email: 'm***@teste.dev',
  turma: 'Medicina 2027',
  contato_da_comissao: 'presidencia@med27.dev',
  festa: null,
  cobranca: {
    meio: 'Pix',
    copia_e_cola: '00020126PIXDACOMPRA',
    expira_em: '2030-01-01T00:00:00Z',
  },
  lista_aberta: true,
  pode_apagar_dados: false,
  formatura_id: '01a09d04-81c4-70cb-a89f-a092091158dd',
  convites: [],
  convites_cancelados: 0,
  valor_a_devolver_em_centavos: 0,
  pedido_de_cancelamento: null,
  pode_pedir_cancelamento: false,
  cartao: null,
  ...dados,
})

function abrir() {
  return renderizar(<CompraPage />, `/compra/${TOKEN}`, '/compra/:token')
}

describe('CompraPage', () => {
  it('pendente mostra o PIX e vira paga sozinha quando o pagamento cai', async () => {
    let leituras = 0
    servidor.use(
      http.get(COMPRA, () => {
        leituras++
        return HttpResponse.json(
          leituras === 1 ? compra() : compra({ status: 'Paga', cobranca: null, convites: [convite()] }),
        )
      }),
    )

    abrir()

    expect(await screen.findByDisplayValue('00020126PIXDACOMPRA')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Seus convites' }, { timeout: 7000 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Falta dizer quem vai usar')).toBeInTheDocument()
  }, 10_000)

  it('sem documento, oferece gerar o pagamento', async () => {
    servidor.use(
      http.get(COMPRA, () => HttpResponse.json(compra({ cobranca: null }))),
      http.post(`${COMPRA}/cobranca`, () => HttpResponse.json(compra())),
    )
    const usuario = userEvent.setup()
    abrir()

    await usuario.click(await screen.findByRole('button', { name: 'Gerar pagamento' }))

    expect(await screen.findByDisplayValue('00020126PIXDACOMPRA')).toBeInTheDocument()
  })

  /** Sprint 39, P5: a compra no cartão mostra o formulário do Mercado Pago, e aprovada vira paga com os convites. */
  it('no cartão, paga pelo formulário e mostra os convites na hora', async () => {
    const cartao = {
      chave_publica: 'APP_USR-publica',
      valor_em_centavos: 52_632,
      acrescimo_em_centavos: 2_632,
      maximo_de_parcelas: 12,
    }
    const pagamentos: unknown[] = []
    servidor.use(
      http.get(COMPRA, () => HttpResponse.json(compra({ meio: 'Cartao', cobranca: null, cartao }))),
      http.post(`${COMPRA}/cartao`, async ({ request }) => {
        pagamentos.push(await request.json())
        return HttpResponse.json(
          compra({ status: 'Paga', meio: 'Cartao', cobranca: null, convites: [convite()] }),
        )
      }),
    )
    const formulario = simularMercadoPago()
    abrir()

    expect(await screen.findByText('No cartão')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gerar pagamento' })).not.toBeInTheDocument()
    await waitFor(() => expect(formulario.chavePublica()).toBe('APP_USR-publica'))
    await formulario.enviar('tok-1', 'visa', 2)

    expect(await screen.findByRole('heading', { name: 'Seus convites' })).toBeInTheDocument()
    expect(pagamentos).toEqual([{ token: 'tok-1', bandeira: 'visa', parcelas: 2, valor_em_centavos: 52_632 }])
  })

  it('paga: nomeia o convite pelo link, sem conta', async () => {
    let corpo: unknown = null
    servidor.use(
      http.get(COMPRA, () =>
        HttpResponse.json(compra({ status: 'Paga', cobranca: null, convites: [convite()] })),
      ),
      http.put(`${COMPRA}/convites/cv-1/convidado`, async ({ request }) => {
        corpo = await request.json()
        return HttpResponse.json(convite({ nome_do_convidado: 'Tia Carmem', token: 'MED27-7QK4-XX' }))
      }),
    )
    const usuario = userEvent.setup()
    abrir()

    await usuario.click(await screen.findByRole('button', { name: 'Dizer quem vai' }))
    await usuario.type(screen.getByLabelText('Nome do convidado'), 'Tia Carmem')
    await usuario.selectOptions(screen.getByLabelText('Documento'), 'Cpf')
    await usuario.type(screen.getByLabelText('Número'), '111.444.777-35')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(corpo).toEqual({
        nome: 'Tia Carmem',
        tipo_do_documento: 'Cpf',
        numero_do_documento: '111.444.777-35',
        email: null,
      }),
    )
  })

  it('a devolver explica que o dinheiro volta pela turma', async () => {
    servidor.use(
      http.get(COMPRA, () =>
        HttpResponse.json(
          compra({
            status: 'ADevolver',
            cobranca: null,
            convites_cancelados: 2,
            valor_a_devolver_em_centavos: 50_000,
          }),
        ),
      ),
    )

    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent(/turma vai devolver R\$\s500,00/)
  })

  it('cancelamento parcial mostra os convites que continuam e quanto volta', async () => {
    servidor.use(
      http.get(COMPRA, () =>
        HttpResponse.json(
          compra({
            status: 'ADevolver',
            cobranca: null,
            convites: [convite({ nome_do_convidado: 'Tia Carmem' })],
            convites_cancelados: 1,
            valor_a_devolver_em_centavos: 25_000,
          }),
        ),
      ),
    )

    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '1 convite desta compra foi cancelado; o outro continua valendo',
    )
    expect(screen.getByText('Tia Carmem')).toBeInTheDocument()
  })

  it('pede o cancelamento de um convite e passa a mostrar o pedido aberto (P1)', async () => {
    const paga = compra({
      status: 'Paga',
      cobranca: null,
      convites: [convite(), convite({ id: 'cv-2', sequencial: 2, codigo: 'MED27-9ZZ1' })],
      pode_pedir_cancelamento: true,
    })
    let corpo: unknown
    servidor.use(
      http.get(COMPRA, () => HttpResponse.json(paga)),
      http.post(`${COMPRA}/pedido-de-cancelamento`, async ({ request }) => {
        corpo = await request.json()
        return HttpResponse.json({
          ...paga,
          pode_pedir_cancelamento: false,
          pedido_de_cancelamento: {
            status: 'Aberto',
            pedido_em: '2026-09-28T12:00:00Z',
            convites: 1,
            respondido_em: null,
            motivo_da_resposta: null,
          },
        })
      }),
    )
    const usuario = userEvent.setup()
    abrir()

    await usuario.click(await screen.findByRole('button', { name: 'Pedir cancelamento' }))
    const dialogo = await screen.findByRole('alertdialog')
    const enviar = within(dialogo).getByRole('button', { name: 'Pedir cancelamento' })
    expect(enviar).toBeDisabled()
    await usuario.click(within(dialogo).getByRole('checkbox', { name: /MED27-9ZZ1/ }))
    await usuario.type(within(dialogo).getByLabelText('Motivo (opcional)'), 'Não vou poder ir')
    await usuario.click(enviar)

    await waitFor(() => expect(corpo).toEqual({ convite_ids: ['cv-2'], motivo: 'Não vou poder ir' }))
    expect(await screen.findByText(/Você pediu o cancelamento de 1 convite/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pedir cancelamento' })).not.toBeInTheDocument()
  })

  it('pedido recusado mostra o motivo da comissão', async () => {
    servidor.use(
      http.get(COMPRA, () =>
        HttpResponse.json(
          compra({
            status: 'Paga',
            cobranca: null,
            convites: [convite()],
            pedido_de_cancelamento: {
              status: 'Recusado',
              pedido_em: '2026-09-20T12:00:00Z',
              convites: 1,
              respondido_em: '2026-09-21T12:00:00Z',
              motivo_da_resposta: 'Fora do prazo',
            },
          }),
        ),
      ),
    )

    abrir()

    expect(await screen.findByText(/A comissão recusou o seu pedido/)).toHaveTextContent('“Fora do prazo”')
  })

  it('link antigo diz que não vale mais', async () => {
    servidor.use(
      http.get(COMPRA, () =>
        HttpResponse.json({ status: 404, codigo: 'loja.compra_nao_encontrada' }, { status: 404 }),
      ),
    )

    abrir()

    expect(await screen.findByRole('heading', { name: 'Compra não encontrada' })).toBeInTheDocument()
  })
})
