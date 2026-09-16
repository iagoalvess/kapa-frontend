import { useQuery } from '@tanstack/react-query'
import { obterCaixa, obterProjecao } from '../api/financeiro.api'
import { chaves } from './chaves'

/** O caixa de hoje: arrecadado, gasto, saldo, a receber e o quadro por categoria. */
export function useCaixa() {
  return useQuery({ queryKey: chaves.consolidado, queryFn: ({ signal }) => obterCaixa(signal) })
}

/** O fluxo mês a mês: realizado até hoje, projetado até a colação. */
export function useProjecao() {
  return useQuery({ queryKey: chaves.projecao, queryFn: ({ signal }) => obterProjecao(signal) })
}
