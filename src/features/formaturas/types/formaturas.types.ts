import type { Papel } from '@/config/perfis'

/** Formatura da qual o usuário participa. Espelha `FormaturaDoUsuarioDTO`. */
export interface FormaturaDoUsuario {
  id: string
  nome: string
  papel: Papel
}
