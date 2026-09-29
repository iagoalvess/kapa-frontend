import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  aprovarPedidoDeCancelamento,
  cancelarCompra,
  cancelarVendasDaFesta,
  listarConvitesDaCompra,
  listarPedidosDeCancelamento,
  marcarDevolvida,
  pedirCancelamento,
  recusarPedidoDeCancelamento,
} from '../api/loja.api'
import { chaves } from './chaves'

/**
 * Tudo o que o cancelamento mexe do lado da Gestão — lista, resumo, pedidos e convites — mora sob o
 * mesmo prefixo, e a escrita relê tudo de uma vez: cancelar muda a situação da compra, o que resta
 * a devolver e o arrecadado.
 */
function useReler() {
  const queryClient = useQueryClient()

  return () => void queryClient.invalidateQueries({ queryKey: chaves.gestao })
}

/** Os convites de uma compra, lidos só quando o diálogo de cancelar abre. */
export function useConvitesDaCompra(compraId: string, habilitado: boolean) {
  return useQuery({
    queryKey: chaves.convitesDaCompra(compraId),
    queryFn: ({ signal }) => listarConvitesDaCompra(compraId, signal),
    enabled: habilitado,
  })
}

/** Cancela convites de uma compra paga (Sprint 38, decisão 1). */
export function useCancelarCompra() {
  return useMutation({ mutationFn: cancelarCompra, onSuccess: useReler() })
}

/** Marca a compra devolvida, com o comprovante do PIX (decisão 2). */
export function useMarcarDevolvida() {
  return useMutation({ mutationFn: marcarDevolvida, onSuccess: useReler() })
}

/** Festa cancelada: todas as compras da loja vão para a lista a devolver (P6). */
export function useCancelarVendasDaFesta() {
  return useMutation({ mutationFn: cancelarVendasDaFesta, onSuccess: useReler() })
}

/** A fila de pedidos de cancelamento do comprador (P1). */
export function usePedidosDeCancelamento() {
  return useQuery({ queryKey: chaves.pedidos, queryFn: ({ signal }) => listarPedidosDeCancelamento(signal) })
}

/** Aprova um pedido de cancelamento. */
export function useAprovarPedido() {
  return useMutation({ mutationFn: aprovarPedidoDeCancelamento, onSuccess: useReler() })
}

/** Recusa um pedido de cancelamento, com motivo. */
export function useRecusarPedido() {
  return useMutation({ mutationFn: recusarPedidoDeCancelamento, onSuccess: useReler() })
}

/** O comprador pede o cancelamento pelo link; a resposta é a compra, já com o pedido. */
export function usePedirCancelamento(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pedirCancelamento,
    onSuccess: (compra) => queryClient.setQueryData(chaves.compra(token), compra),
  })
}
