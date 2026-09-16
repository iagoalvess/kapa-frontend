import { useMutation, useQuery } from '@tanstack/react-query'
import { lembrar, listarSituacoes, obterResumo } from '../api/adesoes.api'
import type { FiltroDeAdesoes } from '../types/adesoes.types'
import { chaves } from './chaves'

/** Uma página de quem aderiu e quem falta. A anterior fica na tela enquanto a próxima chega. */
export function useSituacoes(filtro: FiltroDeAdesoes) {
  return useQuery({
    queryKey: chaves.situacao(filtro),
    queryFn: ({ signal }) => listarSituacoes(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/** Quantos aderiram, de quantos — o número que a comissão olha toda semana. */
export function useResumoDeAdesoes() {
  return useQuery({ queryKey: chaves.resumo(), queryFn: ({ signal }) => obterResumo(signal) })
}

/** Lembrete por e-mail. Não muda nada na tela: quem foi lembrado continua faltando. */
export function useLembrar() {
  return useMutation({ mutationFn: lembrar })
}
