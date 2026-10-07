import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { criarCupom, desativarCupom, listarCupons } from '../api/painel.api'
import { chaves } from './chaves'

/** Os cupons da primeira cobrança (Sprint 51). */
export function useCupons() {
  return useQuery({ queryKey: chaves.cupons, queryFn: ({ signal }) => listarCupons(signal) })
}

/** Cria um cupom e relê a lista. */
export function useCriarCupom() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: criarCupom,
    onSuccess: () => void cliente.invalidateQueries({ queryKey: chaves.cupons }),
  })
}

/** Desativa um cupom e relê a lista. */
export function useDesativarCupom() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: desativarCupom,
    onSuccess: () => void cliente.invalidateQueries({ queryKey: chaves.cupons }),
  })
}
