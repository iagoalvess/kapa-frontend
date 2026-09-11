import { describe, expect, it } from 'vitest'
import { formatarData, formatarDataHora, formatarMoeda, formatarNumero } from './formato'

describe('formato', () => {
  it('trata string sem fuso como UTC', () => {
    // O backend grava em UTC. Lida como hora local, esta data viraria 31/12 no Brasil.
    expect(formatarData('2027-01-01T02:00:00')).toBe(formatarData('2027-01-01T02:00:00Z'))
  })

  it('respeita o fuso quando ele vem na string', () => {
    expect(formatarDataHora('2027-01-01T00:00:00Z')).not.toBe(formatarDataHora('2027-01-01T00:00:00-03:00'))
  })

  it('devolve travessão para ausente ou ilegível', () => {
    expect(formatarData(null)).toBe('—')
    expect(formatarData('')).toBe('—')
    expect(formatarData('nao-e-data')).toBe('—')
    expect(formatarMoeda(undefined)).toBe('—')
    expect(formatarNumero(null)).toBe('—')
  })

  it('formata moeda e número no padrão brasileiro', () => {
    expect(formatarMoeda(1234.5)).toMatch(/^R\$\s?1\.234,50$/)
    expect(formatarNumero(1234567)).toBe('1.234.567')
    expect(formatarNumero(1.005, 2)).toBe('1,01')
  })
})
