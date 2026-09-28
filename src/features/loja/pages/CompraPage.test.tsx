import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
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
    expect(screen.getByText('A definir')).toBeInTheDocument()
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

    await usuario.click(await screen.findByRole('button', { name: 'Nomear convidado' }))
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
    servidor.use(http.get(COMPRA, () => HttpResponse.json(compra({ status: 'ADevolver', cobranca: null }))))

    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent('a devolução é feita por ela')
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
