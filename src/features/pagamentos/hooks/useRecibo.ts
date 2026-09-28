import { useMutation, useQuery } from '@tanstack/react-query'
import { baixarRecibo } from '../api/pagamentos.api'
import { chaves } from './chaves'

/** O recibo sob demanda — o botão da linha, que abre numa aba nova. */
export const useAbrirRecibo = () =>
  useMutation({ mutationFn: (recebimentoId: string) => baixarRecibo(recebimentoId) })

/**
 * O recibo para a tela `/recibos/:id`, aonde o e-mail de pagamento confirmado leva.
 *
 * Nunca envelhece: o PDF é determinístico — o mesmo recebimento dá sempre o mesmo arquivo —, e o
 * estorno, que é a única coisa que o muda, desfaz o recibo inteiro.
 */
export function useRecibo(recebimentoId: string) {
  return useQuery({
    queryKey: chaves.recibo(recebimentoId),
    queryFn: ({ signal }) => baixarRecibo(recebimentoId, signal),
    staleTime: Infinity,
  })
}
