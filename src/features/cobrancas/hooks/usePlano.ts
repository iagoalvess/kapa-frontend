import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adicionarItem,
  alterarItem,
  atualizarPlano,
  criarPlano,
  encerrarItem,
  listarPlanos,
  obterPlano,
  removerItem,
  vigorarPlano,
} from '../api/cobrancas.api'
import type { PlanoDeCobranca } from '../types/cobrancas.types'
import { chaves } from './chaves'

/** Os planos da turma, o vigente primeiro. */
export function usePlanos() {
  return useQuery({ queryKey: chaves.planos(), queryFn: ({ signal }) => listarPlanos(signal) })
}

/** Um plano, com os itens. Sem id, não consulta. */
export function usePlano(planoId: string | undefined) {
  return useQuery({
    queryKey: chaves.plano(planoId ?? ''),
    queryFn: ({ signal }) => obterPlano(planoId!, signal),
    enabled: planoId !== undefined,
  })
}

/**
 * Toda escrita do plano devolve o plano inteiro: ele vai direto para o cache, e o que deriva dele
 * — lista, simulações, parcelas repactuadas ou canceladas — recarrega.
 */
function useEscritaDoPlano<T>(escrever: (variaveis: T) => Promise<PlanoDeCobranca>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: (plano) => {
      queryClient.setQueryData(chaves.plano(plano.id), plano)
      void queryClient.invalidateQueries({ queryKey: chaves.planos() })
      void queryClient.invalidateQueries({ queryKey: chaves.simulacoes })
      void queryClient.invalidateQueries({ queryKey: chaves.todasAsParcelas })
    },
  })
}

export const useCriarPlano = () => useEscritaDoPlano(criarPlano)
export const useAtualizarPlano = () => useEscritaDoPlano(atualizarPlano)
export const useAdicionarItem = () => useEscritaDoPlano(adicionarItem)
export const useAlterarItem = () => useEscritaDoPlano(alterarItem)
export const useRemoverItem = () => useEscritaDoPlano(removerItem)
export const useEncerrarItem = () => useEscritaDoPlano(encerrarItem)
export const useVigorarPlano = () => useEscritaDoPlano(vigorarPlano)
