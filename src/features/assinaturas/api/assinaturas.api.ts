import { api } from '@/lib/http/cliente'
import type { Assinatura, Checkout } from '../types/assinaturas.types'

const BASE = '/api/v1/formaturas/atual/assinatura'

/** A assinatura mais recente da formatura selecionada. 404 `assinatura.nao_encontrada` se nunca contratou. */
export function obterAssinatura(signal?: AbortSignal) {
  return api.get<Assinatura>(BASE, { signal })
}

/**
 * Cria a sessão de pagamento no provedor e devolve a URL da página dele. Só o Presidente.
 *
 * Não ativa nada: quem ativa a turma é o webhook do provedor, quando o pagamento confirma.
 */
export function iniciarCheckout(planoCodigo: string) {
  return api.post<Checkout>(`${BASE}/checkout`, { body: { planoCodigo } })
}

/** Cancela a renovação. A vigência paga continua. Só o Presidente. */
export function cancelarAssinatura() {
  return api.post<Assinatura>(`${BASE}/cancelar`, { body: {} })
}
