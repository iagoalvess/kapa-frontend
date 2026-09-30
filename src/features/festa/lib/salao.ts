import type { ElementoDoSalao, FormatoDaMesa, PlantaDoSalao } from '../types/mesas.types'

/**
 * A geometria do mapa do salão: tudo em centímetros, a mesma unidade que a API grava.
 *
 * O tamanho da mesa não é guardado em lugar nenhum — sai dos lugares e do formato —, então a mesa de
 * 10 e a de 12 têm tamanhos diferentes no mapa sem a comissão desenhar nada.
 */

/** O passo da grade: arrastar encaixa de 20 em 20 cm. */
export const GRADE = 20

/** O lado de um quadrado da grade desenhada: 1 metro. */
export const METRO = 100

/** Diâmetro da cadeira desenhada. */
export const CADEIRA = 44

/** Espaço de mesa por pessoa, na borda — o de buffet. */
const POR_LUGAR = 60

/** Largura da mesa retangular, de uma fila de cadeiras à outra. */
const LARGURA_DA_RETANGULAR = 90

/** O que basta de uma mesa para desenhá-la. */
export interface MesaDesenhavel {
  lugares: number
  formato: FormatoDaMesa
  girada: boolean
}

export interface Ponto {
  x: number
  y: number
}

export interface Tamanho {
  largura: number
  altura: number
}

/** O tampo da mesa, já girado: a redonda cresce com o perímetro, a retangular com o comprimento. */
export function tampoDaMesa(mesa: MesaDesenhavel): Tamanho {
  if (mesa.formato === 'Redonda') {
    const diametro = Math.max(100, Math.round((mesa.lugares * POR_LUGAR) / Math.PI))
    return { largura: diametro, altura: diametro }
  }

  const comprimento = Math.max(120, Math.ceil(mesa.lugares / 2) * POR_LUGAR)
  return mesa.girada
    ? { largura: LARGURA_DA_RETANGULAR, altura: comprimento }
    : { largura: comprimento, altura: LARGURA_DA_RETANGULAR }
}

/**
 * O centro de cada cadeira, a partir do centro da mesa: em volta da redonda, começando no alto; nos
 * dois lados compridos da retangular, com a sobra do número ímpar no primeiro lado.
 */
export function cadeirasDaMesa(mesa: MesaDesenhavel): Ponto[] {
  const tampo = tampoDaMesa(mesa)
  const folga = CADEIRA / 2 + 6

  if (mesa.formato === 'Redonda') {
    const raio = tampo.largura / 2 + folga
    return Array.from({ length: mesa.lugares }, (_, i) => {
      const angulo = (2 * Math.PI * i) / mesa.lugares - Math.PI / 2
      return { x: raio * Math.cos(angulo), y: raio * Math.sin(angulo) }
    })
  }

  const comprimento = mesa.girada ? tampo.altura : tampo.largura
  const afastamento = (mesa.girada ? tampo.largura : tampo.altura) / 2 + folga
  const fila = (quantas: number, lado: -1 | 1) =>
    Array.from({ length: quantas }, (_, i) => {
      const ao = -comprimento / 2 + (comprimento * (i + 0.5)) / quantas
      return mesa.girada ? { x: lado * afastamento, y: ao } : { x: ao, y: lado * afastamento }
    })

  const primeiroLado = Math.ceil(mesa.lugares / 2)
  return [...fila(primeiroLado, -1), ...fila(mesa.lugares - primeiroLado, 1)]
}

/** O valor no passo da grade mais próximo. */
const encaixar = (valor: number) => Math.round(valor / GRADE) * GRADE

/** O valor dentro da faixa; faixa invertida (coisa maior que o salão) fica no mínimo. */
export const limitar = (valor: number, minimo: number, maximo: number) =>
  Math.max(minimo, Math.min(valor, maximo))

/** O centro da mesa na grade e com o tampo inteiro dentro do salão. */
export function centroDaMesa(mesa: MesaDesenhavel, ponto: Ponto, salao: Tamanho): Ponto {
  const tampo = tampoDaMesa(mesa)
  const meiaLargura = Math.ceil(tampo.largura / 2)
  const meiaAltura = Math.ceil(tampo.altura / 2)

  return {
    x: limitar(encaixar(ponto.x), meiaLargura, salao.largura - meiaLargura),
    y: limitar(encaixar(ponto.y), meiaAltura, salao.altura - meiaAltura),
  }
}

/** O elemento com o canto na grade e o corpo inteiro dentro do salão — encolhe se não couber. */
export function encaixarElemento(elemento: ElementoDoSalao, salao: Tamanho): ElementoDoSalao {
  const largura = limitar(encaixar(elemento.largura), GRADE * 2, salao.largura)
  const altura = limitar(encaixar(elemento.altura), GRADE * 2, salao.altura)

  return {
    ...elemento,
    largura,
    altura,
    x: limitar(encaixar(elemento.x), 0, salao.largura - largura),
    y: limitar(encaixar(elemento.y), 0, salao.altura - altura),
  }
}

/** O salão com um tamanho novo, com os elementos trazidos para dentro dele. */
export function redimensionarSalao(planta: PlantaDoSalao, tamanho: Tamanho): PlantaDoSalao {
  return { ...tamanho, elementos: planta.elementos.map((elemento) => encaixarElemento(elemento, tamanho)) }
}
