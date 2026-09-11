import { api } from '@/lib/http/cliente'
import type { ConfirmacaoDeEmail, RedefinicaoDeSenha, TrocaDeSenha } from '../types/auth.types'

const BASE = '/api/v1/conta'

/**
 * Pede o link de redefinição de senha.
 *
 * Responde 204 exista a conta ou não — a tela não pode dizer "e-mail não encontrado", ou vira
 * um verificador de quem tem cadastro.
 */
export function solicitarRedefinicao(email: string) {
  return api.post<void>(`${BASE}/esqueci-senha`, { body: { email }, autenticar: false })
}

/** Troca a senha usando o token do link. Derruba todas as sessões abertas da conta. */
export function redefinirSenha(dados: RedefinicaoDeSenha) {
  return api.post<void>(`${BASE}/redefinir-senha`, { body: dados, autenticar: false })
}

/** Confirma o e-mail com o token do link. Idempotente: e-mail já confirmado responde 204. */
export function confirmarEmail(dados: ConfirmacaoDeEmail) {
  return api.post<void>(`${BASE}/confirmar-email`, { body: dados, autenticar: false })
}

/** Reenvia o e-mail de confirmação. Responde 204 exista a conta ou não. */
export function reenviarConfirmacao(email: string) {
  return api.post<void>(`${BASE}/reenviar-confirmacao`, { body: { email }, autenticar: false })
}

/** Troca a senha de quem está logado. Encerra todas as sessões, inclusive a atual. */
export function alterarSenha(dados: TrocaDeSenha) {
  return api.post<void>(`${BASE}/alterar-senha`, { body: dados })
}
