import { api } from '@/lib/http/cliente'
import type { ParDeTokens } from '@/lib/http/sessao'
import type { FormaturaDoUsuario } from '../types/formaturas.types'

const BASE = '/api/v1/formaturas'

/** Formaturas em que o usuário tem vínculo ativo. */
export function listarMinhasFormaturas(signal?: AbortSignal) {
  return api.get<FormaturaDoUsuario[]>(`${BASE}/minhas`, { signal })
}

/**
 * Passa a sessão a enxergar a formatura informada.
 *
 * Devolve o mesmo `ParDeTokens` do login — a formatura vive dentro do access token assinado, e
 * não em um cabeçalho que o cliente escolhe.
 */
export function selecionarFormatura(formaturaId: string) {
  return api.post<ParDeTokens>(`${BASE}/${formaturaId}/selecionar`, { body: {} })
}
