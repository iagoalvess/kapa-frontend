import { api } from '@/lib/http/cliente'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  ConfirmacaoDeInforme,
  Divergencia,
  Extrato,
  FiltroDeInformes,
  FormaDePagamento,
  Informe,
  Parcela,
  PendenciasDoExtrato,
  PixDaParcela,
  ResultadoDaConferencia,
} from '../types/pagamentos.types'

const BASE = '/api/v1'

/** O dia, o valor e o comprovante opcional — o corpo multipart do "já paguei" e da baixa manual. */
export interface DadosDoPagamento {
  /** `aaaa-mm-dd`. */
  pago_em: string
  valor_em_centavos: number
  comprovante?: File
}

const formulario = (
  { pago_em, valor_em_centavos, comprovante }: DadosDoPagamento,
  extras: Record<string, string> = {},
) => {
  const corpo = new FormData()
  corpo.set('pago_em', pago_em)
  corpo.set('valor_em_centavos', String(valor_em_centavos))
  for (const [chave, valor] of Object.entries(extras)) corpo.set(chave, valor)
  if (comprovante) corpo.set('comprovante', comprovante)
  return corpo
}

/** O extrato do próprio formando. */
export function obterExtrato(signal?: AbortSignal) {
  return api.get<Extrato>(`${BASE}/extrato/eu`, { signal })
}

/**
 * Quantas parcelas próprias venceram sem aviso de pagamento — o selo do menu.
 *
 * Endpoint próprio, e não uma conta sobre o extrato: o selo está na barra lateral de toda tela, e o
 * extrato de quem está no fim da turma passa de dezenas de parcelas.
 */
export function obterPendenciasDoExtrato(signal?: AbortSignal) {
  return api.get<PendenciasDoExtrato>(`${BASE}/extrato/eu/pendencias`, { signal })
}

/** Uma parcela, com o valor de hoje. O dono, ou a gestão. */
export function obterParcela(parcelaId: string, signal?: AbortSignal) {
  return api.get<Parcela>(`${BASE}/parcelas/${parcelaId}`, { signal })
}

/** O PIX da parcela: a chave vigente e o valor de hoje. */
export function obterPix(parcelaId: string, signal?: AbortSignal) {
  return api.get<PixDaParcela>(`${BASE}/parcelas/${parcelaId}/pix`, { signal })
}

/**
 * O PIX de várias parcelas: um BR Code só, com a soma do que elas cobram hoje.
 *
 * Um QR por parcela viraria um PIX pela metade: quem paga no celular paga o primeiro e fecha a tela.
 */
export function obterPixDeVarias(parcelaIds: string[], signal?: AbortSignal) {
  return api.get<PixDaParcela>(`${BASE}/parcelas/pix`, { query: { parcela_ids: parcelaIds }, signal })
}

/** O "já paguei". A parcela não muda até a tesouraria conferir. */
export function informarPagamento({ parcelaId, ...dados }: DadosDoPagamento & { parcelaId: string }) {
  return api.post<Parcela>(`${BASE}/parcelas/${parcelaId}/informes`, { body: formulario(dados) })
}

/**
 * O "já paguei" de um PIX que cobriu várias parcelas — os meses atrasados de uma vez.
 *
 * O valor total é distribuído pela API, da parcela mais antiga para a mais nova. O comprovante é um
 * só: foi um pagamento só.
 */
export function informarPagamentoEmLote({
  parcela_ids,
  ...dados
}: DadosDoPagamento & { parcela_ids: string[] }) {
  const corpo = formulario(dados)
  for (const id of parcela_ids) corpo.append('parcela_ids', id)

  return api.post<Parcela[]>(`${BASE}/parcelas/informes`, { body: corpo })
}

/** A fila da conferência: pendentes do mais antigo ao mais novo. */
export function listarInformes(filtro: FiltroDeInformes, signal?: AbortSignal) {
  return api.get<Pagina<Informe>>(`${BASE}/informes`, {
    query: {
      ...paginacaoNaQuery(filtro),
      status: filtro.status,
      conferidos_hoje: filtro.conferidos_hoje,
      busca: filtro.busca,
      de: filtro.de,
      ate: filtro.ate,
    },
    signal,
  })
}

/** O comprovante de um informe, para abrir numa aba. */
export function baixarComprovante(informe_id: string) {
  return api.get<Blob>(`${BASE}/informes/${informe_id}/comprovante`, { resposta: 'blob' })
}

/** Confirma o lote numa transação. */
export function confirmarInformes(itens: ConfirmacaoDeInforme[]) {
  return api.post<ResultadoDaConferencia>(`${BASE}/informes/confirmar`, { body: { itens } })
}

/** Recusa um informe, com motivo; o formando recebe por e-mail. */
export function recusarInforme({ informe_id, motivo }: { informe_id: string; motivo: string }) {
  return api.post<void>(`${BASE}/informes/${informe_id}/recusar`, { body: { motivo } })
}

/** Baixa a parcela sem informe — dinheiro, TED, quem pagou e não avisou. */
export function baixarManualmente({
  parcelaId,
  forma,
  ...dados
}: DadosDoPagamento & { parcelaId: string; forma: FormaDePagamento }) {
  return api.post<Parcela>(`${BASE}/parcelas/${parcelaId}/baixa-manual`, {
    body: formulario(dados, { forma }),
  })
}

/** Desfaz a baixa, com justificativa. Só o Presidente. */
export function estornarBaixa({ parcelaId, justificativa }: { parcelaId: string; justificativa: string }) {
  return api.post<Parcela>(`${BASE}/parcelas/${parcelaId}/estornar-baixa`, { body: { justificativa } })
}

/** As baixas com recebido diferente do devido. */
export function listarDivergencias(filtro: FiltroDeInformes, signal?: AbortSignal) {
  return api.get<Pagina<Divergencia>>(`${BASE}/recebimentos/divergencias`, {
    query: { ...paginacaoNaQuery(filtro), busca: filtro.busca },
    signal,
  })
}
