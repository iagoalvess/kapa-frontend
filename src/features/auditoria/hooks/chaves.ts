import type { PaginacaoRequest } from '@/types/paginacao'
import type { FiltroDeAuditoria } from '../types/auditoria.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['auditoria'] as const,
  lista: (paginacao: PaginacaoRequest, filtro: FiltroDeAuditoria) =>
    ['auditoria', 'lista', paginacao, filtro] as const,
  opcoesDeFiltro: ['auditoria', 'opcoes-de-filtro'] as const,
  resumo: ['auditoria', 'resumo'] as const,
}
