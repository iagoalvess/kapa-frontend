import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { criarConvite, listarConvites, revogarConvite } from '../api/convites.api'
import { chaves } from './chaves'

/** Os convites da formatura selecionada, com situação e entradas. */
export function useConvites() {
  return useQuery({ queryKey: chaves.lista(), queryFn: ({ signal }) => listarConvites(signal) })
}

/** Criação de convite. O link da turma novo chega pela lista, que é invalidada. */
export function useCriarConvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: criarConvite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.lista() }),
  })
}

/** Revogação de convite. */
export function useRevogarConvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revogarConvite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.lista() }),
  })
}
