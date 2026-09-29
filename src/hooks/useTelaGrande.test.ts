import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTamanhoDaPagina } from './useTelaGrande'

/** Uma tela de `largura` pixels, do jeito que o `matchMedia` a responde. */
function telaDe(largura: number) {
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: largura >= 1024 && consulta.includes('64rem'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

describe('useTamanhoDaPagina', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('usa o tamanho da tela no computador', () => {
    telaDe(1280)
    expect(renderHook(() => useTamanhoDaPagina(20)).result.current).toBe(20)
  })

  it('mostra cinco por página no celular', () => {
    telaDe(390)
    expect(renderHook(() => useTamanhoDaPagina(20)).result.current).toBe(5)
  })
})
