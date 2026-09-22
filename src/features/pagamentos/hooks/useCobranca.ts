import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  informarPagamento,
  informarPagamentoEmLote,
  obterCobranca,
  obterCobrancaDeVarias,
} from '../api/pagamentos.api'
import type { CobrancaDaParcela, MeioDaCobranca, MeioDeRecebimento } from '../types/pagamentos.types'
import { chaves } from './chaves'

/**
 * Qual meio a pessoa está vendo agora, entre os que a turma aceita.
 *
 * Guarda só o nome do meio, e reencontra o item na lista a cada render: a cobrança é remontada a
 * cada consulta, e guardar o objeto deixaria na tela um QR de um valor que já mudou. Sem escolha —
 * e é o caso de toda turma com um meio só — vale o primeiro, então a tela nunca nasce vazia.
 *
 * @param cobranca A cobrança consultada; ausente enquanto carrega.
 */
export function useMeioEscolhido(cobranca?: CobrancaDaParcela) {
  const [escolhido, escolher] = useState<MeioDeRecebimento>()
  const meios = cobranca?.meios ?? []

  return [
    meios.find((item) => item.meio === escolhido) ?? meios[0],
    (meio: MeioDaCobranca) => escolher(meio.meio),
  ] as const
}

/**
 * A cobrança da parcela: os meios que a turma aceita e o valor de hoje.
 *
 * Sem poll e sem cache longo: o valor muda de um dia para o outro, e quem avisa que o pagamento foi
 * confirmado é o e-mail, não esta tela.
 *
 * @param parcelaId Parcela a cobrar.
 * @param habilitado Só com a parcela em aberto e sem aviso pendente.
 */
export function useCobranca(parcelaId: string, habilitado: boolean) {
  return useQuery({
    queryKey: chaves.cobranca(parcelaId),
    queryFn: ({ signal }) => obterCobranca(parcelaId, signal),
    enabled: habilitado,
  })
}

/**
 * A cobrança que cobre várias parcelas de uma vez, com a soma do valor de hoje de cada uma.
 *
 * @param parcelaIds As parcelas escolhidas na tela anterior; vazio não consulta.
 */
export function useCobrancaDeVarias(parcelaIds: string[]) {
  return useQuery({
    queryKey: chaves.cobrancaDeVarias(parcelaIds),
    queryFn: ({ signal }) => obterCobrancaDeVarias(parcelaIds, signal),
    enabled: parcelaIds.length > 0,
  })
}

/**
 * O "já paguei". A parcela devolvida — agora "em conferência" — vai direto para o cache, e o extrato
 * recarrega. A invalidação vai com `void`: devolvida, atrasaria o `onSuccess` de quem chamou.
 */
export function useInformarPagamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: informarPagamento,
    onSuccess: (parcela) => {
      queryClient.setQueryData(chaves.parcela(parcela.id), parcela)
      void queryClient.invalidateQueries({ queryKey: chaves.extrato() })
    },
  })
}

/** O mesmo aviso, para o pagamento que cobriu vários meses. Todas as parcelas voltam "em conferência". */
export function useInformarVariasParcelas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: informarPagamentoEmLote,
    onSuccess: (parcelas) => {
      for (const parcela of parcelas) queryClient.setQueryData(chaves.parcela(parcela.id), parcela)
      void queryClient.invalidateQueries({ queryKey: chaves.extrato() })
    },
  })
}
