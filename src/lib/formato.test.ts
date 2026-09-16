import { describe, expect, it } from 'vitest'
import {
  diaDeHoje,
  diasAte,
  formatarCentavos,
  formatarCep,
  formatarCnpj,
  formatarCpf,
  formatarData,
  formatarDataCompacta,
  formatarDataHora,
  formatarDataRelativa,
  formatarDiaMes,
  formatarMesAno,
  formatarMoeda,
  formatarNumero,
  formatarTamanho,
  formatarTelefone,
} from './formato'

describe('formato', () => {
  it('trata string sem fuso como UTC', () => {
    // O backend grava em UTC. Lida como hora local, esta data viraria 31/12 no Brasil.
    expect(formatarData('2027-01-01T02:00:00')).toBe(formatarData('2027-01-01T02:00:00Z'))
  })

  /** Dias do calendário: de 23h de hoje até amanhã é 1, não 0. */
  it('conta os dias até a data pela meia-noite, e nulo sem data', () => {
    const hoje = new Date(2027, 6, 10, 23, 30)

    expect(diasAte('2027-07-11', hoje)).toBe(1)
    expect(diasAte('2027-07-10', hoje)).toBe(0)
    expect(diasAte('2027-07-01', hoje)).toBe(-9)
    expect(diasAte('2028-07-10', hoje)).toBe(366)
    expect(diasAte(undefined, hoje)).toBeNull()
  })

  /** Às 23h30 locais, UTC já é amanhã: o dia do campo de data tem que ser o daqui. */
  it('dá o dia de hoje no calendário local, para o campo de data', () => {
    expect(diaDeHoje(new Date(2027, 6, 10, 23, 30))).toBe('2027-07-10')
    expect(diaDeHoje(new Date(2027, 0, 5))).toBe('2027-01-05')
  })

  it('mostra data pura (DateOnly) no mesmo dia, em qualquer fuso', () => {
    expect(formatarData('2027-12-15')).toBe('15/12/2027')
    expect(formatarDataCompacta('2027-03-01')).toBe('20270301')
    // Dia 1 lido como meia-noite UTC seria o mês anterior no Brasil.
    expect(formatarMesAno('2027-03-01')).toBe('mar. de 2027')
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

  it('mascara CPF, CNPJ, CEP e telefone brasileiro, e deixa o resto como veio', () => {
    expect(formatarCpf('52998224725')).toBe('529.982.247-25')
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatarCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35')
    expect(formatarCnpj('123')).toBe('123')
    expect(formatarCep('80000000')).toBe('80000-000')
    expect(formatarTelefone('+5541998765432')).toBe('(41) 99876-5432')
    expect(formatarTelefone('+554133334444')).toBe('(41) 3333-4444')
    // A API grava E.164: telefone de fora do Brasil não tem máscara nacional.
    expect(formatarTelefone('+14155550100')).toBe('+14155550100')
    expect(formatarCpf(undefined)).toBe('')
  })

  it('diz quanto tempo faz como se fala', () => {
    const agora = new Date(2026, 8, 15, 10, 0)

    expect(formatarDataRelativa(new Date(2026, 8, 15, 9, 59, 40), agora)).toBe('agora')
    expect(formatarDataRelativa(new Date(2026, 8, 15, 9, 55), agora)).toBe('há 5 minutos')
    expect(formatarDataRelativa(new Date(2026, 8, 15, 7, 0), agora)).toBe('há 3 horas')
    expect(formatarDataRelativa(new Date(2026, 8, 14, 8, 0), agora)).toBe('ontem')
    expect(formatarDataRelativa(new Date(2026, 8, 13, 23, 0), agora)).toBe('anteontem')
    expect(formatarDataRelativa(new Date(2026, 8, 12, 9, 0), agora)).toBe('há 3 dias')
    expect(formatarDataRelativa(new Date(2026, 5, 10), agora)).toBe('há 3 meses')
    expect(formatarDataRelativa(undefined, agora)).toBe('—')
  })

  it('dia e mês curtos, sem ano', () => {
    expect(formatarDiaMes('2026-09-15')).toBe('15/09')
    expect(formatarDiaMes(undefined)).toBe('—')
  })

  it('escreve o tamanho do arquivo na unidade que se lê', () => {
    expect(formatarTamanho(850)).toBe('850 bytes')
    expect(formatarTamanho(320 * 1024)).toBe('320 KB')
    expect(formatarTamanho(1.25 * 1024 * 1024)).toMatch(/^1,[23] MB$/)
    expect(formatarTamanho(undefined)).toBe('—')
  })
})
