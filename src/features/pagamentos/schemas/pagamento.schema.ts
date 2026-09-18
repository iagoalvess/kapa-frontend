import { z } from 'zod'
import { diasAte } from '@/lib/formato'
import type { FormaDePagamento } from '../types/pagamentos.types'

/** R$ 1.000.000,00 — o teto do backend (`LimitesDoPagamento.ValorMaximo`). */
const VALOR_MAXIMO = 100_000_000

/** Tamanho do motivo e da justificativa no backend. */
const TEXTO_MAXIMO = 500

/** Como cada forma aparece na tela. O valor é contrato da API e vem sem acento. */
export const ROTULOS_DE_FORMA: Record<FormaDePagamento, string> = {
  Pix: 'PIX',
  Dinheiro: 'Dinheiro',
  Transferencia: 'Transferência (TED)',
  Outro: 'Outro',
}

/**
 * Dia, valor e comprovante opcional (P1 da Sprint 9) — o "já paguei" e a baixa manual. As mensagens
 * repetem as do backend, para a pessoa ler a mesma coisa venha de onde vier.
 */
export const esquemaDoPagamento = z.object({
  pago_em: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data do pagamento.')
    .refine((dia) => (diasAte(dia) ?? 1) <= 0, 'A data do pagamento não pode estar no futuro.'),
  valor_em_centavos: z
    .number()
    .int()
    .positive('Informe um valor maior que zero.')
    .max(VALOR_MAXIMO, 'O valor deve ser de no máximo R$ 1.000.000,00.'),
  comprovante: z.instanceof(File).optional(),
})

export type FormularioDoPagamento = z.infer<typeof esquemaDoPagamento>

/** O aviso de um pagamento que cobriu várias parcelas. O teto de 24 é o do backend. */
export const esquemaDoLote = esquemaDoPagamento.extend({
  parcela_ids: z
    .array(z.string())
    .min(1, 'Escolha ao menos uma parcela.')
    .max(24, 'Escolha no máximo 24 parcelas.'),
})

export type FormularioDoLote = z.infer<typeof esquemaDoLote>

/** A baixa manual: o pagamento e como o dinheiro chegou. */
export const esquemaDaBaixa = esquemaDoPagamento.extend({
  forma: z.enum(['Pix', 'Dinheiro', 'Transferencia', 'Outro']),
})

export type FormularioDaBaixa = z.infer<typeof esquemaDaBaixa>

/** Um texto obrigatório, com o teto do backend — o motivo da recusa e a justificativa do estorno. */
const textoObrigatorio = (mensagem: string) =>
  z.string().trim().min(1, mensagem).max(TEXTO_MAXIMO, `No máximo ${TEXTO_MAXIMO} caracteres.`)

/** O motivo vai ao formando por e-mail. */
export const esquemaDaRecusa = z.object({
  motivo: textoObrigatorio('Diga ao formando por que o pagamento foi recusado.'),
})

export type FormularioDaRecusa = z.infer<typeof esquemaDaRecusa>

/** A justificativa fica na auditoria. */
export const esquemaDoEstorno = z.object({
  justificativa: textoObrigatorio('Explique por que a baixa está sendo desfeita.'),
})

export type FormularioDoEstorno = z.infer<typeof esquemaDoEstorno>
