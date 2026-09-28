import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cobrarParcela, listarHistorico, definirRegra, obterRegua } from '../api/notificacoes.api'
import type { FiltroDeNotificacoes } from '../types/notificacoes.types'
import { chaves } from './chaves'

/** A régua da turma. */
export function useRegua() {
  return useQuery({
    queryKey: chaves.regua,
    queryFn: ({ signal }) => obterRegua(signal),
  })
}

/** Liga ou desliga um degrau. A resposta já é a régua nova, e vai direto para o cache. */
export function useDefinirRegra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: definirRegra,
    onSuccess: (regua) => {
      queryClient.setQueryData(chaves.regua, regua)
    },
  })
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
