export type { ParDeTokens } from '@/lib/http/sessao'

/** Corpo de `POST /api/v1/auth/login`. */
export interface Credenciais {
  email: string
  senha: string
}

/** Corpo de `POST /api/v1/auth/registrar`. */
export interface NovaConta {
  nome: string
  email: string
  senha: string
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
