import { z } from 'zod'
import { lerPercentual } from '@/lib/formato'
import type { ConfiguracaoDoCartao } from '../types/recebimentos.types'

/** O teto da taxa repassada, base 10.000 — o mesmo do backend: acima disso é engano de digitação. */
export const TAXA_MAXIMA = 1500

/** A taxa que o formulário sugere: a do Mercado Pago com o dinheiro na hora (P8), a mais cara. */
export const TAXA_SUGERIDA = '4,98'

/**
 * Ligar o cartão (Sprint 39): quem paga a taxa — a turma, o padrão, ou quem paga, com o percentual (P2).
 *
 * Só a forma: o teto de 15% se repete aqui para o erro aparecer no campo, antes de ir à API.
 */
export const esquemaDoCartao = z
  .object({
    quemPaga: z.enum(['turma', 'pagador']),
    taxa: z.string().trim(),
  })
  .superRefine(({ quemPaga, taxa }, contexto) => {
    if (quemPaga === 'turma') return
    const base = lerPercentual(taxa)
    if (base === null || base < 1 || base > TAXA_MAXIMA)
      contexto.addIssue({
        code: 'custom',
        path: ['taxa'],
        message: 'A taxa vai de 0,01% a 15%, com até duas casas.',
      })
  })

export type FormularioDoCartao = z.infer<typeof esquemaDoCartao>

/** O formulário como a API o recebe: ligado, com a taxa repassada ou nula. */
export const paraConfiguracao = ({ quemPaga, taxa }: FormularioDoCartao): ConfiguracaoDoCartao => ({
  ligado: true,
  taxa_repassada: quemPaga === 'pagador' ? lerPercentual(taxa) : null,
})
