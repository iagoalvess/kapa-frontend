import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarFormandos, lancar, listarLancamentos } from '../api/cobrancas.api'
import { chaves } from './chaves'
import { useComAtraso } from './useComAtraso'

/** Os lançamentos avulsos da turma (Sprint 48, D23). */
export function useLancamentos() {
  return useQuery({ queryKey: chaves.lancamentos, queryFn: ({ signal }) => listarLancamentos(signal) })
}

/** Lançar cria parcelas: a lista e as parcelas da turma recarregam. */
export function useLancar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: lancar,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.lancamentos })
      void queryClient.invalidateQueries({ queryKey: chaves.todasAsParcelas })
    },
  })
}

/** Os formandos que batem com a busca, para escolher a quem lançar. */
export function useFormandosDaTurma(busca: string) {
  const atrasada = useComAtraso(busca, 300)

  return useQuery({
    queryKey: [...chaves.lancamentos, 'formandos', atrasada],
    queryFn: ({ signal }) => buscarFormandos(atrasada, signal),
    placeholderData: (anterior) => anterior,
  })
}
