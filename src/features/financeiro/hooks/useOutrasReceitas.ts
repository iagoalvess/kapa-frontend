import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chavesDaFesta } from '@/hooks/useItensDaFesta'
import {
  atualizarOutraReceita,
  cancelarOutraReceita,
  lancarOutraReceita,
  listarOutrasReceitas,
  receberOutraReceita,
  resumirOutrasReceitas,
} from '../api/financeiro.api'
import type { FiltroDeOutrasReceitas } from '../types/financeiro.types'
import { chaves } from './chaves'

/** Uma página das receitas da turma. */
export function useOutrasReceitas(filtro: FiltroDeOutrasReceitas) {
  return useQuery({
    queryKey: chaves.outrasReceitas(filtro),
    queryFn: ({ signal }) => listarOutrasReceitas(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/** Quantas e quanto em cada situação — a faixa e as pílulas, numa chamada só. */
export function useResumoDeOutrasReceitas(
  filtro: Omit<FiltroDeOutrasReceitas, 'status' | 'atrasadas' | 'pagina' | 'tamanho'>,
) {
  return useQuery({
    queryKey: chaves.resumoDeOutrasReceitas(filtro),
    queryFn: ({ signal }) => resumirOutrasReceitas(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/**
 * Toda escrita de receita derruba o que soma o arrecadado.
 *
 * A receita recebida entra no caixa, no gráfico do Início, no painel, no balancete e na meta da
 * festa (decisões 3 e 4 da Sprint 28) — e nenhuma dessas telas ficaria sabendo sem recarregar
 * aqui. O prefixo `financeiro` já cobre lista, caixa e arrecadação; relatórios e a meta vêm à parte.
 */
function useEscritaDeOutraReceita<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.tudo })
      void queryClient.invalidateQueries({ queryKey: ['relatorios'] })
      void queryClient.invalidateQueries({ queryKey: chavesDaFesta.meta })
    },
  })
}

export const useLancarOutraReceita = () => useEscritaDeOutraReceita(lancarOutraReceita)
export const useAtualizarOutraReceita = () => useEscritaDeOutraReceita(atualizarOutraReceita)
export const useReceberOutraReceita = () => useEscritaDeOutraReceita(receberOutraReceita)
export const useCancelarOutraReceita = () => useEscritaDeOutraReceita(cancelarOutraReceita)
