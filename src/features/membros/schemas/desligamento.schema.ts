import { z } from 'zod'
import { MOTIVOS_DE_SAIDA } from '../types/membros.types'

/** O limite é o do backend (`DesligarFormandoValidator.TamanhoDoDetalhe`). */
const TAMANHO_DO_DETALHE = 200

/**
 * O desligamento: por que a pessoa sai, e o que fazer com o que já venceu.
 *
 * A justificativa é obrigatória só em "Outro" — nos demais, o próprio motivo já é a resposta. O
 * `superRefine` põe a mensagem no campo certo, para o erro aparecer embaixo dele e não no topo.
 */
export const esquemaDeDesligamento = z
  .object({
    motivo: z.enum(
      Object.keys(MOTIVOS_DE_SAIDA) as [keyof typeof MOTIVOS_DE_SAIDA],
      'Escolha o motivo da saída.',
    ),
    detalhe: z
      .string()
      .trim()
      .max(TAMANHO_DO_DETALHE, `A justificativa deve ter no máximo ${TAMANHO_DO_DETALHE} caracteres.`),
    cancelar_atraso: z.boolean(),
  })
  .superRefine((valores, contexto) => {
    if (valores.motivo === 'Outro' && valores.detalhe.length === 0) {
      contexto.addIssue({ code: 'custom', path: ['detalhe'], message: 'Diga qual foi o motivo.' })
    }
  })

export type FormularioDeDesligamento = z.infer<typeof esquemaDeDesligamento>
