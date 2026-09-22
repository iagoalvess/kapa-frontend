import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, reais, renderizar } from '@/test/utils'
import type { ItemDaFesta, MetaDaFesta, Proposta } from '@/types/festa'
import FestaPage from './FestaPage'

const ITENS = `${env.VITE_API_URL}/api/v1/festa/itens`
const META = `${env.VITE_API_URL}/api/v1/festa/meta`
const PROPOSTAS = `${env.VITE_API_URL}/api/v1/festa/propostas`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

/** Um item "a contratar": sem despesa, o custo é o que a comissão orçou. */
const aContratar: ItemDaFesta = {
  id: 'i-1',
  titulo: 'Buffet',
  categoria: 'Buffet',
  o_que_inclui: 'Open bar de **4 horas**.',
  fornecedor: null,
  documento: null,
  rateio: 'Turma',
  valor_previsto_em_centavos: 60_000_00,
  quantidade_estimada: 1,
  custo_previsto_em_centavos: 60_000_00,
  contratado_em_centavos: 0,
  pago_em_centavos: 0,
  custo_em_centavos: 60_000_00,
  quantidade_de_despesas: 0,
  quantidade_de_propostas: 0,
  estado: 'AContratar',
  cancelado: false,
  ordem: 1,
}

/** Contratado por menos que o orçado, metade pago — o caso que prova a decisão 3. */
const contratado: ItemDaFesta = {
  ...aContratar,
  id: 'i-2',
  titulo: 'Espaço',
  categoria: 'Espaco',
  o_que_inclui: null,
  fornecedor: 'Clube Central',
  valor_previsto_em_centavos: 40_000_00,
  custo_previsto_em_centavos: 40_000_00,
  contratado_em_centavos: 35_000_00,
  pago_em_centavos: 17_500_00,
  custo_em_centavos: 35_000_00,
  quantidade_de_despesas: 2,
  estado: 'Contratado',
  ordem: 2,
}

/** O item que nem todo mundo compra: preço por pessoa vezes a expectativa da comissão. */
const porFormando: ItemDaFesta = {
  ...aContratar,
  id: 'i-3',
  titulo: 'Fotografia',
  categoria: 'Fotografia',
  o_que_inclui: null,
  rateio: 'PorFormando',
  valor_previsto_em_centavos: 350_00,
  quantidade_estimada: 40,
  custo_previsto_em_centavos: 14_000_00,
  custo_em_centavos: 14_000_00,
  ordem: 3,
}

const meta: MetaDaFesta = {
  custo_em_centavos: 109_000_00,
  pago_em_centavos: 17_500_00,
  arrecadado_em_centavos: 70_000_00,
  falta_arrecadar_em_centavos: 39_000_00,
  itens: 3,
  a_contratar: 2,
  pagos: 0,
}

/**
 * A API da tela: a lista, a meta e o detalhe de qualquer item dela.
 *
 * O detalhe é resolvido a partir da própria lista — é o que a API faz —, então cada teste declara
 * só os itens e, quando precisa, as propostas de um deles.
 *
 * @param itens Os itens da turma.
 * @param propostas As propostas, por id de item.
 */
function comApi(
  itens: ItemDaFesta[] = [aContratar, contratado, porFormando],
  propostas: Record<string, Proposta[]> = {},
) {
  servidor.use(
    http.get(ITENS, () => HttpResponse.json(itens)),
    http.get(META, () => HttpResponse.json(meta)),
    http.get(`${ITENS}/:id/detalhe`, ({ params }) => {
      const item = itens.find((candidato) => candidato.id === params.id)

      return item
        ? HttpResponse.json({ item, propostas: propostas[item.id] ?? [] })
        : new HttpResponse(null, { status: 404 })
    }),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
  )
}

/** O painel da direita, que é onde o item aberto é desenhado. */
const detalhe = (titulo: string) => screen.findByRole('region', { name: titulo })

/** Uma seção da lista da esquerda. */
const secao = (estado: string) => screen.findByRole('region', { name: estado })

describe('FestaPage', () => {
  afterEach(() => sessao.encerrar())

  it('a lista agrupa por estado e o primeiro item abre à direita', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<FestaPage />)

    // Cada estado é uma seção da lista, e só os que têm item aparecem.
    expect(within(await secao('A contratar')).getAllByRole('listitem')).toHaveLength(2)
    expect(within(await secao('Contratado')).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.queryByRole('region', { name: 'Pago' })).not.toBeInTheDocument()

    // Sem id na rota, o primeiro abre: a direita nunca fica vazia.
    const buffet = await detalhe('Buffet')
    expect(within(buffet).getByText('Orçado')).toBeInTheDocument()
    expect(within(buffet).getByText(reais(60_000_00))).toBeInTheDocument()
  })

  it('o item da rota é o que abre, e o custo contratado toma o lugar do orçado', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<FestaPage />, '/festa/i-2', '/festa/:id')

    const espaco = await detalhe('Espaço')
    expect(within(espaco).getByText('Contratado', { selector: 'dt' })).toBeInTheDocument()
    // O contratado (R$ 35.000), e não o orçado (R$ 40.000): o real toma o lugar do previsto.
    expect(within(espaco).getByText(reais(35_000_00))).toBeInTheDocument()
    expect(within(espaco).queryByText(reais(40_000_00))).not.toBeInTheDocument()
  })

  it('o item por formando mostra o preço de cada um e some com a expectativa depois de contratado', async () => {
    entrarComo('Comissao')
    comApi()

    const { unmount } = renderizar(<FestaPage />, '/festa/i-3', '/festa/:id')

    const foto = await detalhe('Fotografia')
    expect(within(foto).getByText(reais(14_000_00))).toBeInTheDocument()
    expect(within(foto).getByText(/40 estimados/)).toBeInTheDocument()

    unmount()
    comApi([
      {
        ...porFormando,
        contratado_em_centavos: 12_950_00,
        custo_em_centavos: 12_950_00,
        quantidade_de_despesas: 1,
        estado: 'Contratado',
      },
    ])

    renderizar(<FestaPage />, '/festa/i-3', '/festa/:id')

    const contratada = await detalhe('Fotografia')
    expect(within(contratada).getByText(reais(12_950_00))).toBeInTheDocument()
    expect(within(contratada).getByText(reais(350_00))).toBeInTheDocument()
    expect(within(contratada).queryByText(/estimados/)).not.toBeInTheDocument()
  })

  it('o formando lê a tela e não recebe nenhuma ação de escrita', async () => {
    entrarComo('Formando')
    comApi()

    renderizar(<FestaPage />)

    await detalhe('Buffet')
    expect(screen.queryByRole('button', { name: 'Novo item' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Contratar' })).not.toBeInTheDocument()
  })

  it('só a Tesouraria contrata: a Comissão cria e edita, mas não lança despesa', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<FestaPage />)

    const buffet = await detalhe('Buffet')
    expect(within(buffet).getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(within(buffet).queryByRole('button', { name: 'Contratar' })).not.toBeInTheDocument()
  })

  it('item sem despesa oferece excluir; com despesa, cancelar', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<FestaPage />)

    const buffet = await detalhe('Buffet')
    expect(within(buffet).getByRole('button', { name: 'Excluir' })).toBeInTheDocument()
    expect(within(buffet).getByRole('button', { name: 'Contratar' })).toBeInTheDocument()
  })

  it('cancelar avisa que as despesas já lançadas continuam no caixa', async () => {
    entrarComo('Tesoureiro')
    comApi()
    let cancelou = false
    servidor.use(
      http.post(`${ITENS}/i-2/cancelamento`, () => {
        cancelou = true
        return HttpResponse.json({ ...contratado, cancelado: true, estado: 'Cancelado' })
      }),
    )

    renderizar(<FestaPage />, '/festa/i-2', '/festa/:id')

    const espaco = await detalhe('Espaço')
    // Contratado já: contratar de novo seria um segundo contrato para o mesmo item.
    expect(within(espaco).queryByRole('button', { name: 'Contratar' })).not.toBeInTheDocument()
    expect(within(espaco).queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()

    await userEvent.click(within(espaco).getByRole('button', { name: 'Cancelar' }))

    const dialogo = await screen.findByRole('alertdialog')
    expect(within(dialogo).getByText(/não são canceladas/)).toBeInTheDocument()

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar item' }))
    await waitFor(() => expect(cancelou).toBe(true))
  })

  it('o contrato ligado ao item abre o arquivo do acervo', async () => {
    entrarComo('Formando')
    comApi([
      {
        ...contratado,
        documento: {
          id: 'doc-1',
          titulo: 'Contrato do buffet',
          nome_do_arquivo: 'contrato.pdf',
          content_type: 'application/pdf',
        },
      },
    ])
    let baixou = false
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/comunicacao/documentos/doc-1/download`, () => {
        baixou = true
        return HttpResponse.text('%PDF-1.4')
      }),
    )

    renderizar(<FestaPage />)

    const espaco = await detalhe('Espaço')
    // O botão diz "Contrato"; o nome do arquivo fica no nome acessível, para quem usa leitor de tela.
    await userEvent.click(within(espaco).getByRole('button', { name: 'Abrir Contrato do buffet' }))

    // O arquivo continua no acervo: o painel só o linka, e quem autoriza é o endpoint de lá.
    await waitFor(() => expect(baixou).toBe(true))
  })

  it('turma sem item nenhum explica a tela em vez de mostrar uma lista vazia', async () => {
    entrarComo('Formando')
    comApi([])

    renderizar(<FestaPage />)

    expect(await screen.findByText('A festa ainda não tem itens')).toBeInTheDocument()
    expect(screen.getByText(/ainda não descreveu/)).toBeInTheDocument()
  })
})

describe('FestaPage — propostas e votos', () => {
  afterEach(() => sessao.encerrar())

  const bandaX: Proposta = {
    id: 'p-1',
    titulo: 'Banda X',
    valor_em_centavos: 8_000_00,
    o_que_inclui: 'Quatro horas de show.',
    votos: 18,
    meu_voto: false,
  }

  const bandaY: Proposta = {
    id: 'p-2',
    titulo: 'Banda Y',
    valor_em_centavos: 6_500_00,
    o_que_inclui: null,
    votos: 7,
    meu_voto: true,
  }

  it('o formando vê as propostas com o placar e vota numa delas', async () => {
    entrarComo('Formando')
    comApi([aContratar], { 'i-1': [bandaX, bandaY] })
    let votou = ''
    servidor.use(
      http.put(`${PROPOSTAS}/:id/voto`, ({ params }) => {
        votou = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizar(<FestaPage />)

    const propostas = await screen.findByRole('region', { name: 'Propostas' })
    expect(within(propostas).getByText('Banda X')).toBeInTheDocument()
    expect(within(propostas).getByText(reais(8_000_00))).toBeInTheDocument()

    await userEvent.click(within(propostas).getByRole('button', { name: /18 votos/ }))

    await waitFor(() => expect(votou).toBe('p-1'))
  })

  it('clicar na proposta que já é minha tira o voto, e não soma um segundo', async () => {
    entrarComo('Formando')
    comApi([aContratar], { 'i-1': [bandaX, bandaY] })
    let desvotou = ''
    servidor.use(
      http.delete(`${ITENS}/:id/voto`, ({ params }) => {
        desvotou = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizar(<FestaPage />)

    const propostas = await screen.findByRole('region', { name: 'Propostas' })
    const minha = within(propostas).getByRole('button', { name: /7 votos/ })
    expect(minha).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(minha)

    // O voto é por item, não por proposta: tirá-lo é um DELETE no item.
    await waitFor(() => expect(desvotou).toBe('i-1'))
  })

  it('contratado o item, a disputa fecha: o placar fica, o voto e o cadastro somem', async () => {
    entrarComo('Comissao')
    comApi([contratado], { 'i-2': [bandaX] })

    renderizar(<FestaPage />)

    const propostas = await screen.findByRole('region', { name: 'Propostas' })
    expect(within(propostas).getByText('Propostas levantadas')).toBeInTheDocument()
    expect(within(propostas).getByRole('button', { name: /18 votos/ })).toBeDisabled()
    expect(within(propostas).queryByRole('button', { name: 'Nova proposta' })).not.toBeInTheDocument()
  })

  it('o formando não cadastra proposta; a Gestão cadastra', async () => {
    entrarComo('Formando')
    comApi([aContratar], { 'i-1': [bandaX] })

    const { unmount } = renderizar(<FestaPage />)

    await screen.findByRole('region', { name: 'Propostas' })
    expect(screen.queryByRole('button', { name: 'Nova proposta' })).not.toBeInTheDocument()

    unmount()
    sessao.encerrar()
    entrarComo('Comissao')
    comApi([aContratar], { 'i-1': [bandaX] })

    renderizar(<FestaPage />)

    expect(await screen.findByRole('button', { name: 'Nova proposta' })).toBeInTheDocument()
  })
})
