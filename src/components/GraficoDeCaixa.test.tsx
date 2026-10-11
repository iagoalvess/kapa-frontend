import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTelaGrande } from '@/hooks/useTelaGrande'
import { GraficoDeCaixa, type MesDoGrafico } from './GraficoDeCaixa'

vi.mock('@/hooks/useTelaGrande', () => ({ useTelaGrande: vi.fn<typeof useTelaGrande>() }))

/** Confere a curva desenhada, amostrando cada Bézier entre os dois valores mensais. */
function conferirTrechos(caminho: string) {
  const numeros = (caminho.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) ?? []).map(Number)
  let yInicial = numeros[1]!
  for (let indice = 2; indice < numeros.length; indice += 6) {
    const yControle1 = numeros[indice + 1]!
    const yControle2 = numeros[indice + 3]!
    const yFinal = numeros[indice + 5]!
    let anterior = yInicial
    for (let amostra = 1; amostra <= 100; amostra++) {
      const t = amostra / 100
      const y =
        (1 - t) ** 3 * yInicial +
        3 * (1 - t) ** 2 * t * yControle1 +
        3 * (1 - t) * t ** 2 * yControle2 +
        t ** 3 * yFinal
      expect(y).toBeGreaterThanOrEqual(Math.min(yInicial, yFinal) - 1e-8)
      expect(y).toBeLessThanOrEqual(Math.max(yInicial, yFinal) + 1e-8)
      // Dentro de um trecho, subir ou descer não pode inventar uma inversão.
      expect((y - anterior) * Math.sign(yFinal - yInicial)).toBeGreaterThanOrEqual(-1e-8)
      anterior = y
    }
    yInicial = yFinal
  }
}

describe('GraficoDeCaixa', () => {
  it.each([
    { nome: 'meses zerados antes de uma entrada', valores: [0, 0, 0, 805_000] },
    { nome: 'picos e quedas', valores: [0, 900_000, 0, 500_000, 0, 0] },
    { nome: 'crescimentos de tamanhos diferentes', valores: [0, 100, 101, 900_000, 900_001] },
  ])('não inventa valores entre meses: $nome', ({ valores }) => {
    for (const telaGrande of [true, false]) {
      vi.mocked(useTelaGrande).mockReturnValue(telaGrande)
      const meses: MesDoGrafico[] = valores.map((valor, indice) => ({
        mes: `2026-${String(indice + 1).padStart(2, '0')}-01`,
        projetado: false,
        entradas_em_centavos: valor,
        entradas_previstas_em_centavos: 0,
        saidas_em_centavos: valores[valores.length - 1 - indice]!,
        saidas_previstas_em_centavos: 0,
        saldo_acumulado_em_centavos: 0,
      }))
      // A mesma geometria serve ao relatório e ao caixa com meses projetados.
      for (const comProjecao of [false, true]) {
        const { container, unmount } = render(
          <GraficoDeCaixa
            meses={meses.map((mes, indice) => ({ ...mes, projetado: comProjecao && indice >= 2 }))}
          />,
        )
        const linhas = container.querySelectorAll('path[stroke]')
        expect(linhas).toHaveLength(4)
        for (const linha of linhas) {
          conferirTrechos(linha.getAttribute('d')!)
        }
        unmount()
      }
    }
  })
})
