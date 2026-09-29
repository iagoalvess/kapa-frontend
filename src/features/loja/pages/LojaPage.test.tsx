import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import type { Compra, ItemDaLoja, Loja } from '../types/loja.types'
import LojaPage from './LojaPage'

const LOJA = `${env.VITE_API_URL}/api/v1/loja/f-1`

const item = (dados: Partial<ItemDaLoja> = {}): ItemDaLoja => ({
  id: 'i-1',
  descricao: 'Convite adulto',
  preco_em_centavos: 25_000,
  disponivel: 12,
  limite_por_pessoa: 4,
  abertura_de_vendas: null,
  vendas_ate: null,
  aberto: true,
  ...dados,
})

const loja = (dados: Partial<Loja> = {}): Loja => ({
  turma: 'Medicina 2027',
  instituicao: 'UFPR',
  festa: null,
  contato_da_comissao: 'presidencia@med27.dev',
  meios: ['Pix'],
  agora: new Date().toISOString(),
  itens: [item()],
  ...dados,
})

const compra: Compra = {
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
  contato_da_comissao: null,
  festa: null,
  cobranca: null,
  lista_aberta: true,
  pode_apagar_dados: false,
  formatura_id: '01a09d04-81c4-70cb-a89f-a092091158dd',
  convites: [],
  convites_cancelados: 0,
  valor_a_devolver_em_centavos: 0,
  pedido_de_cancelamento: null,
  pode_pedir_cancelamento: false,
  cartao: null,
}

function abrir() {
  return renderizar(<LojaPage />, '/loja/f-1', '/loja/:formaturaId')
}

async function preencher(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.clear(await screen.findByLabelText('Quantos convites'))
  await usuario.type(screen.getByLabelText('Quantos convites'), '2')
  await usuario.type(screen.getByLabelText('Seu nome'), 'Maria Souza')
  await usuario.type(screen.getByLabelText('E-mail'), 'maria@teste.dev')
  await usuario.type(screen.getByLabelText('CPF'), '529.982.247-25')
  await usuario.click(screen.getByRole('checkbox', { name: 'Li como meus dados são usados' }))
  await usuario.click(screen.getByRole('button', { name: /^Continuar/ }))
  const nomes = screen.getAllByLabelText('Nome completo')
  const documentos = screen.getAllByLabelText('Número')
  await usuario.type(nomes[0]!, 'Tia Carmem')
  await usuario.type(documentos[0]!, '111.444.777-35')
  await usuario.type(nomes[1]!, 'Tio Beto')
  await usuario.selectOptions(screen.getAllByLabelText('Documento')[1]!, 'Rg')
  await usuario.type(documentos[1]!, '12.345.678-9')
}

describe('LojaPage', () => {
  it('diz quem vende e mostra quantos restam', async () => {
    servidor.use(http.get(LOJA, () => HttpResponse.json(loja())))

    abrir()

    expect(await screen.findByText('Restam 12')).toBeInTheDocument()
    expect(screen.getByText('Medicina 2027', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'presidencia@med27.dev' })).toBeInTheDocument()
  })

  it('com um convite só, ele é o título; com vários, a lista mostra cada um', async () => {
    servidor.use(http.get(LOJA, () => HttpResponse.json(loja())))
    const { unmount } = abrir()

    expect(await screen.findByRole('heading', { level: 1, name: 'Convite adulto' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Convites à venda' })).not.toBeInTheDocument()
    unmount()

    servidor.use(
      http.get(LOJA, () =>
        HttpResponse.json(loja({ itens: [item(), item({ id: 'i-2', descricao: 'Convite infantil' })] })),
      ),
    )
    abrir()

    const lista = await screen.findByRole('list', { name: 'Convites à venda' })
    expect(within(lista).getByText('Convite adulto')).toBeInTheDocument()
    expect(within(lista).getByText('Convite infantil')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Convites da festa' })).toBeInTheDocument()
  })

  it('esgotado diz esgotado e não oferece a compra', async () => {
    servidor.use(http.get(LOJA, () => HttpResponse.json(loja({ itens: [item({ disponivel: 0 })] }))))

    abrir()

    expect(await screen.findByText('Esgotado')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Comprar' })).not.toBeInTheDocument()
  })

  /** Decisão 8: o celular com o relógio adiantado não abre a venda antes da hora do servidor. */
  it('conta a abertura pelo relógio do servidor, não pelo do aparelho', async () => {
    const agoraNoServidor = '2020-01-01T12:00:00Z'
    servidor.use(
      http.get(LOJA, () =>
        HttpResponse.json(
          loja({
            agora: agoraNoServidor,
            itens: [item({ aberto: false, abertura_de_vendas: '2020-01-01T12:10:00Z' })],
          }),
        ),
      ),
    )

    abrir()

    expect(await screen.findByRole('timer')).toHaveTextContent(
      /As vendas abrem em (10 min 00 s|09 min 5\d s)/,
    )
    expect(screen.getByText('Em breve')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Comprar' })).not.toBeInTheDocument()
  })

  it('leva o erro do documento de um convidado para o campo dele', async () => {
    servidor.use(
      http.get(LOJA, () => HttpResponse.json(loja())),
      http.post(`${LOJA}/compras`, () =>
        HttpResponse.json(
          {
            status: 400,
            codigo: 'validacao.invalido',
            detail: 'Dados inválidos.',
            errors: { 'convidados[1].numero_do_documento': ['RG inválido: de 5 a 14 letras e números.'] },
          },
          { status: 400 },
        ),
      ),
    )
    const usuario = userEvent.setup()
    abrir()

    await preencher(usuario)
    await usuario.click(screen.getByRole('button', { name: /^Comprar/ }))

    expect(await screen.findByText('RG inválido: de 5 a 14 letras e números.')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Número')[1]).toHaveAttribute('aria-invalid', 'true')
  })

  /** Decisão 7: a fila cheia repete sozinha, com a mesma chave — uma compra só. */
  it('repete a compra na fila cheia com a mesma chave e vai para a compra', async () => {
    const chaves: string[] = []
    servidor.use(
      http.get(LOJA, () => HttpResponse.json(loja())),
      http.post(`${LOJA}/compras`, async ({ request }) => {
        const corpo = (await request.json()) as {
          chave_de_idempotencia: string
          cpf: string
          quantidade: number
          convidados: unknown[]
        }
        chaves.push(corpo.chave_de_idempotencia)
        expect(corpo.cpf).toBe('52998224725')
        expect(corpo.quantidade).toBe(2)
        expect(corpo.convidados).toEqual([
          {
            nome: 'Tia Carmem',
            tipo_do_documento: 'Cpf',
            numero_do_documento: '111.444.777-35',
            email: null,
          },
          { nome: 'Tio Beto', tipo_do_documento: 'Rg', numero_do_documento: '12.345.678-9', email: null },
        ])

        return chaves.length === 1
          ? HttpResponse.json(
              { status: 429, codigo: 'loja.fila_cheia', detail: 'Muita gente comprando agora.' },
              { status: 429, headers: { 'Retry-After': '1' } },
            )
          : HttpResponse.json({ token: 'tok-1', compra })
      }),
    )
    const usuario = userEvent.setup()
    const { router } = abrir()

    await preencher(usuario)
    await usuario.click(screen.getByRole('button', { name: /^Comprar/ }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/compra/tok-1'), { timeout: 4000 })
    expect(chaves).toHaveLength(2)
    expect(chaves[0]).toBe(chaves[1])
  })

  it('esgotado na hora da compra aparece no formulário e relê a vitrine', async () => {
    let leituras = 0
    servidor.use(
      http.get(LOJA, () => {
        leituras++
        return HttpResponse.json(loja())
      }),
      http.post(`${LOJA}/compras`, () =>
        HttpResponse.json(
          { status: 409, codigo: 'loja.esgotado', detail: 'Os convites esgotaram.' },
          { status: 409 },
        ),
      ),
    )
    const usuario = userEvent.setup()
    abrir()

    await preencher(usuario)
    await usuario.click(screen.getByRole('button', { name: /^Comprar/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Os convites esgotaram.')
    await waitFor(() => expect(leituras).toBeGreaterThan(1))
  })

  /** Sprint 35: um meio só não pergunta nada, e a compra não leva endereço. */
  it('com um meio só, não pergunta como pagar e compra pelo PIX sem endereço', async () => {
    const corpos: Record<string, unknown>[] = []
    servidor.use(
      http.get(LOJA, () => HttpResponse.json(loja())),
      http.post(`${LOJA}/compras`, async ({ request }) => {
        corpos.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json({ token: 'tok-1', compra })
      }),
    )
    const usuario = userEvent.setup()
    abrir()

    await preencher(usuario)
    expect(screen.queryByRole('group', { name: 'Como você quer pagar?' })).not.toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: /^Comprar/ }))

    await waitFor(() => expect(corpos).toHaveLength(1))
    expect(corpos[0]?.meio).toBe('Pix')
    expect(corpos[0]).not.toHaveProperty('endereco')
  })

  it('com mais de um meio, o comprador escolhe e o escolhido vai na compra', async () => {
    const corpos: Record<string, unknown>[] = []
    servidor.use(
      http.get(LOJA, () => HttpResponse.json(loja({ meios: ['Pix', 'Cartao'] }))),
      http.post(`${LOJA}/compras`, async ({ request }) => {
        corpos.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json({ token: 'tok-1', compra })
      }),
    )
    const usuario = userEvent.setup()
    abrir()

    await usuario.click(await screen.findByRole('button', { name: 'Cartão de crédito' }))
    await preencher(usuario)
    await usuario.click(screen.getByRole('button', { name: /^Comprar/ }))

    await waitFor(() => expect(corpos[0]?.meio).toBe('Cartao'))
  })

  it('reenvia o link com a mesma resposta exista compra ou não', async () => {
    servidor.use(
      http.get(LOJA, () => HttpResponse.json(loja())),
      http.post(`${LOJA}/reenvio`, () => new HttpResponse(null, { status: 204 })),
    )
    const usuario = userEvent.setup()
    abrir()

    await usuario.click(await screen.findByText('Já comprei e não acho meus convites'))
    await usuario.type(screen.getByLabelText('E-mail que você usou na compra'), 'maria@teste.dev')
    await usuario.click(screen.getByRole('button', { name: 'Receber de novo' }))

    expect(await screen.findByText(/Se você comprou com este e-mail/)).toBeInTheDocument()
  })
})
