import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, reais, renderizar } from '@/test/utils'
import type { ItemDaFesta, MetaDaFesta } from '@/types/festa'
import FestaPage from './FestaPage'

const ITENS = `${env.VITE_API_URL}/api/v1/festa/itens`
const META = `${env.VITE_API_URL}/api/v1/festa/meta`
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

function comApi(itens: ItemDaFesta[] = [aContratar, contratado, porFormando]) {
  servidor.use(
    http.get(ITENS, () => HttpResponse.json(itens)),
    http.get(META, () => HttpResponse.json(meta)),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
  )
}

const cartao = (titulo: string) => screen.findByRole('region', { name: titulo })

describe('FestaPage', () => {
  afterEach(() => sessao.encerrar())

  it('o custo do item é o orçado enquanto não há despesa, e o contratado depois dela', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<FestaPage />)

    const buffet = await cartao('Buffet')
    expect(within(buffet).getByText('Orçado')).toBeInTheDocument()
    expect(within(buffet).getByText(reais(60_000_00))).toBeInTheDocument()
    expect(within(buffet).getByText('A contratar')).toBeInTheDocument()

    const espaco = await cartao('Espaço')
    expect(within(espaco).getByText('Contratado', { selector: 'dt' })).toBeInTheDocument()
    // O contratado (R$ 35.000), e não o orçado (R$ 40.000): o real toma o lugar do previsto.
    expect(within(espaco).getByText(reais(35_000_00))).toBeInTheDocument()
    expect(within(espaco).queryByText(reais(40_000_00))).not.toBeInTheDocument()
    expect(within(espaco).getByText('Clube Central')).toBeInTheDocument()
  })

  it('o item por formando mostra o preço de cada um e o custo da expectativa', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<FestaPage />)

    const foto = await cartao('Fotografia')
    expect(within(foto).getByText(reais(14_000_00))).toBeInTheDocument()
    expect(within(foto).getByText(reais(350_00))).toBeInTheDocument()
    expect(within(foto).getByText(/40 estimados/)).toBeInTheDocument()
  })

  it('o formando lê a tela e não recebe nenhuma ação de escrita', async () => {
    entrarComo('Formando')
    comApi()

    renderizar(<FestaPage />)

    await cartao('Buffet')
    expect(screen.queryByRole('button', { name: 'Novo item' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Contratar' })).not.toBeInTheDocument()
  })

  it('só a Tesouraria contrata: a Comissão cria e edita, mas não lança despesa', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<FestaPage />)

    const buffet = await cartao('Buffet')
    expect(within(buffet).getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(within(buffet).queryByRole('button', { name: 'Contratar' })).not.toBeInTheDocument()
  })

  it('item sem despesa oferece excluir; com despesa, cancelar', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<FestaPage />)

    const buffet = await cartao('Buffet')
    expect(within(buffet).getByRole('button', { name: 'Excluir' })).toBeInTheDocument()
    expect(within(buffet).getByRole('button', { name: 'Contratar' })).toBeInTheDocument()

    const espaco = await cartao('Espaço')
    expect(within(espaco).getByRole('button', { name: 'Cancelar item' })).toBeInTheDocument()
    expect(within(espaco).queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()
    // Contratado já: contratar de novo seria um segundo contrato para o mesmo item.
    expect(within(espaco).queryByRole('button', { name: 'Contratar' })).not.toBeInTheDocument()
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

    renderizar(<FestaPage />)

    const espaco = await cartao('Espaço')
    await userEvent.click(within(espaco).getByRole('button', { name: 'Cancelar item' }))

    const dialogo = await screen.findByRole('alertdialog')
    expect(within(dialogo).getByText(/não são canceladas/)).toBeInTheDocument()

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar item' }))
    await waitFor(() => expect(cancelou).toBe(true))
  })

  it('o contrato ligado ao item aparece no cartão e abre o arquivo do acervo', async () => {
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

    const espaco = await cartao('Espaço')
    await userEvent.click(within(espaco).getByRole('button', { name: 'Contrato do buffet' }))

    // O arquivo continua no acervo: o cartão só o linka, e quem autoriza é o endpoint de lá.
    await waitFor(() => expect(baixou).toBe(true))
  })

  it('turma sem item nenhum explica a tela em vez de mostrar uma grade vazia', async () => {
    entrarComo('Formando')
    comApi([])

    renderizar(<FestaPage />)

    expect(await screen.findByText(/ainda não descreveu o que a turma está comprando/)).toBeInTheDocument()
  })
})
