import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MEIOS_DE_PAGAMENTO } from '@/types/pagamento'
import { MEIOS } from '@/types/recebimento'
import {
  informarPagamento,
  informarPagamentoEmLote,
  obterCobranca,
  obterCobrancaDeVarias,
} from '../api/pagamentos.api'
import type { CobrancaDaParcela, MeioDaCobranca, PeloMercadoPago } from '../types/pagamentos.types'
import { chaves } from './chaves'

/**
 * Uma opção do passo 1: um meio do Mercado Pago da turma, que baixa sozinho, ou um da conta da comissão,
 * que o formando paga e avisa. Exatamente um dos dois vem preenchido.
 */
export type OpcaoDaCobranca =
  | { chave: string; rotulo: string; mercadoPago: PeloMercadoPago; comissao: null }
  | { chave: string; rotulo: string; mercadoPago: null; comissao: MeioDaCobranca }

/**
 * As opções da cobrança, na ordem da tela: as do Mercado Pago primeiro — baixam sozinhas —, depois as da
 * comissão.
 *
 * Com os dois PIX na lista, o da comissão vira "Chave PIX": duas pílulas "PIX" lado a lado não dizem
 * qual é qual.
 *
 * @param cobranca A cobrança consultada; ausente enquanto carrega.
 */
export function opcoesDaCobranca(cobranca?: CobrancaDaParcela): OpcaoDaCobranca[] {
  const peloMercadoPago = cobranca?.pelo_mercado_pago ?? []
  const doisPix = peloMercadoPago.some((item) => item.meio === 'Pix')

  return [
    ...peloMercadoPago.map((item) => ({
      chave: `mercado-pago:${item.meio}`,
      rotulo: MEIOS_DE_PAGAMENTO[item.meio].rotulo,
      mercadoPago: item,
      comissao: null,
    })),
    ...(cobranca?.meios ?? []).map((item) => ({
      chave: item.meio,
      rotulo: doisPix && item.meio === 'Pix' ? 'Chave PIX' : MEIOS[item.meio].rotulo,
      mercadoPago: null,
      comissao: item,
    })),
  ]
}

/**
 * Qual opção a pessoa está vendo agora, entre as que a cobrança oferece.
 *
 * Guarda só a chave, e reencontra o item na lista a cada render: a cobrança é remontada a cada
 * consulta, e guardar o objeto deixaria na tela um QR de um valor que já mudou. Sem escolha — e é o
 * caso de toda turma com um meio só — vale a primeira, então a tela nunca nasce vazia.
 *
 * @param cobranca A cobrança consultada; ausente enquanto carrega.
 */
export function useMeioEscolhido(cobranca?: CobrancaDaParcela) {
  const [escolhida, escolher] = useState<string>()
  const opcoes = opcoesDaCobranca(cobranca)

  return [opcoes.find((opcao) => opcao.chave === escolhida) ?? opcoes[0], escolher] as const
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
