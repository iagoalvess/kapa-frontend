import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { informarPagamento, obterPix } from '../api/pagamentos.api'
import { chaves } from './chaves'

/**
 * O PIX da parcela, com a chave vigente e o valor de hoje.
 *
 * Sem poll e sem cache longo: o valor muda de um dia para o outro, e quem avisa que o pagamento foi
 * confirmado é o e-mail, não esta tela.
 *
 * @param habilitado Só com a parcela em aberto e sem aviso pendente.
 */
export function usePix(parcelaId: string, habilitado: boolean) {
  return useQuery({
    queryKey: chaves.pix(parcelaId),
    queryFn: ({ signal }) => obterPix(parcelaId, signal),
    enabled: habilitado,
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
