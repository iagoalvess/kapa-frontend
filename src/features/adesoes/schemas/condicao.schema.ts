import { z } from 'zod'
import { lerPercentual } from '@/lib/formato'
import type { CondicaoLida, DadosDaCondicao, PacoteDoCatalogo } from '../types/adesoes.types'

/** Cem por cento na base 10.000 dos percentuais da API. */
const INTEIRO = 10_000

/**
 * A condição financeira de uma pessoa (Sprint 54): uma linha por pacote do catálogo, marcada ou não. Forma só — se o
 * pacote ainda está à venda e se há duas faixas do mesmo grupo, a API confere.
 */
export const esquemaDeCondicao = z.object({
  beneficios: z
    .array(
      z
        .object({
          item_de_cobranca_id: z.string(),
          incluido: z.boolean(),
          /** Isenção é percentual de 100%, com nome próprio na tela: é o caso mais comum, o da comissão. */
          forma: z.enum(['isencao', 'percentual', 'valor']),
          percentual: z.string(),
          valor_em_centavos: z.number().int(),
        })
        .superRefine((beneficio, contexto) => {
          if (!beneficio.incluido) return
          const percentual = lerPercentual(beneficio.percentual)
          if (
            beneficio.forma === 'percentual' &&
            !(percentual !== null && percentual > 0 && percentual <= INTEIRO)
          )
            contexto.addIssue({ code: 'custom', path: ['percentual'], message: 'De 0,01% a 100%.' })
          if (beneficio.forma === 'valor' && beneficio.valor_em_centavos <= 0)
            contexto.addIssue({ code: 'custom', path: ['valor_em_centavos'], message: 'Maior que zero.' })
        }),
    )
    .refine((beneficios) => beneficios.some((beneficio) => beneficio.incluido), {
      message: 'Escolha ao menos um pacote.',
    }),
})

export type FormularioDeCondicao = z.infer<typeof esquemaDeCondicao>

/** O formulário com o catálogo inteiro, já marcado com o que a pessoa tem. */
export function condicaoNoFormulario(
  catalogo: PacoteDoCatalogo[],
  condicao: CondicaoLida | null,
): FormularioDeCondicao {
  return {
    beneficios: catalogo.map((pacote) => {
      const atual = condicao?.beneficios.find((beneficio) => beneficio.item_de_cobranca_id === pacote.id)
      const percentual = atual?.percentual ?? null

      return {
        item_de_cobranca_id: pacote.id,
        incluido: !!atual,
        forma: !atual || percentual === INTEIRO ? 'isencao' : percentual !== null ? 'percentual' : 'valor',
        percentual:
          percentual !== null && percentual !== INTEIRO ? String(percentual / 100).replace('.', ',') : '',
        valor_em_centavos: atual?.valor_em_centavos ?? 0,
      }
    }),
  }
}

/** Só as linhas marcadas, cada uma como percentual ou valor — a isenção vai como 100%. */
export const paraDadosDaCondicao = (formulario: FormularioDeCondicao): DadosDaCondicao => ({
  beneficios: formulario.beneficios
    .filter((beneficio) => beneficio.incluido)
    .map((beneficio) => ({
      item_de_cobranca_id: beneficio.item_de_cobranca_id,
      percentual:
        beneficio.forma === 'isencao'
          ? INTEIRO
          : beneficio.forma === 'percentual'
            ? lerPercentual(beneficio.percentual)
            : null,
      valor_em_centavos: beneficio.forma === 'valor' ? beneficio.valor_em_centavos : null,
    })),
})
