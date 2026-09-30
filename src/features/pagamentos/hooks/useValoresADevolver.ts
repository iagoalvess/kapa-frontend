import { useQuery } from '@tanstack/react-query'
import { fecharValorADevolver, listarValoresADevolver, registrarDevolucao } from '../api/pagamentos.api'
import type { FiltroDeValoresADevolver } from '../types/pagamentos.types'
import { chaves } from './chaves'
import { useEscritaDaConferencia } from './useInformes'

/** Uma página da lista "a devolver". A anterior fica na tela enquanto a próxima chega. */
export function useValoresADevolver(filtro: FiltroDeValoresADevolver) {
  return useQuery({
    queryKey: chaves.valoresADevolver(filtro),
    queryFn: ({ signal }) => listarValoresADevolver(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/** A devolução com comprovante: a saída entra no caixa, então invalida o dinheiro todo, como a conferência. */
export const useRegistrarDevolucao = () => useEscritaDaConferencia(registrarDevolucao)

/** O fechamento do pago sem parcela. */
export const useFecharValorADevolver = () => useEscritaDaConferencia(fecharValorADevolver)
