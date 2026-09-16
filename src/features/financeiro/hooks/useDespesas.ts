import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarDespesa,
  baixarComprovante,
  cancelarDespesa,
  lancarDespesa,
  listarDespesas,
  obterDespesa,
  pagarDespesa,
  resumirDespesas,
} from '../api/financeiro.api'
import type { FiltroDeDespesas } from '../types/financeiro.types'
import { chaves } from './chaves'

/** Uma página das despesas da turma. */
export function useDespesas(filtro: FiltroDeDespesas) {
  return useQuery({
    queryKey: chaves.despesas(filtro),
    queryFn: ({ signal }) => listarDespesas(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/** Uma despesa, para a tela de detalhe. */
export function useDespesa(id: string) {
  return useQuery({
    queryKey: chaves.despesa(id),
    queryFn: ({ signal }) => obterDespesa(id, signal),
    enabled: !!id,
  })
}

/**
 * Quantas despesas venceram e não foram pagas — o número no menu.
 *
 * Mesma chave do resumo sem filtro, então a tela Despesas aberta não busca de novo, e pagar uma
 * despesa apaga o selo pela invalidação que já existe. Atraso é anomalia: o número normal é zero,
 * e é isso que dá sentido a ele no menu — "A pagar", que nunca zera, ficaria só de enfeite.
 *
 * @param habilitado Só a Tesouraria paga despesa; para os demais o selo não é ação nenhuma.
 */
export function useDespesasAtrasadas(habilitado: boolean) {
  return useQuery({
    queryKey: chaves.resumo({}),
    queryFn: ({ signal }) => resumirDespesas({}, signal),
    enabled: habilitado,
    select: (resumo) => resumo.atrasada.quantidade,
  })
}

/** Quantas e quanto em cada situação — a faixa e as pílulas, numa chamada só. */
export function useResumoDeDespesas(filtro: Omit<FiltroDeDespesas, 'status' | 'pagina' | 'tamanho'>) {
  return useQuery({
    queryKey: chaves.resumo(filtro),
    queryFn: ({ signal }) => resumirDespesas(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/**
 * Toda escrita de despesa derruba as listas e o caixa.
 *
 * O caixa é agregação (decisão 1 da Sprint 10): pagar uma despesa muda o saldo, e nada avisaria a
 * tela do caixa se ela não recarregasse aqui.
 */
function useEscritaDeDespesa<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.todasAsDespesas })
      void queryClient.invalidateQueries({ queryKey: chaves.caixa })
      void queryClient.invalidateQueries({ queryKey: chaves.todosOsFornecedores })
    },
  })
}

export const useLancarDespesa = () => useEscritaDeDespesa(lancarDespesa)
export const useAtualizarDespesa = () => useEscritaDeDespesa(atualizarDespesa)
export const usePagarDespesa = () => useEscritaDeDespesa(pagarDespesa)
export const useCancelarDespesa = () => useEscritaDeDespesa(cancelarDespesa)

/** Abre o comprovante de uma despesa. Não mexe em cache: é só leitura de arquivo. */
export const useAbrirComprovante = () => useMutation({ mutationFn: baixarComprovante })
