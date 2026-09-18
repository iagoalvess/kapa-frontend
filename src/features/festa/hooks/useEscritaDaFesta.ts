import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chavesDaFesta } from '@/hooks/useItensDaFesta'
import {
  atualizarItemDaFesta,
  cancelarItemDaFesta,
  criarItemDaFesta,
  excluirItemDaFesta,
  reativarItemDaFesta,
} from '../api/festa.api'

/**
 * Toda escrita da festa derruba a lista de itens e a meta.
 *
 * A meta é a soma dos itens: criar, corrigir, cancelar ou excluir um muda o custo da festa e, com
 * ele, a barra da Página Inicial. Invalidar o prefixo inteiro é mais barato do que lembrar, em cada
 * mutação, quais das duas consultas mudaram — e errar uma delas deixa a barra mentindo.
 */
function useEscritaDaFesta<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chavesDaFesta.tudo })
    },
  })
}

/** Cria um item no fim da lista. */
export function useCriarItem() {
  return useEscritaDaFesta(criarItemDaFesta)
}

/** Corrige um item. */
export function useAtualizarItem() {
  return useEscritaDaFesta(atualizarItemDaFesta)
}

/** A turma desistiu do item. */
export function useCancelarItem() {
  return useEscritaDaFesta(cancelarItemDaFesta)
}

/** Desfaz o cancelamento. */
export function useReativarItem() {
  return useEscritaDaFesta(reativarItemDaFesta)
}

/** Exclui um item sem despesa. */
export function useExcluirItem() {
  return useEscritaDaFesta(excluirItemDaFesta)
}
