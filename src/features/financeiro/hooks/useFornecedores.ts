import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarFornecedor,
  criarFornecedor,
  excluirFornecedor,
  listarFornecedores,
  obterFornecedor,
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
 * Não há endpoint de resumo de fornecedores como o de membros ou o de despesas: a contagem sai de
 * duas listas pedidas com `tamanho: 1`, das quais só se lê o `total`. São duas idas baratas, e o
 * cache as compartilha entre as trocas de filtro.
 */
export function useContagemDeFornecedores() {
  const ativos = useFornecedores({ ativo: true, tamanho: 1 })
  const inativos = useFornecedores({ ativo: false, tamanho: 1 })

  if (ativos.data === undefined || inativos.data === undefined) return undefined

  return {
    ativos: ativos.data.total,
    inativos: inativos.data.total,
    todos: ativos.data.total + inativos.data.total,
  }
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
