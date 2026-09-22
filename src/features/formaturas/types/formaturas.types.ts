import type { Papel } from '@/config/perfis'

/** Formatura da qual o usuário participa. Espelha `FormaturaDoUsuarioDTO`. */
export interface FormaturaDoUsuario {
  id: string
  nome: string
  curso: string
  instituicao: string
  ano: number
  semestre: number
  papel: Papel
  /**
   * Quando ele foi desligado desta turma, em ISO; ausente para quem continua nela.
   *
   * A turma desligada segue na lista: o extrato é a prova do que ele pagou, e escondê-la seria
   * escondê-la também dele (P5 da Sprint 15).
   */
  desligado_em?: string
}

/**
 * Corpo da criação e da edição. Espelha `DadosDaFormaturaRequestDTO`.
 *
 * Sem a colação e a festa: elas são eventos da agenda desde a Sprint 19. O detalhe da turma
 * continua devolvendo as duas — lidas de lá —, mas quem as escreve é `POST /agenda`.
 */
export interface DadosDaFormatura {
  nome: string
  instituicao: string
  curso: string
  ano: number
  semestre: number
  quantidade_estimada_de_formandos: number
}
