import { describe, expect, it } from 'vitest'
import type { ItemDaLoja } from '../types/loja.types'
import { aVenda, estaAberto } from './disponibilidade'

const AGORA = Date.parse('2027-12-01T12:00:00Z')

const item = (dados: Partial<ItemDaLoja> = {}): ItemDaLoja => ({
  id: 'i-1',
  descricao: 'Convite',
  preco_em_centavos: 10_000,
  disponivel: 5,
  limite_por_pessoa: null,
  abertura_de_vendas: null,
  vendas_ate: null,
  aberto: true,
  ...dados,
})

describe('estaAberto', () => {
  it('segue o aberto do servidor', () => {
    expect(estaAberto(item(), AGORA)).toBe(true)
    expect(estaAberto(item({ aberto: false, abertura_de_vendas: null }), AGORA)).toBe(false)
  })

  it('libera na hora marcada mesmo com o servidor dizendo que ainda não abriu', () => {
    expect(estaAberto(item({ aberto: false, abertura_de_vendas: '2027-12-01T11:59:00Z' }), AGORA)).toBe(true)
    expect(estaAberto(item({ aberto: false, abertura_de_vendas: '2027-12-01T12:01:00Z' }), AGORA)).toBe(false)
  })
})

describe('aVenda', () => {
  it('exige aberto e com lugar', () => {
    expect(aVenda(item(), AGORA)).toBe(true)
    expect(aVenda(item({ disponivel: 0 }), AGORA)).toBe(false)
    expect(aVenda(item({ aberto: false, abertura_de_vendas: '2027-12-01T13:00:00Z' }), AGORA)).toBe(false)
  })

  it('item sem teto de estoque continua à venda', () => {
    expect(aVenda(item({ disponivel: null }), AGORA)).toBe(true)
  })
})
