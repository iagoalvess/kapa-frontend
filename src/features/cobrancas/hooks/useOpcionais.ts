import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chavesDaFesta } from '@/hooks/useItensDaFesta'
import {
  alterarOpcional,
  criarOpcional,
  encerrarOpcional,
  excluirOpcional,
  listarOpcionais,
} from '../api/opcionais.api'
import { chaves } from './chaves'

/**
 * Os itens que o formando pode pedir hoje.
 *
 * @param habilitado Falso não consulta — é o que faz a vitrine só pedir a lista onde ela aparece.
 */
export function useOpcionais(habilitado = true) {
  return useQuery({
    queryKey: chaves.opcionais,
    queryFn: ({ signal }) => listarOpcionais(signal),
    enabled: habilitado,
  })
}

/**
 * Toda escrita dos opcionais derruba o plano, a vitrine e o cartão da festa.
 *
 * A festa entra porque o item opcional ligado a um item `PorFormando` é de onde sai o preço do
 * cartão dele (decisão 11) — é o mesmo acoplamento de cache que `financeiro` já tem com a festa ao
 * lançar despesa.
 */
function useEscritaDosOpcionais<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.planos() })
      void queryClient.invalidateQueries({ queryKey: chaves.tudo })
      void queryClient.invalidateQueries({ queryKey: chavesDaFesta.tudo })
    },
  })
}

export const useCriarOpcional = () => useEscritaDosOpcionais(criarOpcional)
export const useAlterarOpcional = () => useEscritaDosOpcionais(alterarOpcional)
export const useEncerrarOpcional = () => useEscritaDosOpcionais(encerrarOpcional)
export const useExcluirOpcional = () => useEscritaDosOpcionais(excluirOpcional)
