import { describe, expect, it } from 'vitest'
import type { Opcional } from '../types/cobrancas.types'
import { gradeDoPedido } from './gradeDoPedido'

/**
 * A conta que o diálogo mostra antes de confirmar, com os números do critério de aceite da Sprint
 * 20 — é o que mantém a única conta repetida entre front e back honesta.
 */
const convite = (mudancas: Partial<Opcional> = {}): Opcional => ({
  id: 'i-1',
  tipo: 'ConviteExtra',
  descricao: 'Convite extra',
  valor_em_centavos: 18_000,
  numero_de_parcelas: 2,
  dia_de_vencimento: 10,
  primeiro_mes: '2026-09-01',
  limite_por_formando: null,
  pedidos_ate_dia: null,
  estoque: null,
  reservados: 0,
  disponivel: null,
  abertura_de_vendas: null,
  item_da_festa_id: null,
  aberto_a_pedido: true,
  ...mudancas,
})

describe('gradeDoPedido', () => {
  /** O critério da sprint: R$ 180 em 2×, quantidade 3, são duas parcelas de R$ 270. */
  it('multiplica o preço unitário pela quantidade e divide na grade', () => {
    const grade = gradeDoPedido(convite(), 3, 2, new Date(2026, 8, 5))

    expect(grade).toHaveLength(2)
    expect(grade.map((parcela) => parcela.valor_em_centavos)).toEqual([27_000, 27_000])
  })

  /** À vista é uma parcela só, com o total — o teto do item não obriga a parcelar. */
  it('à vista gera uma parcela com o total', () => {
    const grade = gradeDoPedido(convite(), 3, 1, new Date(2026, 8, 5))

    expect(grade.map((parcela) => parcela.valor_em_centavos)).toEqual([54_000])
  })

  /** Divisão inteira em centavos, com o resto na primeira — como em todo o resto do sistema. */
  it('deixa o centavo que sobra na primeira parcela', () => {
    const grade = gradeDoPedido(convite({ valor_em_centavos: 10_001, numero_de_parcelas: 3 }), 1, 3)

    expect(grade.map((parcela) => parcela.valor_em_centavos)).toEqual([3_335, 3_333, 3_333])
    expect(grade.reduce((soma, parcela) => soma + parcela.valor_em_centavos, 0)).toBe(10_001)
  })

  /** Parcela de pedido nunca nasce vencida: dia 10 já passou, então a grade começa no mês seguinte. */
  it('começa no próximo vencimento quando o dia do mês já passou', () => {
    const grade = gradeDoPedido(convite(), 1, 2, new Date(2026, 8, 15))

    expect(grade[0]?.vencimento).toEqual(new Date(2026, 9, 10))
    expect(grade[1]?.vencimento).toEqual(new Date(2026, 10, 10))
  })

  it('começa neste mês quando o dia do vencimento ainda vai acontecer', () => {
    const grade = gradeDoPedido(convite(), 1, 2, new Date(2026, 8, 5))

    expect(grade[0]?.vencimento).toEqual(new Date(2026, 8, 10))
  })

  /** O item pode ter um mês de início no futuro — e aí ele manda. */
  it('respeita o primeiro mês do item quando ele é mais para a frente', () => {
    const grade = gradeDoPedido(convite({ primeiro_mes: '2027-03-01' }), 1, 2, new Date(2026, 8, 5))

    expect(grade[0]?.vencimento).toEqual(new Date(2027, 2, 10))
  })

  /** Dia 31 em abril vira 30 — a mesma regra do vencimento do plano. */
  it('encurta o dia nos meses mais curtos', () => {
    const grade = gradeDoPedido(
      convite({ dia_de_vencimento: 31, numero_de_parcelas: 2, primeiro_mes: '2027-03-01' }),
      1,
      2,
      new Date(2026, 8, 5),
    )

    expect(grade.map((parcela) => parcela.vencimento)).toEqual([new Date(2027, 2, 31), new Date(2027, 3, 30)])
  })
})
