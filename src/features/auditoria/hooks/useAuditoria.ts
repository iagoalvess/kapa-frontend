import { useQuery } from '@tanstack/react-query'
import type { PaginacaoRequest } from '@/types/paginacao'
import { listarAuditoria, obterOpcoesDeAuditoria, obterResumoDeAuditoria } from '../api/auditoria.api'
import type { FiltroDeAuditoria } from '../types/auditoria.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['auditoria'] as const,
  lista: (paginacao: PaginacaoRequest, filtro: FiltroDeAuditoria) =>
    ['auditoria', 'lista', paginacao, filtro] as const,
  opcoesDeFiltro: ['auditoria', 'opcoes-de-filtro'] as const,
  resumo: ['auditoria', 'resumo'] as const,
}

/** A trilha da turma. */
export function useAuditoria(paginacao: PaginacaoRequest, filtro: FiltroDeAuditoria) {
  return useQuery({
    queryKey: chaves.lista(paginacao, filtro),
    queryFn: ({ signal }) => listarAuditoria(paginacao, filtro, signal),
  })
}

/**
 * Autores e tipos de evento desta turma, para os seletores.
 *
 * Meia hora fresco: a lista só cresce quando alguém faz algo auditável, e ela é lida a cada
 * abertura do painel de filtros.
 */
export function useOpcoesDeAuditoria() {
  return useQuery({
    queryKey: chaves.opcoesDeFiltro,
    queryFn: ({ signal }) => obterOpcoesDeAuditoria(signal),
    staleTime: 30 * 60_000,
  })
}

/**
 * Os números do topo da tela.
 *
 * Consulta própria, e não derivada da página: a faixa conta a turma inteira, e a lista mostra vinte
 * linhas de um recorte.
 */
export function useResumoDeAuditoria() {
  return useQuery({
    queryKey: chaves.resumo,
    queryFn: ({ signal }) => obterResumoDeAuditoria(signal),
  })
}
