import { useQuery } from '@tanstack/react-query'
import { obterExtrato, obterParcela, obterPendenciasDoExtrato } from '../api/pagamentos.api'
import { chaves } from './chaves'

/** O extrato do próprio formando: em aberto, a próxima a pagar e todas as parcelas. */
/**
 * O extrato do próprio formando.
 *
 * @param acompanhar Pagando várias parcelas por um meio que baixa sozinho: relê até elas mudarem.
 */
export function useExtrato(acompanhar = false) {
  return useQuery({
    queryKey: chaves.extrato(),
    queryFn: ({ signal }) => obterExtrato(signal),
    refetchInterval: acompanhar ? INTERVALO_DE_ACOMPANHAMENTO : false,
  })
}

/**
 * Quantas parcelas próprias venceram sem aviso de pagamento — o número no menu.
 *
 * Consulta própria, e não uma conta sobre {@link useExtrato}: este número aparece na barra lateral
 * de **toda** tela do app, e o extrato de quem está no fim da turma passa dos 16 KB. Quem conta é a
 * API — a regra ("vencida, e ninguém avisou") vive uma vez, lá.
 *
 * A chave mora sob a do extrato: a invalidação que já existe depois de um aviso apaga o selo junto.
 */
export function useParcelasVencidas() {
  return useQuery({
    queryKey: chaves.pendencias(),
    queryFn: ({ signal }) => obterPendenciasDoExtrato(signal),
    select: (pendencias) => pendencias.vencidas_sem_aviso,
  })
}

/**
 * Uma parcela, com o valor de hoje.
 *
 * @param habilitado O diálogo da baixa só lê quando abre.
 * @param acompanhar Pagando por um meio que baixa sozinho (Sprint 25): relê a cada poucos segundos, e a
 *   tela vira "paga" sem o formando recarregar.
 */
export function useParcela(parcelaId: string, habilitado = true, acompanhar = false) {
  return useQuery({
    queryKey: chaves.parcela(parcelaId),
    queryFn: ({ signal }) => obterParcela(parcelaId, signal),
    enabled: habilitado,
    refetchInterval: acompanhar ? INTERVALO_DE_ACOMPANHAMENTO : false,
  })
}

/** De quanto em quanto tempo a tela do PIX automático relê a parcela. */
export const INTERVALO_DE_ACOMPANHAMENTO = 5000
