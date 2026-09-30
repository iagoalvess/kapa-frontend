import { describe, expect, it } from 'vitest'
import type { EventoDaTurma } from '@/types/agenda'
import { agruparPorMes, dataDoTipo, filtrar } from './agenda'

function evento(parcial: Partial<EventoDaTurma> & Pick<EventoDaTurma, 'id' | 'data'>): EventoDaTurma {
  return {
    titulo: 'Reunião',
    tipo: 'Reuniao',
    situacao: 'Confirmado',
    hora: null,
    local: null,
    descricao: null,
    ...parcial,
  }
}

describe('agruparPorMes', () => {
  it('junta os eventos do mesmo mês e pula o mês sem evento', () => {
    const meses = agruparPorMes([
      evento({ id: 'a', data: '2026-10-03' }),
      evento({ id: 'b', data: '2026-10-28' }),
      evento({ id: 'c', data: '2027-01-15' }),
    ])

    expect(meses.map(({ mes, eventos }) => [mes, eventos.map((e) => e.id)])).toEqual([
      ['2026-10-01', ['a', 'b']],
      ['2027-01-01', ['c']],
    ])
  })
})

describe('dataDoTipo', () => {
  it('ignora a colação cancelada e fica com a que vale', () => {
    const eventos = [
      evento({ id: 'a', data: '2027-06-10', tipo: 'Colacao', situacao: 'Cancelado' }),
      evento({ id: 'b', data: '2027-07-02', tipo: 'Colacao' }),
    ]

    expect(dataDoTipo(eventos, 'Colacao')).toBe('2027-07-02')
    expect(dataDoTipo(eventos, 'Festa')).toBeNull()
  })
})

describe('filtrar', () => {
  it('cruza o tipo com a busca sem acento', () => {
    const eventos = [
      evento({ id: 'a', data: '2026-10-03', titulo: 'Prova da beca', tipo: 'Prazo' }),
      evento({ id: 'b', data: '2026-10-04', titulo: 'Reunião da comissão' }),
    ]

    expect(filtrar(eventos, null, 'reuniao').map((e) => e.id)).toEqual(['b'])
    expect(filtrar(eventos, 'Prazo', 'reuniao')).toEqual([])
  })
})
