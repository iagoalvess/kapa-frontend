import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { obterPreferencias, salvarPreferencias } from '../api/notificacoes.api'
import { chaves } from './chaves'

/**
 * O que o próprio membro escolheu receber, um item por assunto.
 *
 * @param habilitado Falso não consulta: fora do plano que inclui avisos, a API responde 403 e a tela trancaria
 *   num erro em vez de dizer em que plano está.
 */
export function usePreferencias(habilitado = true) {
  return useQuery({
    queryKey: chaves.preferencias,
    queryFn: ({ signal }) => obterPreferencias(signal),
    enabled: habilitado,
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
