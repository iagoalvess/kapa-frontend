import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  baixarComprovante,
  confirmarInformes,
  listarDivergencias,
  listarInformes,
  recusarInforme,
} from '../api/pagamentos.api'
import type { FiltroDeInformes } from '../types/pagamentos.types'
import { chaves } from './chaves'

/** Uma página da fila da conferência. A anterior fica na tela enquanto a próxima chega. */
export function useInformes(filtro: FiltroDeInformes) {
  return useQuery({
    queryKey: chaves.informes(filtro),
    queryFn: ({ signal }) => listarInformes(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/** Quantos avisos esperam a tesouraria — o número do Início. Fila que ninguém vê é fila que cresce. */
export function usePendentesDeConferencia(habilitado: boolean) {
  const filtro: FiltroDeInformes = { status: 'Pendente', tamanho: 1 }

  return useQuery({
    queryKey: chaves.informes(filtro),
    queryFn: ({ signal }) => listarInformes(filtro, signal),
    enabled: habilitado,
    select: (pagina) => pagina.total,
  })
}

/** Uma página das divergências. */
export function useDivergencias(filtro: FiltroDeInformes, habilitado = true) {
  return useQuery({
    queryKey: chaves.divergencias(filtro),
    queryFn: ({ signal }) => listarDivergencias(filtro, signal),
    placeholderData: (anterior) => anterior,
    enabled: habilitado,
  })
}

/**
 * Toda escrita da conferência mexe em dinheiro que outras telas mostram — a fila, as divergências,
 * a lista de parcelas da gestão, o extrato. Invalida tudo: é raro, e cada feature só conhece as
 * próprias chaves. Com `void`, para não atrasar o `onSuccess` de quem chamou.
 */
export function useEscritaDaConferencia<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({ mutationFn: escrever, onSuccess: () => void queryClient.invalidateQueries() })
}

export const useConfirmarInformes = () => useEscritaDaConferencia(confirmarInformes)
export const useRecusarInforme = () => useEscritaDaConferencia(recusarInforme)

/** O comprovante de um aviso, como arquivo — quem chama abre numa aba. Leitura, mas sob demanda: um clique, uma ida. */
export const useAbrirComprovante = () => useMutation({ mutationFn: baixarComprovante })
