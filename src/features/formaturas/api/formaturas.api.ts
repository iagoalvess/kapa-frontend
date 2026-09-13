import { api } from '@/lib/http/cliente'
import type { ParDeTokens } from '@/lib/http/sessao'
import type { FormaturaDetalhe } from '@/types/formatura'
import type { DadosDaFormatura, FormaturaDoUsuario } from '../types/formaturas.types'

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

/**
 * Cria a formatura em rascunho, com quem criou como Presidente.
 *
 * Devolve a sessão já dentro da turma nova: não existe o estado "criei, mas ainda não estou nela".
 */
export function criarFormatura(dados: DadosDaFormatura) {
  return api.post<ParDeTokens>(BASE, { body: dados })
}

/** Edita os dados cadastrais da formatura selecionada. Só o Presidente. */
export function atualizarFormatura(dados: DadosDaFormatura) {
  return api.put<FormaturaDetalhe>(`${BASE}/atual`, { body: dados })
}

/** Encerra a formatura selecionada. Nada é apagado. Só o Presidente. */
export function encerrarFormatura() {
  return api.post<void>(`${BASE}/atual/encerrar`, { body: {} })
}

/** Descarta o rascunho selecionado, que nunca foi pago. Some da lista de todos. Só o Presidente. */
export function descartarFormatura() {
  return api.post<void>(`${BASE}/atual/descartar`, { body: {} })
}
