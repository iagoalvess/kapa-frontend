import { useMutation } from '@tanstack/react-query'
import { iniciarCheckout } from '../api/assinaturas.api'

/**
 * Inicia o checkout e leva o navegador à página do provedor.
 *
 * Checkout hospedado: nenhum dado de cartão passa por esta aplicação. A volta é por
 * `/assinatura/retorno`, que só mostra "processando" — quem ativa a turma é o webhook.
 */
export function useCheckout() {
  return useMutation({
    mutationFn: iniciarCheckout,
    onSuccess: ({ url }) => globalThis.location.assign(url),
  })
}
