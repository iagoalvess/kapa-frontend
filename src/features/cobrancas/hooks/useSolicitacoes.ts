import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chavesDosConvites } from '@/hooks/useResumoDosConvites'
import { aprovarSolicitacao, listarSolicitacoes, recusarSolicitacao } from '../api/cobrancas.api'
import type { StatusDaSolicitacao } from '../types/cobrancas.types'
import { chaves } from './chaves'

/** A fila de solicitações de cancelamento da turma (Sprint 48, D8). */
export function useSolicitacoes(status?: StatusDaSolicitacao) {
  return useQuery({
    queryKey: chaves.solicitacoes(status),
    queryFn: ({ signal }) => listarSolicitacoes(status, signal),
  })
}

/**
 * Responder derruba tudo o que é de cobrança: aprovar cancela pedido ou pacote (parcelas, estoque) e revoga convites;
 * recusar só tira a suspensão das parcelas — e as duas tiram a solicitação da fila.
 */
function useResposta<T>(responder: (variaveis: T) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: responder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.tudo })
      void queryClient.invalidateQueries({ queryKey: chavesDosConvites.tudo })
    },
  })
}

export const useAprovarSolicitacao = () => useResposta(aprovarSolicitacao)
export const useRecusarSolicitacao = () => useResposta(recusarSolicitacao)
