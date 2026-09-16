import { describe, expect, it } from 'vitest'
import { faixasDePublicacao, faixasDeVencimento } from './FiltroDePeriodo'

describe('faixasDeVencimento', () => {
  it('fecha a semana de segunda a domingo, inclusive quando hoje é domingo', () => {
    // 2027-07-10 é um sábado; 11, domingo.
    expect(faixasDeVencimento(new Date(2027, 6, 10))['Esta semana']).toEqual(['2027-07-05', '2027-07-11'])
    expect(faixasDeVencimento(new Date(2027, 6, 11))['Esta semana']).toEqual(['2027-07-05', '2027-07-11'])
  })

  it('fecha o mês no último dia, mesmo nos meses curtos', () => {
    expect(faixasDeVencimento(new Date(2028, 1, 10))['Este mês']).toEqual(['2028-02-01', '2028-02-29'])
    expect(faixasDeVencimento(new Date(2027, 3, 10))['Este mês']).toEqual(['2027-04-01', '2027-04-30'])
  })

  it('vira o ano em dezembro sem estourar para o mês 13', () => {
    const faixas = faixasDeVencimento(new Date(2027, 11, 20))
    expect(faixas['Este mês']).toEqual(['2027-12-01', '2027-12-31'])
    expect(faixas['Próximos 30 dias']).toEqual(['2027-12-20', '2028-01-19'])
  })

  it('conta os 30 dias a partir de hoje, e o ano de ponta a ponta', () => {
    const faixas = faixasDeVencimento(new Date(2027, 6, 10, 23, 30))
    expect(faixas['Próximos 30 dias']).toEqual(['2027-07-10', '2027-08-09'])
    expect(faixas['Este ano']).toEqual(['2027-01-01', '2027-12-31'])
  })
})

describe('faixasDePublicacao', () => {
  it('olha para trás: os 30 dias terminam hoje, e viram o ano sem estourar o mês', () => {
    expect(faixasDePublicacao(new Date(2027, 6, 10))['Últimos 30 dias']).toEqual(['2027-06-10', '2027-07-10'])
    expect(faixasDePublicacao(new Date(2028, 0, 10))['Últimos 30 dias']).toEqual(['2027-12-11', '2028-01-10'])
  })

  it('reaproveita semana, mês e ano do vencimento', () => {
    const hoje = new Date(2027, 6, 10)
    const publicacao = faixasDePublicacao(hoje)
    const vencimento = faixasDeVencimento(hoje)

    expect(publicacao['Esta semana']).toEqual(vencimento['Esta semana'])
    expect(publicacao['Este mês']).toEqual(vencimento['Este mês'])
    expect(publicacao['Este ano']).toEqual(vencimento['Este ano'])
  })
})
