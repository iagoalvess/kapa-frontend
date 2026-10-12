import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { obterCondicao, removerCondicao, salvarCondicao } from '../api/condicoes.api'
import type { PessoaDaCondicao } from '../types/adesoes.types'
import { chaves } from './chaves'

/**
 * O desconto ou a isenção da pessoa (Sprint 54).
 *
 * @param habilitado Falso não consulta — o diálogo só pede ao abrir.
 */
export function useCondicao(pessoa: PessoaDaCondicao, habilitado = true) {
  return useQuery({
    queryKey: chaves.condicao(pessoa),
    queryFn: ({ signal }) => obterCondicao(pessoa, signal),
    enabled: habilitado,
  })
}

/**
 * Conceder, alterar ou revogar muda a prévia de quem vai aderir e a coluna do painel: a feature inteira recarrega.
 * Invalidação com `void`, como nas outras mutações da feature.
 */
function useMudancaDaCondicao<T>(mudar: (variaveis: T) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mudar,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.tudo })
    },
  })
}

export const useSalvarCondicao = () => useMudancaDaCondicao(salvarCondicao)
export const useRemoverCondicao = () => useMudancaDaCondicao(removerCondicao)
