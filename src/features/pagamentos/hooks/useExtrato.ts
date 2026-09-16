import { useQuery } from '@tanstack/react-query'
import { vencidaSemAviso } from '@/types/cobranca'
import { obterExtrato, obterParcela } from '../api/pagamentos.api'
import { chaves } from './chaves'

/** O extrato do próprio formando: em aberto, a próxima a pagar e todas as parcelas. */
export function useExtrato() {
  return useQuery({ queryKey: chaves.extrato(), queryFn: ({ signal }) => obterExtrato(signal) })
}

/**
 * Quantas parcelas próprias venceram sem aviso de pagamento — o número no menu.
 *
 * Mesma chave de {@link useExtrato}: quem abre Minhas parcelas não busca de novo, e dar baixa
 * apaga o selo pela invalidação que já existe. Conta só a **vencida**, nunca a aberta — um selo
 * que fica aceso os três anos da turma é papel de parede.
 */
export function useParcelasVencidas() {
  return useQuery({
    queryKey: chaves.extrato(),
    queryFn: ({ signal }) => obterExtrato(signal),
    select: (extrato) => extrato.parcelas.filter(vencidaSemAviso).length,
  })
}

/**
 * Uma parcela, com o valor de hoje.
 *
 * @param habilitado O diálogo da baixa só lê quando abre.
 */
export function useParcela(parcelaId: string, habilitado = true) {
  return useQuery({
    queryKey: chaves.parcela(parcelaId),
    queryFn: ({ signal }) => obterParcela(parcelaId, signal),
    enabled: habilitado,
  })
}
