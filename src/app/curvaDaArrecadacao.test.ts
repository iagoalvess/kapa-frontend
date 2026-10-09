import { describe, expect, it } from 'vitest'
import { curvaDaArrecadacao } from './curvaDaArrecadacao'

describe('curvaDaArrecadacao', () => {
  it.each([
    [
      { x: 0, y: 100 },
      { x: 10, y: 20 },
      { x: 20, y: 20 },
      { x: 30, y: 0 },
    ],
    [
      { x: 0, y: 0 },
      { x: 10, y: 1 },
      { x: 20, y: 100 },
      { x: 30, y: 101 },
    ],
    [
      { x: 0, y: 0 },
      { x: 10, y: 100 },
      { x: 20, y: 0 },
      { x: 30, y: 100 },
    ],
    [
      { x: 0, y: 80 },
      { x: 3, y: 60 },
      { x: 20, y: 10 },
      { x: 100, y: 0 },
    ],
  ])('preserva cada valor e não inventa extremos entre os meses: %j', (...pontos) => {
    const segmentos = curvaDaArrecadacao(pontos).split(' C').slice(1)
    expect(segmentos).toHaveLength(pontos.length - 1)

    segmentos.forEach((segmento, indice) => {
      const valores = segmento.split(/[ ,]/).map(Number)
      const [x1, y1, x2, y2, xFim, yFim] = valores as [number, number, number, number, number, number]
      const inicio = pontos[indice]!
      const fim = pontos[indice + 1]!
      expect(xFim).toBeCloseTo(fim.x, 3)
      expect(yFim).toBeCloseTo(fim.y, 3)
      expect(x1).toBeGreaterThan(inicio.x)
      expect(x2).toBeLessThan(fim.x)

      let anterior = inicio.y
      const direcao = Math.sign(fim.y - inicio.y)
      for (let passo = 1; passo <= 100; passo += 1) {
        const t = passo / 100
        const y =
          (1 - t) ** 3 * inicio.y + 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3 * yFim
        expect(y).toBeGreaterThanOrEqual(Math.min(inicio.y, fim.y) - 0.001)
        expect(y).toBeLessThanOrEqual(Math.max(inicio.y, fim.y) + 0.001)
        expect((y - anterior) * direcao).toBeGreaterThanOrEqual(-0.001)
        anterior = y
      }
    })
  })

  it('não cria um intervalo de arrecadação sem meses suficientes', () => {
    expect(curvaDaArrecadacao([])).toBe('')
    expect(curvaDaArrecadacao([{ x: 10, y: 20 }])).not.toContain('C')
  })
})
