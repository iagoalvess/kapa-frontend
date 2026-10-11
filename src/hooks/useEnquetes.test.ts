import { describe, expect, it } from 'vitest'
import { enqueteDeTeste } from '@/features/enquetes/dadosDeTeste'
import { enqueteDaHome, enquetesPendentes } from './useEnquetes'

describe('Enquete única da home', () => {
  it('prefere a aberta mais recente mesmo respondida e mantém outras pendências no menu', () => {
    const antiga = enqueteDeTeste({ id: 'antiga', criado_em: '2026-10-10T12:00:00Z' })
    const recente = enqueteDeTeste({ id: 'recente', minha_resposta: ['o-1'] })
    expect(enqueteDaHome([antiga, recente])?.id).toBe('recente')
    expect(enquetesPendentes([antiga, recente]).map((e) => e.id)).toEqual(['antiga'])
  })
  it('usa o encerramento efetivo para escolher o último resultado e nunca mostra canceladas', () => {
    const ultima = enqueteDeTeste({
      id: 'ultima',
      situacao: 'Encerrada',
      encerrada_em: '2026-10-11T12:00:00Z',
    })
    const antiga = enqueteDeTeste({
      id: 'antiga',
      situacao: 'Encerrada',
      encerrada_em: '2026-10-10T12:00:00Z',
      encerra_em: '2099-10-13T12:00:00Z',
    })
    const cancelada = enqueteDeTeste({ situacao: 'Cancelada' })
    expect(enqueteDaHome([antiga, cancelada, ultima])?.id).toBe('ultima')
    expect(enqueteDaHome([cancelada])).toBeUndefined()
    expect(enqueteDaHome([])).toBeUndefined()
  })
})
