import { describe, expect, it } from 'vitest'
import type { PacoteDoCatalogo } from '../types/adesoes.types'
import { condicaoNoFormulario, esquemaDeCondicao, paraDadosDaCondicao } from './condicao.schema'

const pacote = (id: string): PacoteDoCatalogo => ({
  id,
  grupo: null,
  tipo: 'Festa',
  descricao: id,
  valor_em_centavos: 500_000,
  numero_de_parcelas: 10,
  convites_da_festa: 10,
  convites_da_colacao: 0,
  desconto_em_centavos: 0,
})

describe('condição financeira', () => {
  it('isenção vai como 100%, percentual em base 10.000 e valor fixo em centavos; o desmarcado não vai', () => {
    const formulario = condicaoNoFormulario(
      [pacote('festa'), pacote('fotos'), pacote('beca'), pacote('jantar')],
      null,
    )
    formulario.beneficios[0] = { ...formulario.beneficios[0]!, incluido: true, forma: 'isencao' }
    formulario.beneficios[1] = {
      ...formulario.beneficios[1]!,
      incluido: true,
      forma: 'percentual',
      percentual: '12,5',
    }
    formulario.beneficios[2] = {
      ...formulario.beneficios[2]!,
      incluido: true,
      forma: 'valor',
      valor_em_centavos: 50_000,
    }

    const dados = paraDadosDaCondicao(formulario)

    expect(dados).toEqual({
      beneficios: [
        { item_de_cobranca_id: 'festa', percentual: 10_000, valor_em_centavos: null },
        { item_de_cobranca_id: 'fotos', percentual: 1_250, valor_em_centavos: null },
        { item_de_cobranca_id: 'beca', percentual: null, valor_em_centavos: 50_000 },
      ],
    })
  })

  it('reabre a condição gravada com a forma de cada benefício', () => {
    const formulario = condicaoNoFormulario([pacote('festa'), pacote('fotos')], {
      beneficios: [
        {
          item_de_cobranca_id: 'fotos',
          percentual: 2_000,
          valor_em_centavos: null,
          rotulo: 'Fotos',
          preco_em_centavos: 500_000,
          desconto_em_centavos: 100_000,
        },
      ],
      atualizada_em: '2026-10-12T12:00:00Z',
    })

    expect(formulario.beneficios[0]).toMatchObject({ incluido: false })
    expect(formulario.beneficios[1]).toMatchObject({ incluido: true, forma: 'percentual', percentual: '20' })
  })

  it('recusa nenhum pacote marcado e percentual acima de 100%', () => {
    const vazio = condicaoNoFormulario([pacote('festa')], null)
    const acima = {
      ...vazio,
      beneficios: [
        { ...vazio.beneficios[0]!, incluido: true, forma: 'percentual' as const, percentual: '150' },
      ],
    }

    expect(esquemaDeCondicao.safeParse(vazio).success).toBe(false)
    expect(esquemaDeCondicao.safeParse(acima).success).toBe(false)
  })
})
