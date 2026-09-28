import { describe, expect, it } from 'vitest'
import { limiteDaGuarda } from './limpeza.ts'

describe('limpeza da lista de espera', () => {
  it('corta em 12 meses antes, no formato que a Function grava', () => {
    expect(limiteDaGuarda(new Date('2027-09-28T06:00:00Z'))).toBe('2026-09-28T06:00:00.000Z')
  })
})
