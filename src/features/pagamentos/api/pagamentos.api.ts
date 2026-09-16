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

/** Uma parcela, com o valor de hoje. O dono, ou a gestão. */
export function obterParcela(parcelaId: string, signal?: AbortSignal) {
  return api.get<Parcela>(`${BASE}/parcelas/${parcelaId}`, { signal })
}

/** O PIX da parcela: a chave vigente e o valor de hoje. */
export function obterPix(parcelaId: string, signal?: AbortSignal) {
  return api.get<PixDaParcela>(`${BASE}/parcelas/${parcelaId}/pix`, { signal })
}

/** O "já paguei". A parcela não muda até a tesouraria conferir. */
export function informarPagamento({ parcelaId, ...dados }: DadosDoPagamento & { parcelaId: string }) {
  return api.post<Parcela>(`${BASE}/parcelas/${parcelaId}/informes`, { body: formulario(dados) })
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
