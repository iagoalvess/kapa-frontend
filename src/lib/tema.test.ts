import { beforeEach, describe, expect, it, vi } from 'vitest'
import { aplicarTema, temaSalvo } from './tema'

describe('tema', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('cai na preferência do sistema quando nada foi escolhido', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))

    expect(temaSalvo()).toBe('escuro')
  })

  it('guarda a escolha e a devolve na próxima visita', () => {
    aplicarTema('escuro')

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(temaSalvo()).toBe('escuro')

    aplicarTema('claro')

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(temaSalvo()).toBe('claro')
  })
})
