import { api } from '@/lib/http/cliente'
import type { CobrancaDoPlano } from '@/types/assinatura'
import type { MeioDePagamento } from '@/types/pagamento'
import type { Assinatura, Checkout, CupomAplicavel, Troca } from '../types/assinaturas.types'

const BASE = '/api/v1/formaturas/atual/assinatura'

/** A assinatura mais recente da formatura selecionada. 404 `assinatura.nao_encontrada` se nunca contratou. */
export function obterAssinatura(signal?: AbortSignal) {
  return api.get<Assinatura>(BASE, { signal })
}

/**
 * Cria a sessão de pagamento no provedor e devolve a URL da página dele. Só o Presidente.
 *
 * Não ativa nada: quem ativa a turma é o webhook do provedor, quando o pagamento confirma. No cartão a página
 * cadastra a recorrência; no PIX, é o PIX do primeiro ciclo.
 */
export function iniciarCheckout({
  planoCodigo,
  meio,
  cupomCodigo,
}: {
  planoCodigo: string
  meio: MeioDePagamento
  cupomCodigo?: string
}) {
  return api.post<Checkout>(`${BASE}/checkout`, {
    body: { plano_codigo: planoCodigo, meio, cupom_codigo: cupomCodigo ?? null },
  })
}

/**
 * Confere o cupom antes do checkout (Sprint 51). Inexistente, vencido, esgotado e turma que já pagou respondem o
 * mesmo 400 `cupom.invalido`. Só o código vai para a API: o preço cobrado é sempre o do servidor.
 */
export function consultarCupom(codigo: string) {
  return api.get<CupomAplicavel>(`${BASE}/cupom/${encodeURIComponent(codigo.trim())}`)
}

/** Cancela a renovação. A vigência paga continua. Só o Presidente. */
export function cancelarAssinatura() {
  return api.post<Assinatura>(`${BASE}/cancelar`, { body: {} })
}

/**
 * Troca o plano da assinatura ativa, no mesmo ciclo. A subida devolve a página da diferença proporcional; a
 * descida vale na próxima renovação e devolve `url` nula.
 */
export function trocarPlano(planoCodigo: string) {
  return api.post<Troca>(`${BASE}/trocar-plano`, { body: { plano_codigo: planoCodigo } })
}

/** Troca o meio. Para o cartão devolve a página de autorização; para o PIX, `url` nula. */
export function trocarMeio(meio: MeioDePagamento) {
  return api.post<Troca>(`${BASE}/trocar-meio`, { body: { meio } })
}

/** A página do PIX da renovação — só no PIX avulso, a partir de 7 dias antes do vencimento. */
export function pagarCiclo() {
  return api.post<Checkout>(`${BASE}/pagar-ciclo`, { body: {} })
}

/** O histórico de pagamentos do plano. */
export function listarCobrancasDoPlano(signal?: AbortSignal) {
  return api.get<CobrancaDoPlano[]>(`${BASE}/cobrancas`, { signal })
}
