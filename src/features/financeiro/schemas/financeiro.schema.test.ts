import { describe, expect, it } from 'vitest'
import type { ItemDaFesta, Proposta } from '@/types/festa'
import { despesaParaContratar } from './financeiro.schema'

const item = {
  id: 'i-1',
  titulo: 'Buffet',
  categoria: 'Buffet',
  custo_previsto_em_centavos: 60_000_00,
} as ItemDaFesta
const proposta = { id: 'p-1', titulo: 'Buffet Sabor', valor_em_centavos: 55_000_00 } as Proposta

describe('despesaParaContratar', () => {
  it('sem proposta, usa o previsto do item', () => {
    expect(despesaParaContratar(item)).toMatchObject({ descricao: 'Buffet', valor_em_centavos: 60_000_00 })
  })

  it('com proposta, o título e o preço são os dela', () => {
    expect(despesaParaContratar(item, proposta)).toMatchObject({
      descricao: 'Buffet · Buffet Sabor',
      valor_em_centavos: 55_000_00,
      item_da_festa_id: 'i-1',
    })
  })

  it('proposta sem preço cai no previsto do item', () => {
    expect(despesaParaContratar(item, { ...proposta, valor_em_centavos: 0 }).valor_em_centavos).toBe(
      60_000_00,
    )
  })
})
