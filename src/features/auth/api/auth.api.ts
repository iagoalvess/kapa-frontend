import { api } from '@/lib/http/cliente'
import type { ParDeTokens } from '@/lib/http/sessao'
import type { Credenciais, NovaConta } from '../types/auth.types'

const BASE = '/api/v1/auth'

/** Autentica e devolve o par de tokens. */
export function entrar(credenciais: Credenciais) {
  return api.post<ParDeTokens>(`${BASE}/login`, { body: credenciais, autenticar: false })
}

/** Cria a conta e já devolve a sessão — quem se cadastra entra direto. */
export function registrar(conta: NovaConta) {
  return api.post<ParDeTokens>(`${BASE}/registrar`, { body: conta, autenticar: false })
}

/**
 * Entra na turma do convite e devolve a sessão já dentro dela.
 *
 * Mesma chamada da página do convite; repetida aqui porque uma feature não importa de outra.
 */
export function aceitarConvite(token: string) {
  return api.post<ParDeTokens>(`/api/v1/convites/${encodeURIComponent(token)}/aceitar`, { body: {} })
}

/**
 * Revoga a sessão no servidor e apaga o cookie.
 *
 * Não recebe token: o servidor lê o cookie `HttpOnly`, que este código não enxerga. Sair sem
 * chamar isto deixaria o refresh token vivo no servidor pelos dias de validade dele.
 */
export function sair() {
  return api.post<void>(`${BASE}/logout`, { body: {}, autenticar: false })
}
