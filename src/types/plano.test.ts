import { describe, expect, it } from 'vitest'
import { descontoDoPlano, type Plano } from './plano'

const BASE: Plano = {
  id: 'p-1',
  codigo: 'premium',
  nome: 'Premium',
  descricao: 'O dia a dia da comissão inteiro.',
  preco_em_centavos: 4990,
  ciclo: 'Mensal',
  limite_de_formandos: 400,
  modulos: [],
  recomendado: false,
}

describe('descontoDoPlano', () => {
  it('calcula a porcentagem entre o preço cheio e o cobrado', () => {
    // 59880 → 47900 é 20% de desconto.
    expect(descontoDoPlano({ ...BASE, preco_em_centavos: 47900, preco_cheio_em_centavos: 59880 })).toBe(20)
  })

  it('devolve nulo sem preço cheio', () => {
    expect(descontoDoPlano(BASE)).toBeNull()
  })

  /** Preço cheio igual ou menor que o cobrado não é desconto — é erro de cadastro. */
  it('devolve nulo quando o preço cheio não é maior que o cobrado', () => {
    expect(descontoDoPlano({ ...BASE, preco_cheio_em_centavos: 4990 })).toBeNull()
    expect(descontoDoPlano({ ...BASE, preco_cheio_em_centavos: 2990 })).toBeNull()
  })
})
