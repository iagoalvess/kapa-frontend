import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  aceitarAditivo,
  obterMinhaCesta,
  simularAditivo,
  solicitarCancelamentoDoPacote,
  solicitarCodigoDoAditivo,
} from '../api/adesoes.api'
import { chaves } from './chaves'

/** A própria cesta e o que o aditivo pode acrescentar (Sprint 48). */
export function useMinhaCesta() {
  return useQuery({ queryKey: chaves.cesta(), queryFn: ({ signal }) => obterMinhaCesta(signal) })
}

/** A prévia do aditivo. Mutação, e não consulta: é o clique de "Ver o aditivo" que a pede, e o hash é dela. */
export function useSimularAditivo() {
  return useMutation({ mutationFn: simularAditivo })
}

/** O código do aditivo, enviado ao e-mail da conta. */
export function useSolicitarCodigoDoAditivo() {
  return useMutation({ mutationFn: solicitarCodigoDoAditivo })
}

/**
 * Mudar a cesta muda parcelas: o aditivo cria as da diferença e o cancelamento as suspende. A adesão, a cobrança e o
 * extrato recarregam — as chaves das outras features vão por literal, porque uma feature não importa de outra.
 */
function useMudancaDaCesta<T>(mudar: (variaveis: T) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mudar,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.tudo })
      void queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      void queryClient.invalidateQueries({ queryKey: ['pagamentos'] })
    },
  })
}

export const useAceitarAditivo = () => useMudancaDaCesta(aceitarAditivo)
export const useSolicitarCancelamentoDoPacote = () => useMudancaDaCesta(solicitarCancelamentoDoPacote)
