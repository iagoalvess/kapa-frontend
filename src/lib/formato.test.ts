import { describe, expect, it } from 'vitest'
import {
  formatarCentavos,
  formatarCep,
  formatarCpf,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarNumero,
  formatarTelefone,
} from './formato'

describe('formato', () => {
  it('trata string sem fuso como UTC', () => {
    // O backend grava em UTC. Lida como hora local, esta data viraria 31/12 no Brasil.
    expect(formatarData('2027-01-01T02:00:00')).toBe(formatarData('2027-01-01T02:00:00Z'))
  })

  it('mostra data pura (DateOnly) no mesmo dia, em qualquer fuso', () => {
    expect(formatarData('2027-12-15')).toBe('15/12/2027')
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

  it('formata centavos sem perder o centavo', () => {
    expect(formatarCentavos(34990)).toMatch(/^R\$\s?349,90$/)
    expect(formatarCentavos(1)).toMatch(/^R\$\s?0,01$/)
    expect(formatarCentavos(undefined)).toBe('—')
  })

  it('mascara CPF, CEP e telefone brasileiro, e deixa o resto como veio', () => {
    expect(formatarCpf('52998224725')).toBe('529.982.247-25')
    expect(formatarCep('80000000')).toBe('80000-000')
    expect(formatarTelefone('+5541998765432')).toBe('(41) 99876-5432')
    expect(formatarTelefone('+554133334444')).toBe('(41) 3333-4444')
    // A API grava E.164: telefone de fora do Brasil não tem máscara nacional.
    expect(formatarTelefone('+14155550100')).toBe('+14155550100')
    expect(formatarCpf(undefined)).toBe('')
  })
})
