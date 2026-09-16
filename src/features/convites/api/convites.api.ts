import { api } from '@/lib/http/cliente'
import type { ParDeTokens } from '@/lib/http/sessao'
import type { ConviteCriado, ConvitePublico, ConviteResumo, CriarConvite } from '../types/convite.types'

// Gestão usa `atual`: a formatura vem do token. O aceite usa só o token do convite.
const GESTAO = '/api/v1/formaturas/atual/convites'
const PUBLICO = '/api/v1/convites'

/** Os convites mais recentes da formatura selecionada. */
export function listarConvites(signal?: AbortSignal) {
  return api.get<ConviteResumo[]>(GESTAO, { signal })
}

/** Cria o convite e devolve o link. Link da turma novo revoga o vigente. */
export function criarConvite(dados: CriarConvite) {
  return api.post<ConviteCriado>(GESTAO, { body: dados })
}

/** Revoga o convite: o link para de funcionar na hora. */
export function revogarConvite(id: string) {
  return api.delete<void>(`${GESTAO}/${id}`)
}

/**
 * Turma, instituição e papel oferecido. Público.
 *
 * Com sessão, o access token vai junto de propósito: o limite de convites passa a contar na cota
 * da pessoa, e não na do IP que a turma inteira divide no Wi-Fi da assembleia. Sem sessão não há
 * token a mandar, e o endpoint anônimo nunca responde 401 — não há renovação à toa.
 */
export function obterConvite(token: string, signal?: AbortSignal) {
  return api.get<ConvitePublico>(`${PUBLICO}/${encodeURIComponent(token)}`, { signal })
}

/**
 * Entra na turma do convite. Devolve a sessão já dentro dela.
 *
 * O corpo vai vazio de propósito: o papel é o do convite, e o refresh token viaja no cookie.
 */
export function aceitarConvite(token: string) {
  return api.post<ParDeTokens>(`${PUBLICO}/${encodeURIComponent(token)}/aceitar`, { body: {} })
}

/**
 * Reenvia o link de confirmação do e-mail — o convite pessoal só aceita conta confirmada.
 *
 * Mesma chamada da tela de login; repetida aqui porque uma feature não importa de outra.
 */
export function reenviarConfirmacao(email: string) {
  return api.post<void>('/api/v1/conta/reenviar-confirmacao', { body: { email }, autenticar: false })
}
