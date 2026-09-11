import { api } from '@/lib/http/cliente'
import type { ParDeTokens } from '@/lib/http/sessao'
import type { Credenciais } from '../types/auth.types'

const BASE = '/api/v1/auth'

/** Autentica e devolve o par de tokens. */
export function entrar(credenciais: Credenciais) {
  return api.post<ParDeTokens>(`${BASE}/login`, { body: credenciais, autenticar: false })
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
