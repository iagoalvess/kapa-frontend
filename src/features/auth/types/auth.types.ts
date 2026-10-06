import type { AceiteDeDocumento } from '@/types/legal'

export type { ParDeTokens } from '@/lib/http/sessao'

/**
 * O segundo passo do login (202 de `POST /api/v1/auth/login`): administrador e presidente recebem um código de seis
 * dígitos no e-mail, e a sessão só sai com ele. Espelha `CodigoDeEntradaDTO`.
 */
export interface CodigoDeEntrada {
  /** Volta junto do código; liga os dois passos sem sessão. Fica só na memória da tela. */
  desafio: string
  /** O e-mail, mascarado. */
  enviado_para: string
  minutos_de_validade: number
}

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
  /** A caixa opcional "Quero receber dicas e novidades do Kapa" — desmarcada por padrão (Sprint 40). */
  receber_comunicacao_do_kapa: boolean
}

/** Corpo de `POST /api/v1/conta/redefinir-senha`. `email` e `token` vêm do link do e-mail. */
export interface RedefinicaoDeSenha {
  email: string
  token: string
  nova_senha: string
}

/** Corpo de `POST /api/v1/conta/confirmar-email`, com os dois valores do link do e-mail. */
export interface ConfirmacaoDeEmail {
  email: string
  token: string
}

/** Corpo de `POST /api/v1/conta/alterar-senha`. */
export interface TrocaDeSenha {
  senha_atual: string
  nova_senha: string
}
