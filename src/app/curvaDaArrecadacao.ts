interface Ponto {
  x: number
  y: number
}

const par = (x: number, y: number) => `${x.toFixed(3)},${y.toFixed(3)}`

/**
 * Liga os meses por curvas cúbicas, passando por cada valor. As tangentes são limitadas para a
 * suavização não criar picos, quedas ou arrecadação fictícia entre os pontos. Os x vêm em ordem crescente.
 */
export function curvaDaArrecadacao(pontos: readonly Ponto[]) {
  if (pontos.length === 0) return ''
  const primeiro = pontos[0]!
  const inicio = `M${par(primeiro.x, primeiro.y)}`
  if (pontos.length === 1) return inicio

  const inclinacoes = pontos.slice(1).map((ponto, indice) => {
    const anterior = pontos[indice]!
    return (ponto.y - anterior.y) / (ponto.x - anterior.x)
  })
  const tangentes = pontos.map((_, indice) => {
    if (indice === 0) return inclinacoes[0]!
    if (indice === pontos.length - 1) return inclinacoes[indice - 1]!
    const antes = inclinacoes[indice - 1]!
    const depois = inclinacoes[indice]!
    return antes * depois <= 0 ? 0 : (antes + depois) / 2
  })

  inclinacoes.forEach((inclinacao, indice) => {
    if (inclinacao === 0) {
      tangentes[indice] = 0
      tangentes[indice + 1] = 0
      return
    }
    const antes = tangentes[indice]! / inclinacao
    const depois = tangentes[indice + 1]! / inclinacao
    const comprimento = Math.hypot(antes, depois)
    if (comprimento > 3) {
      const limite = 3 / comprimento
      tangentes[indice] = limite * antes * inclinacao
      tangentes[indice + 1] = limite * depois * inclinacao
    }
  })

  return (
    inicio +
    pontos
      .slice(1)
      .map((ponto, indice) => {
        const anterior = pontos[indice]!
        const terco = (ponto.x - anterior.x) / 3
        return ` C${par(anterior.x + terco, anterior.y + terco * tangentes[indice]!)} ${par(ponto.x - terco, ponto.y - terco * tangentes[indice + 1]!)} ${par(ponto.x, ponto.y)}`
      })
      .join('')
  )
}
