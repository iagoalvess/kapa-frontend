import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { obterPreferencias, salvarPreferencias } from '../api/notificacoes.api'
import { chaves } from './chaves'

/** O que o próprio membro escolheu receber, um item por assunto. */
export function usePreferencias() {
  return useQuery({
    queryKey: chaves.preferencias,
    queryFn: ({ signal }) => obterPreferencias(signal),
  })
}

/** Grava as escolhas do membro; a resposta já é a lista nova. */
export function useSalvarPreferencias() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: salvarPreferencias,
    onSuccess: (preferencias) => {
      queryClient.setQueryData(chaves.preferencias, preferencias)
    },
  })
}
