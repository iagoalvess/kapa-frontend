import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cobrarParcela, listarHistorico, obterRegua, salvarRegua, testarRegra } from '../api/notificacoes.api'
import type { FiltroDeNotificacoes } from '../types/notificacoes.types'
import { chaves } from './chaves'

/** A régua da turma, com as variáveis e os limites que o editor precisa. */
export function useRegua() {
  return useQuery({
    queryKey: chaves.regua,
    queryFn: ({ signal }) => obterRegua(signal),
  })
}

/**
 * Grava a régua inteira e recarrega a linha do tempo.
 *
 * `void` na invalidação: devolver a promessa faria o React Query esperar o recarregamento antes do
 * `onSuccess` de quem chamou — e, se ele fechar o editor, o toast some junto.
 */
export function useSalvarRegua() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: salvarRegua,
    onSuccess: (regua) => {
      queryClient.setQueryData(chaves.regua, regua)
    },
  })
}

/** Manda o degrau com dados de exemplo para quem clicou. */
export function useTestarRegra() {
  return useMutation({ mutationFn: testarRegra })
}

/** Uma página do histórico. A anterior fica na tela enquanto a próxima chega. */
export function useHistorico(filtro: FiltroDeNotificacoes) {
  return useQuery({
    queryKey: chaves.historico(filtro),
    queryFn: ({ signal }) => listarHistorico(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/** O disparo avulso da tesouraria, da linha da parcela. */
export function useCobrarParcela() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cobrarParcela,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.todoHistorico })
    },
  })
}
