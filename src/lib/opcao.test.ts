import { describe, expect, it } from 'vitest'
import { ehOpcao } from './opcao'

const ABAS = { conferir: 'Conferir', baixados: 'Baixados' } as const

describe('ehOpcao', () => {
  it('aceita só as chaves do mapa', () => {
    expect(ehOpcao('conferir', ABAS)).toBe(true)
    expect(ehOpcao('outra', ABAS)).toBe(false)
    expect(ehOpcao(null, ABAS)).toBe(false)
  })

  /** A barra de endereço é editável: o que o objeto herda não é opção da tela. */
  it('recusa o que o objeto herda', () => {
    expect(ehOpcao('toString', ABAS)).toBe(false)
    expect(ehOpcao('constructor', ABAS)).toBe(false)
    expect(ehOpcao('__proto__', ABAS)).toBe(false)
  })
})
