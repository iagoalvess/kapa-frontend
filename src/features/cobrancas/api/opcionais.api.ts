import { api } from '@/lib/http/cliente'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  DadosDoOpcional,
  FiltroDePedidos,
  ItemDeCobranca,
  Opcional,
  Pedido,
  ResumoDoItemPedido,
} from '../types/cobrancas.types'

const OPCIONAIS = '/api/v1/cobrancas/opcionais'
const PEDIDOS = '/api/v1/pedidos'

/** Os itens que o formando pode pedir — a vitrine de "Meus pedidos". */
export function listarOpcionais(signal?: AbortSignal) {
  return api.get<Opcional[]>(OPCIONAIS, { signal })
}

/** Cadastra um item opcional no plano vigente. */
export function criarOpcional(dados: DadosDoOpcional) {
  return api.post<ItemDeCobranca>(OPCIONAIS, { body: dados })
}

/** Corrige um item opcional. */
export function alterarOpcional({ itemId, dados }: { itemId: string; dados: DadosDoOpcional }) {
  return api.put<ItemDeCobranca>(`${OPCIONAIS}/${itemId}`, { body: dados })
}

/** Encerra a venda: para de aceitar pedido, e o que já foi pedido fica. */
export function encerrarOpcional({ itemId }: { itemId: string }) {
  return api.post<ItemDeCobranca>(`${OPCIONAIS}/${itemId}/encerrar`)
}

/** Exclui um item que nunca foi pedido. Com pedido, a API devolve `cobranca.item_com_pedido`. */
export function excluirOpcional({ itemId }: { itemId: string }) {
  return api.delete<void>(`${OPCIONAIS}/${itemId}`)
}

/** Os pedidos do próprio formando. */
export function listarMeusPedidos(signal?: AbortSignal) {
  return api.get<Pedido[]>(`${PEDIDOS}/meus`, { signal })
}

/** Uma página dos pedidos da turma. */
export function listarPedidos(filtro: FiltroDePedidos, signal?: AbortSignal) {
  return api.get<Pagina<Pedido>>(PEDIDOS, {
    query: {
      ...paginacaoNaQuery(filtro),
      item_de_cobranca_id: filtro.item_de_cobranca_id,
      status: filtro.status,
      quitado: filtro.quitado,
      busca: filtro.busca,
    },
    signal,
  })
}

/** A conta aberta de cada item opcional — a faixa do topo da tela de Pedidos. */
export function resumirPedidos(signal?: AbortSignal) {
  return api.get<ResumoDoItemPedido[]>(`${PEDIDOS}/resumo`, { signal })
}

/**
 * Pede, reserva o estoque e grava as parcelas. A quantidade é absoluta; `parcelas` vai de 1 (à vista)
 * até o teto do item, e só vale no pedido novo.
 */
export function pedir({
  itemId,
  quantidade,
  parcelas,
  observacao,
}: {
  itemId: string
  quantidade: number
  parcelas: number
  /** O detalhe livre — tamanho da beca, nome no convite (Sprint 48, D26). */
  observacao?: string
}) {
  return api.post<Pedido>(PEDIDOS, {
    body: { item_de_cobranca_id: itemId, quantidade, parcelas, observacao: observacao || undefined },
  })
}

/** Muda a quantidade de um pedido próprio. Absoluta: repetir é um no-op. */
export function ajustarPedido({ pedidoId, quantidade }: { pedidoId: string; quantidade: number }) {
  return api.put<Pedido>(`${PEDIDOS}/${pedidoId}`, { body: { quantidade } })
}

/**
 * Cancela um pedido, pela tesouraria — ou, pelo formando, pede o cancelamento à comissão (Sprint 48, D8): o pedido
 * volta com `cancelamento_solicitado`.
 *
 * @param creditoEmCentavos Só a tesouraria, e só em pedido já pago: vai para a lista "a devolver" (Sprint 42).
 * @param motivo Por que o formando pede, se quiser dizer.
 */
export function cancelarPedido({
  pedidoId,
  creditoEmCentavos = 0,
  motivo,
}: {
  pedidoId: string
  creditoEmCentavos?: number
  motivo?: string
}) {
  return api.post<Pedido>(`${PEDIDOS}/${pedidoId}/cancelar`, {
    body: { credito_em_centavos: creditoEmCentavos, motivo: motivo || undefined },
  })
}

/**
 * Emite os convites de um pedido ainda em aberto (Sprint 21, P2). O endpoint é da festa; a ação mora
 * na tela de Pedidos, que é onde a Gestão vê quem pagou o quê.
 */
export function liberarConvites(dados: { pedido_id: string; motivo: string }) {
  return api.post<{ quantidade: number }>('/api/v1/festa/convites/liberar', { body: dados })
}
