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
}

/** Corpo da criação e da edição. Espelha `DadosDaFormaturaRequestDTO`. */
export interface DadosDaFormatura {
  nome: string
  instituicao: string
  curso: string
  ano: number
  semestre: number
  /** `yyyy-MM-dd`, ou nulo. */
  previsao_de_colacao: string | null
  /** `yyyy-MM-dd`, ou nulo. */
  previsao_da_festa: string | null
  quantidade_estimada_de_formandos: number
}
