import { describe, expect, it } from 'vitest'
import { paginar } from './paginar'

const numeros = Array.from({ length: 23 }, (_, i) => i + 1)

describe('paginar', () => {
  it('recorta a página pedida e conta as páginas', () => {
    expect(paginar(numeros, 3)).toEqual({ visiveis: [21, 22, 23], pagina: 3, totalPaginas: 3, total: 23 })
  })

  it('prende a página ao intervalo quando a lista encolhe', () => {
    expect(paginar(numeros.slice(0, 5), 3)).toMatchObject({ visiveis: [1, 2, 3, 4, 5], pagina: 1 })
    expect(paginar(numeros, 0).pagina).toBe(1)
  })

  it('lista vazia é uma página só', () => {
    expect(paginar([], 1)).toEqual({ visiveis: [], pagina: 1, totalPaginas: 1, total: 0 })
  })
})
