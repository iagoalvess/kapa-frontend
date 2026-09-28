import { describe, expect, it } from 'vitest'
import { cadeirasDaMesa, centroDaMesa, encaixarElemento, tampoDaMesa } from './salao'

const SALAO = { largura: 1000, altura: 800 }

describe('mapa do salão', () => {
  it('mesa redonda cresce com os lugares e tem uma cadeira por lugar', () => {
    expect(tampoDaMesa({ lugares: 10, formato: 'Redonda', girada: false })).toEqual({
      largura: 191,
      altura: 191,
    })
    expect(tampoDaMesa({ lugares: 2, formato: 'Redonda', girada: false }).largura).toBe(100)
    expect(cadeirasDaMesa({ lugares: 10, formato: 'Redonda', girada: false })).toHaveLength(10)
  })

  it('retangular girada troca os lados e põe a sobra do ímpar no primeiro lado', () => {
    const deitada = { lugares: 7, formato: 'Retangular', girada: false } as const
    expect(tampoDaMesa(deitada)).toEqual({ largura: 240, altura: 90 })
    expect(tampoDaMesa({ ...deitada, girada: true })).toEqual({ largura: 90, altura: 240 })

    const cadeiras = cadeirasDaMesa(deitada)
    expect(cadeiras.filter((cadeira) => cadeira.y < 0)).toHaveLength(4)
    expect(cadeiras.filter((cadeira) => cadeira.y > 0)).toHaveLength(3)
  })

  it('a mesa encaixa na grade e o tampo não atravessa a parede', () => {
    const mesa = { lugares: 10, formato: 'Redonda', girada: false } as const
    expect(centroDaMesa(mesa, { x: 509, y: 311 }, SALAO)).toEqual({ x: 500, y: 320 })
    expect(centroDaMesa(mesa, { x: -50, y: 5000 }, SALAO)).toEqual({ x: 96, y: 704 })
  })

  it('o elemento maior que o salão encolhe até caber', () => {
    const pista = {
      tipo: 'Pista',
      rotulo: 'Pista',
      x: 900,
      y: 700,
      largura: 1500,
      altura: 300,
      cor: null,
    } as const
    expect(encaixarElemento(pista, SALAO)).toMatchObject({ x: 0, y: 500, largura: 1000, altura: 300 })
  })
})
