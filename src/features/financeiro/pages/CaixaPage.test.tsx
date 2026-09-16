import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, reais, renderizar } from '@/test/utils'
import type { Caixa, ProjecaoDoCaixa } from '../types/financeiro.types'
import { CaixaPage } from './CaixaPage'

/** Como a tela lê: o Testing Library normaliza o espaço fixo que o `Intl` põe depois do R$. */

const CAIXA = `${env.VITE_API_URL}/api/v1/financeiro/caixa`

const CONSOLIDADO: Caixa = {
  arrecadado_em_centavos: 18_450_000,
  gasto_em_centavos: 9_620_000,
  saldo_em_centavos: 8_830_000,
  a_receber_em_centavos: 21_200_000,
  em_atraso_em_centavos: 1_250_000,
  saldo_projetado_em_centavos: 25_030_000,
  por_categoria: [
    { categoria: 'Buffet', quantidade: 3, pago_em_centavos: 9_620_000, previsto_em_centavos: 5_000_000 },
  ],
  ultimos: [
    { data: '2026-09-10', descricao: 'Ana Souza', valor_em_centavos: 35_000, entrada: true },
    { data: '2026-09-08', descricao: 'Entrada do buffet', valor_em_centavos: 9_620_000, entrada: false },
  ],
}

const PROJECAO: ProjecaoDoCaixa = {
  saldo_em_centavos: 8_830_000,
  em_atraso_em_centavos: 1_250_000,
  meses: [
    {
      mes: '2026-09-01',
      entradas_em_centavos: 18_450_000,
      saidas_em_centavos: 9_620_000,
      entradas_previstas_em_centavos: 0,
      saidas_previstas_em_centavos: 0,
      saldo_acumulado_em_centavos: 8_830_000,
      projetado: false,
    },
    {
      mes: '2026-10-01',
      entradas_em_centavos: 0,
      saidas_em_centavos: 0,
      entradas_previstas_em_centavos: 2_100_000,
      saidas_previstas_em_centavos: 5_000_000,
      saldo_acumulado_em_centavos: 5_930_000,
      projetado: true,
    },
  ],
}

function comApi(consolidado: Caixa = CONSOLIDADO) {
  servidor.use(
    http.get(CAIXA, () => HttpResponse.json(consolidado)),
    http.get(`${CAIXA}/projecao`, () => HttpResponse.json(PROJECAO)),
  )
}

describe('CaixaPage', () => {
  afterEach(() => sessao.encerrar())

  it('mostra arrecadado, gasto e saldo — e o atraso à parte do que ainda vai entrar', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<CaixaPage />)

    const faixa = await screen.findByRole('region', { name: 'Resumo do caixa' })
    expect(await within(faixa).findByText(reais(18_450_000))).toBeInTheDocument()
    expect(within(faixa).getByText(reais(9_620_000))).toBeInTheDocument()
    expect(within(faixa).getByText(reais(8_830_000))).toBeInTheDocument()
    // O vencido não entra no "a receber": aparece como sinal ao lado dele.
    expect(within(faixa).getByText(`${reais(1_250_000)} em atraso`)).toBeInTheDocument()
  })

  it('saldo negativo é sinalizado, e não só pela cor', async () => {
    entrarComo('Tesoureiro')
    comApi({ ...CONSOLIDADO, gasto_em_centavos: 20_000_000, saldo_em_centavos: -1_550_000 })

    renderizar(<CaixaPage />)

    const faixa = await screen.findByRole('region', { name: 'Resumo do caixa' })
    expect(await within(faixa).findByText('negativo')).toBeInTheDocument()
    expect(within(faixa).getByText(reais(-1_550_000))).toBeInTheDocument()
  })

  /**
   * O gráfico é desenho: os números dele vivem numa tabela fora da tela, que é o que o leitor de
   * tela lê. Sem ela, a projeção existiria só como linha tracejada — invisível para quem não vê.
   */
  it('a projeção é rotulada como projeção, e os números dela ficam na tabela do gráfico', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<CaixaPage />)

    expect(await screen.findByText('Projeção')).toBeInTheDocument()

    const tabela = screen.getByRole('table', {
      name: 'Entradas, saídas e saldo acumulado do caixa, mês a mês',
    })
    expect(within(tabela).getByText(/out. de 2026/)).toBeInTheDocument()
    expect(within(tabela).getByText(/projeção/)).toBeInTheDocument()
    expect(within(tabela).getByText(reais(5_930_000))).toBeInTheDocument()
  })

  it('o extrato separa entrada de saída com sinal, não só com cor', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<CaixaPage />)

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText(`+ ${reais(35_000)}`)).toBeInTheDocument()
    expect(screen.getByText(`− ${reais(9_620_000)}`)).toBeInTheDocument()
  })

  it('turma sem despesa explica o quadro de categorias vazio', async () => {
    entrarComo('Comissao')
    comApi({ ...CONSOLIDADO, por_categoria: [] })

    renderizar(<CaixaPage />)

    expect(await screen.findByText(/Nenhuma despesa lançada ainda/)).toBeInTheDocument()
  })
})
