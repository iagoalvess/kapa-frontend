import type { PaginacaoRequest } from '@/types/paginacao'
import type { FiltroDeContas, FiltroDeTurmas } from '../types/painel.types'

export const chaves = {
  analytics: (periodo: { de?: string; ate?: string }) => ['painel', 'analytics', periodo] as const,
  serie: (meses: number) => ['painel', 'serie', meses] as const,
  turmas: (filtro: FiltroDeTurmas) => ['painel', 'turmas', filtro] as const,
  contas: (filtro: FiltroDeContas) => ['painel', 'contas', filtro] as const,
  turma: (id: string) => ['painel', 'turma', id] as const,
  membros: (id: string, paginacao: PaginacaoRequest) =>
    ['painel', 'turma', id, 'membros', paginacao] as const,
  conta: (id: string) => ['painel', 'conta', id] as const,
}
