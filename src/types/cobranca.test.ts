import { describe, expect, it } from 'vitest'
import { type Parcela, vencidaSemAviso } from './cobranca'

/** Uma parcela com o mínimo que o predicado lê. */
const parcela = (status: Parcela['status'], em_conferencia = false) => ({ status, em_conferencia })

describe('vencidaSemAviso', () => {
  it('conta a vencida que ainda não tem aviso de pagamento', () => {
    expect(vencidaSemAviso(parcela('Vencida'))).toBe(true)
  })

  it('não conta quem já mandou o comprovante', () => {
    expect(vencidaSemAviso(parcela('Vencida', true))).toBe(false)
  })

  it('não conta a que ainda não venceu — o selo do menu precisa poder zerar', () => {
    expect(vencidaSemAviso(parcela('Aberta'))).toBe(false)
  })

  it.each(['Paga', 'Cancelada', 'Renegociada'] as const)('não conta a %s', (status) => {
    expect(vencidaSemAviso(parcela(status))).toBe(false)
  })
})
