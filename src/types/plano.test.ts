import { describe, expect, it } from 'vitest'
import { descontoDoPlano, type Plano } from './plano'

const BASE: Plano = {
  id: 'p-1',
  codigo: 'completo',
  nome: 'Completo',
  descricao: 'O dia a dia da comissão inteiro.',
  preco_em_centavos: 34990,
  ciclo: 'Mensal',
  limite_de_formandos: 150,
  modulos: [],
  recomendado: false,
}

describe('descontoDoPlano', () => {
  it('calcula a porcentagem entre o preço cheio e o cobrado', () => {
    // 419880 → 356900 é 15% de desconto.
    expect(descontoDoPlano({ ...BASE, preco_em_centavos: 356900, preco_cheio_em_centavos: 419880 })).toBe(15)
  })

  it('devolve nulo sem preço cheio', () => {
    expect(descontoDoPlano(BASE)).toBeNull()
  })

  /** Preço cheio igual ou menor que o cobrado não é desconto — é erro de cadastro. */
  it('devolve nulo quando o preço cheio não é maior que o cobrado', () => {
    expect(descontoDoPlano({ ...BASE, preco_cheio_em_centavos: 34990 })).toBeNull()
    expect(descontoDoPlano({ ...BASE, preco_cheio_em_centavos: 29990 })).toBeNull()
  })
})
