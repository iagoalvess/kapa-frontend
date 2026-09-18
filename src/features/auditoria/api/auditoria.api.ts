import { api } from '@/lib/http/cliente'
import { type PaginacaoRequest, type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  FiltroDeAuditoria,
  LinhaDeAuditoria,
  OpcoesDeAuditoria,
  ResumoDaAuditoria,
} from '../types/auditoria.types'

const AUDITORIA = '/api/v1/auditoria'

/** A trilha da turma, paginada e filtrada. Da mais recente para a mais antiga. */
export function listarAuditoria(
  paginacao: PaginacaoRequest,
  filtro: FiltroDeAuditoria,
  signal?: AbortSignal,
) {
  return api.get<Pagina<LinhaDeAuditoria>>(AUDITORIA, {
    query: { ...paginacaoNaQuery(paginacao), ...filtro },
    signal,
  })
}

/** Os autores e os tipos de evento que esta turma tem registrados. */
export function obterOpcoesDeAuditoria(signal?: AbortSignal) {
  return api.get<OpcoesDeAuditoria>(`${AUDITORIA}/opcoes-de-filtro`, { signal })
}

/** Os números do topo da tela: quantas ações, quando foi a última e quem mais fez. */
export function obterResumoDeAuditoria(signal?: AbortSignal) {
  return api.get<ResumoDaAuditoria>(`${AUDITORIA}/resumo`, { signal })
}
