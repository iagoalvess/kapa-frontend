import { useQuery } from '@tanstack/react-query'
import { useComAtraso } from '@/hooks/useComAtraso'
import { simularPlano } from '../api/cobrancas.api'
import type { DadosDoItem } from '../types/cobrancas.types'
import { chaves } from './chaves'

/** O tempo parado depois da última tecla antes de simular de novo. */
export const ATRASO_DA_SIMULACAO = 400

/**
 * A grade de um formando, calculada pela API — nunca aqui.
 *
 * Reimplementar a conta no cliente garante que um dia ela discorde do servidor, e o que a
 * tesouraria confere deixa de ser o que o formando deve. O custo é uma ida à API por pausa na
 * digitação ({@link ATRASO_DA_SIMULACAO}); a grade anterior fica na tela enquanto a nova chega.
 *
 * @param planoId Plano simulado.
 * @param itens Os do formulário; ausente, simula os gravados. Lista vazia não consulta.
 */
export function useSimulacao(planoId: string, itens?: DadosDoItem[]) {
  const atrasados = useComAtraso(itens, ATRASO_DA_SIMULACAO)

  return useQuery({
    queryKey: chaves.simulacao(planoId, atrasados),
    queryFn: ({ signal }) => simularPlano(planoId, atrasados, signal),
    enabled: atrasados === undefined || atrasados.length > 0,
    placeholderData: (anterior) => anterior,
  })
}
