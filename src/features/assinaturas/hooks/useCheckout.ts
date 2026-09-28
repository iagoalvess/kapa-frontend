import { useMutation } from '@tanstack/react-query'
import { iniciarCheckout, pagarCiclo } from '../api/assinaturas.api'

/** Leva o navegador à página do Mercado Pago. Fora do React: a navegação sai do app. */
export function irParaOProvedor(url: string) {
  globalThis.location.assign(url)
}

/**
 * Inicia o checkout e leva o navegador à página do provedor.
 *
 * Checkout hospedado: nenhum dado de cartão passa por esta aplicação. A volta é por
 * `/assinatura/retorno`, que só mostra "processando" — quem ativa a turma é o webhook.
 */
export function useCheckout() {
  return useMutation({
    mutationFn: iniciarCheckout,
    onSuccess: ({ url }) => irParaOProvedor(url),
  })
}

/** Abre a página do PIX da renovação (Sprint 37) — só no PIX avulso, a partir de 7 dias antes do vencimento. */
export function usePagarCiclo() {
  return useMutation({
    mutationFn: pagarCiclo,
    onSuccess: ({ url }) => irParaOProvedor(url),
  })
}
