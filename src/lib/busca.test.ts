import { describe, expect, it } from 'vitest'
import { contemBusca, normalizarBusca } from './busca'

describe('busca', () => {
  it('compara sem acento, sem caixa e sem espaço nas pontas', () => {
    expect(normalizarBusca('  Colação de Grau ')).toBe('colacao de grau')
  })

  it('acha em qualquer campo, e busca vazia deixa tudo passar', () => {
    expect(contemBusca('ateliê', 'Reunião', null, 'No Ateliê')).toBe(true)
    expect(contemBusca('buffet', 'Reunião', undefined)).toBe(false)
    expect(contemBusca('  ', 'Reunião')).toBe(true)
  })
})
