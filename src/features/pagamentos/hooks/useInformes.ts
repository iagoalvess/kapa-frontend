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
 * As quatro raízes de cache que uma baixa mexe: a conferência e o extrato (`pagamentos`), as
 * parcelas da gestão (`cobrancas`), o caixa (`financeiro`) e o balancete (`relatorios`).
 *
 * Por prefixo de string, como o aceite do termo derruba `cobrancas`: é o único contato com as
 * outras features, e não importa nada delas. Antes era `invalidateQueries()` sem chave — e aí cada
 * confirmação recarregava também a sessão inteira da moldura (aceites, formatura, plano, adesão,
 * avisos, foto), que nenhuma baixa muda.
 */
const RAIZES_DO_DINHEIRO = [['pagamentos'], ['cobrancas'], ['financeiro'], ['relatorios']]

/**
 * Toda escrita da conferência mexe em dinheiro que outras telas mostram — a fila, as divergências,
 * a lista de parcelas da gestão, o extrato. Com `void`, para não atrasar o `onSuccess` de quem
 * chamou.
 */
export function useEscritaDaConferencia<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      for (const queryKey of RAIZES_DO_DINHEIRO) void queryClient.invalidateQueries({ queryKey })
    },
  })
}

export const useConfirmarInformes = () => useEscritaDaConferencia(confirmarInformes)
export const useRecusarInforme = () => useEscritaDaConferencia(recusarInforme)

/** O comprovante de um aviso, como arquivo — quem chama abre numa aba. Leitura, mas sob demanda: um clique, uma ida. */
export const useAbrirComprovante = () => useMutation({ mutationFn: baixarComprovante })
