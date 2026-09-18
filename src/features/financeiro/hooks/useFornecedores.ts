import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarFornecedor,
  criarFornecedor,
  excluirFornecedor,
  listarFornecedores,
  obterFornecedor,
  resumirFornecedores,
} from '../api/financeiro.api'
import type { FiltroDeFornecedores } from '../types/financeiro.types'
import { chaves } from './chaves'

/** Uma página do cadastro. A anterior fica na tela enquanto a próxima chega. */
export function useFornecedores(filtro: FiltroDeFornecedores, habilitado = true) {
  return useQuery({
    queryKey: chaves.fornecedores(filtro),
    queryFn: ({ signal }) => listarFornecedores(filtro, signal),
    placeholderData: (anterior) => anterior,
    enabled: habilitado,
  })
}

/**
 * Quantos fornecedores em cada situação, para o número nas pílulas.
 *
 * Uma consulta agrupada na API. Até 17/09/2026 eram duas listas pedidas com `tamanho: 1` das quais
 * só se lia o `total` — o que não havia era o endpoint de resumo, e agora há.
 */
export function useContagemDeFornecedores() {
  const { data } = useQuery({
    queryKey: chaves.resumoDeFornecedores,
    queryFn: ({ signal }) => resumirFornecedores(signal),
  })

  return data && { ...data, todos: data.ativos + data.inativos }
}

/** Um fornecedor, para a tela de detalhe. */
export function useFornecedor(id: string) {
  return useQuery({
    queryKey: chaves.fornecedor(id),
    queryFn: ({ signal }) => obterFornecedor(id, signal),
    enabled: !!id,
  })
}

/**
 * Toda escrita do cadastro derruba as listas de fornecedor e as de despesa.
 *
 * A despesa mostra o nome do fornecedor: renomear ou desativar um deixa a lista desatualizada se
 * ela não recarregar junto.
 */
function useEscritaDeFornecedor<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.todosOsFornecedores })
      void queryClient.invalidateQueries({ queryKey: chaves.todasAsDespesas })
    },
  })
}

export const useCriarFornecedor = () => useEscritaDeFornecedor(criarFornecedor)
export const useAtualizarFornecedor = () => useEscritaDeFornecedor(atualizarFornecedor)
export const useExcluirFornecedor = () => useEscritaDeFornecedor(excluirFornecedor)
