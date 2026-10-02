import { api } from '@/lib/http/cliente'
import type { CartaoTokenizado } from '@/types/pagamento'
import type { DadosDoConvidado, MeuConvite } from '@/types/festa'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  Compra,
  CompraCancelada,
  CompraCriada,
  CompraNaGestao,
  ConviteDaCompra,
  DadosDaCompra,
  FiltroDeCompras,
  Loja,
  PedidoNaGestao,
  ResumoDaLoja,
} from '../types/loja.types'

const LOJA = '/api/v1/loja'

// A loja e a compra são públicas: sem o token de quem por acaso está logado, e sem renovação à toa.
const PUBLICO = { autenticar: false } as const

/** A vitrine da loja da turma, com o relógio do servidor. */
export function buscarLoja(formaturaId: string, signal?: AbortSignal) {
  return api.get<Loja>(`${LOJA}/${formaturaId}`, { ...PUBLICO, signal })
}

/** Compra: reserva na hora e devolve o link da compra. A mesma chave devolve a mesma compra. */
export function comprar({ formaturaId, dados }: { formaturaId: string; dados: DadosDaCompra }) {
  return api.post<CompraCriada>(`${LOJA}/${formaturaId}/compras`, { ...PUBLICO, body: dados })
}

/** Reenvia o link das compras deste e-mail — 204 exista compra ou não. */
export function reenviarLink({ formaturaId, email }: { formaturaId: string; email: string }) {
  return api.post<void>(`${LOJA}/${formaturaId}/reenvio`, { ...PUBLICO, body: { email } })
}

/** A compra pelo link. */
export function buscarCompra(token: string, signal?: AbortSignal) {
  return api.get<Compra>(`${LOJA}/compras/${encodeURIComponent(token)}`, { ...PUBLICO, signal })
}

/**
 * Gera o documento da compra que ficou sem ele — o Mercado Pago falhou na hora da compra.
 * Idempotente: pedir de novo devolve o mesmo.
 */
export function gerarCobranca(token: string) {
  return api.post<Compra>(`${LOJA}/compras/${encodeURIComponent(token)}/cobranca`, PUBLICO)
}

/** Paga no cartão a compra pendente no cartão (Sprint 39). A compra volta como ficou — paga, na aprovação. */
export function pagarCompraNoCartao({
  token,
  cartao,
  valorEmCentavos,
}: {
  token: string
  cartao: CartaoTokenizado
  valorEmCentavos: number
}) {
  return api.post<Compra>(`${LOJA}/compras/${encodeURIComponent(token)}/cartao`, {
    ...PUBLICO,
    body: { ...cartao, valor_em_centavos: valorEmCentavos },
  })
}

/** Nomeia ou transfere um convite da compra. */
export function nomearConvidadoDaCompra({
  token,
  conviteId,
  dados,
}: {
  token: string
  conviteId: string
  dados: DadosDoConvidado
}) {
  return api.put<MeuConvite>(`${LOJA}/compras/${encodeURIComponent(token)}/convites/${conviteId}/convidado`, {
    ...PUBLICO,
    body: dados,
  })
}

/** Apaga nome, e-mail e CPF de quem comprou. Depois disso o link não abre mais. */
export function apagarDados(token: string) {
  return api.post<void>(`${LOJA}/compras/${encodeURIComponent(token)}/exclusao`, PUBLICO)
}

/** Uma página das compras da turma (Gestão). */
export function listarCompras(filtro: FiltroDeCompras, signal?: AbortSignal) {
  return api.get<Pagina<CompraNaGestao>>(`${LOJA}/compras`, {
    query: { ...paginacaoNaQuery(filtro), status: filtro.status, busca: filtro.busca },
    signal,
  })
}

/** O que vendeu, o que está preso esperando e o que falta devolver (Gestão). */
export function resumirLoja(signal?: AbortSignal) {
  return api.get<ResumoDaLoja>(`${LOJA}/compras/resumo`, { signal })
}

/** A lista em planilha, com os contatos — para a comissão devolver (P5). */
export function exportarCompras(filtro: Pick<FiltroDeCompras, 'status' | 'busca'>) {
  return api.get<Blob>(`${LOJA}/compras/planilha`, {
    query: { status: filtro.status, busca: filtro.busca },
    resposta: 'blob',
  })
}

/** Os convites de uma compra, válidos e cancelados — para a Gestão escolher o que cancelar (Sprint 38). */
export function listarConvitesDaCompra(compraId: string, signal?: AbortSignal) {
  return api.get<ConviteDaCompra[]>(`${LOJA}/compras/${compraId}/convites`, { signal })
}

/** Cancela convites de uma compra paga; sem `convite_ids`, todos os que ainda valem. */
export function cancelarCompra({
  compraId,
  conviteIds,
  motivo,
}: {
  compraId: string
  conviteIds: string[] | null
  motivo: string
}) {
  return api.post<CompraCancelada>(`${LOJA}/compras/${compraId}/cancelamento`, {
    body: { convite_ids: conviteIds, motivo },
  })
}

/** A comissão fez o PIX de volta: marca a compra devolvida, com o comprovante. */
export function marcarDevolvida({ compraId, comprovante }: { compraId: string; comprovante: File }) {
  const corpo = new FormData()
  corpo.append('comprovante', comprovante)

  return api.post<void>(`${LOJA}/compras/${compraId}/devolucao`, { body: corpo })
}

/** Os pedidos de cancelamento abertos, do mais antigo. */
export function listarPedidosDeCancelamento(signal?: AbortSignal) {
  return api.get<PedidoNaGestao[]>(`${LOJA}/pedidos-de-cancelamento`, { signal })
}

/** Aprova o pedido: os convites pedidos são cancelados. */
export function aprovarPedidoDeCancelamento(pedidoId: string) {
  return api.post<CompraCancelada>(`${LOJA}/pedidos-de-cancelamento/${pedidoId}/aprovacao`)
}

/** Recusa o pedido, com motivo — o comprador recebe por e-mail. */
export function recusarPedidoDeCancelamento({ pedidoId, motivo }: { pedidoId: string; motivo: string }) {
  return api.post<void>(`${LOJA}/pedidos-de-cancelamento/${pedidoId}/recusa`, { body: { motivo } })
}

/** O comprador pede à comissão o cancelamento de convites (P1); sem `convite_ids`, todos. */
export function pedirCancelamento({
  token,
  conviteIds,
  motivo,
}: {
  token: string
  conviteIds: string[] | null
  motivo: string | null
}) {
  return api.post<Compra>(`${LOJA}/compras/${encodeURIComponent(token)}/pedido-de-cancelamento`, {
    ...PUBLICO,
    body: { convite_ids: conviteIds, motivo },
  })
}
