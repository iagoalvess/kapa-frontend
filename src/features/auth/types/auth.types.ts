export type { ParDeTokens } from '@/lib/http/sessao'

/** Corpo de `POST /api/v1/auth/login`. */
export interface Credenciais {
  email: string
  senha: string
}
