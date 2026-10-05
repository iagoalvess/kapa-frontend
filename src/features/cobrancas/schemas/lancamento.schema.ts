import { z } from 'zod'
import { inteiroEmTexto } from '@/lib/esquemas'
import type { DadosDoLancamento } from '../types/cobrancas.types'

/** O lançamento avulso no vínculo de um formando (Sprint 48, D23/D42). Forma só: a adesão e o plano, a API confere. */
export const esquemaDeLancamento = z.object({
  usuario_id: z.string().min(1, 'Escolha o formando.'),
  descricao: z
    .string()
    .trim()
    .min(1, 'Diga o que é o lançamento.')
    .max(120, 'A descrição deve ter no máximo 120 caracteres.'),
  /** Cobrança soma ao que o formando deve; crédito abate (bolsa, desconto). */
  natureza: z.enum(['cobranca', 'credito']),
  valor_em_centavos: z.number().int().positive('Informe um valor maior que zero.'),
  numero_de_parcelas: inteiroEmTexto(1, 120, 'De 1 a 120 parcelas.'),
  /** `aaaa-mm-dd`. */
  primeiro_vencimento: z.string().min(1, 'Informe o primeiro vencimento.'),
})

export type FormularioDeLancamento = z.infer<typeof esquemaDeLancamento>

/** O formulário vazio: uma cobrança à vista. */
export const lancamentoEmBranco = (): FormularioDeLancamento => ({
  usuario_id: '',
  descricao: '',
  natureza: 'cobranca',
  valor_em_centavos: 0,
  numero_de_parcelas: '1',
  primeiro_vencimento: '',
})

/** O valor sai com sinal: o crédito vai negativo, que é como a API o lê. */
export const paraDadosDoLancamento = (formulario: FormularioDeLancamento): DadosDoLancamento => ({
  usuario_id: formulario.usuario_id,
  descricao: formulario.descricao.trim(),
  valor_em_centavos:
    formulario.natureza === 'credito' ? -formulario.valor_em_centavos : formulario.valor_em_centavos,
  numero_de_parcelas: Number(formulario.numero_de_parcelas),
  primeiro_vencimento: formulario.primeiro_vencimento,
})
