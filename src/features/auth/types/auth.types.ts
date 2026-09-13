import type { AceiteDeDocumento } from '@/types/legal'

export type { ParDeTokens } from '@/lib/http/sessao'

/** Corpo de `POST /api/v1/auth/login`. */
export interface Credenciais {
  email: string
  senha: string
}

/**
 * Corpo de `POST /api/v1/auth/registrar`.
 *
 * Os aceites vão no mesmo corpo, e não numa segunda chamada: conta e consentimento nascem na
 * mesma transação no backend, e duas chamadas garantiriam que um dia uma falhe no meio.
 */
export interface NovaConta {
  nome: string
  email: string
  senha: string
  /** A versão vigente de cada documento, como veio de `GET /legal/vigentes`. */
  aceites: AceiteDeDocumento[]
}

/** Corpo de `POST /api/v1/conta/redefinir-senha`. `email` e `token` vêm do link do e-mail. */
export interface RedefinicaoDeSenha {
  email: string
  token: string
  novaSenha: string
}

/** Corpo de `POST /api/v1/conta/confirmar-email`, com os dois valores do link do e-mail. */
export interface ConfirmacaoDeEmail {
  email: string
  token: string
}

/** Corpo de `POST /api/v1/conta/alterar-senha`. */
export interface TrocaDeSenha {
  senhaAtual: string
  novaSenha: string
}
