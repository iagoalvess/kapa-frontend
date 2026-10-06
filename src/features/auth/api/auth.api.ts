import { api } from '@/lib/http/cliente'
import type { ParDeTokens } from '@/lib/http/sessao'
import type { CodigoDeEntrada, Credenciais, NovaConta } from '../types/auth.types'

const BASE = '/api/v1/auth'

/** Autentica e devolve o par de tokens — ou, para administrador e presidente, o pedido do código do e-mail. */
export function entrar(credenciais: Credenciais) {
  return api.post<ParDeTokens | CodigoDeEntrada>(`${BASE}/login`, { body: credenciais, autenticar: false })
}

/** O segundo passo do login: o código do e-mail troca o desafio pela sessão. */
export function confirmarCodigo({ desafio, codigo }: { desafio: string; codigo: string }) {
  return api.post<ParDeTokens>(`${BASE}/login/codigo`, { body: { desafio, codigo }, autenticar: false })
}

/** Manda o código de novo. */
export function reenviarCodigo(desafio: string) {
  return api.post<CodigoDeEntrada>(`${BASE}/login/codigo/reenviar`, { body: { desafio }, autenticar: false })
}

/** Se o login parou no segundo passo. */
export const pediuCodigo = (resposta: ParDeTokens | CodigoDeEntrada): resposta is CodigoDeEntrada =>
  'desafio' in resposta

/** Cria a conta e já devolve a sessão — quem se cadastra entra direto. */
export function registrar(conta: NovaConta) {
  return api.post<ParDeTokens>(`${BASE}/registrar`, { body: conta, autenticar: false })
}

/**
 * Entra na turma do convite e devolve a sessão já dentro dela.
 *
 * Mesma chamada da página do convite; repetida aqui porque uma feature não importa de outra.
 */
export function aceitarConvite(token: string, accessToken: string) {
  return api.post<ParDeTokens>(`/api/v1/convites/${encodeURIComponent(token)}/aceitar`, {
    body: {},
    autenticar: false,
    headers: { Authorization: `Bearer ${accessToken}` },
  })
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
