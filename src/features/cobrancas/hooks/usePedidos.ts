import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chavesDaFesta } from '@/hooks/useItensDaFesta'
import { chavesDosConvites } from '@/hooks/useResumoDosConvites'
import {
  ajustarPedido,
  cancelarPedido,
  liberarConvites,
  listarMeusPedidos,
  listarPedidos,
  pedir,
  resumirPedidos,
} from '../api/opcionais.api'
import type { FiltroDePedidos, Pedido } from '../types/cobrancas.types'
import { chaves } from './chaves'

/**
 * Os pedidos do próprio formando.
 *
 * @param habilitado Falso não consulta — a vitrine só pergunta onde ela aparece.
 */
export function useMeusPedidos(habilitado = true) {
  return useQuery({
    queryKey: chaves.meusPedidos,
    queryFn: ({ signal }) => listarMeusPedidos(signal),
    enabled: habilitado,
  })
}

/** Uma página dos pedidos da turma — a tela que mostra **quem** pediu. */
export function usePedidos(filtro: FiltroDePedidos) {
  return useQuery({
    queryKey: chaves.pedidos(filtro),
    queryFn: ({ signal }) => listarPedidos(filtro, signal),
  })
}

/** A conta aberta de cada item: pedidos, unidades, quitadas e o que resta. */
export function useResumoDosPedidos() {
  return useQuery({ queryKey: chaves.resumoDosPedidos, queryFn: ({ signal }) => resumirPedidos(signal) })
}

/**
 * Toda escrita de pedido derruba o que é de cobrança e o cartão da festa.
 *
 * O pedido consome estoque (a vitrine e o resumo) e, quando o item está ligado a um item da festa,
 * muda o custo do cartão de lá (decisão 11). Diminuir ou cancelar um pedido de convite extra revoga
 * convites (Sprint 21, decisão 8), então os convites também caem — é o mesmo acoplamento de cache que `financeiro` já
 * tem com a festa ao lançar despesa, e por isso a chave dela mora em `hooks/`.
 *
 * O **extrato** não entra aqui: ele é de `pagamentos`, e uma feature não importa de outra. Quem o
 * recarrega é a tela que hospeda a vitrine, pelo `aoPedir` — é lá que as duas se encontram.
 */
function useEscritaDePedido<T>(escrever: (variaveis: T) => Promise<Pedido>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.tudo })
      void queryClient.invalidateQueries({ queryKey: chavesDaFesta.tudo })
      void queryClient.invalidateQueries({ queryKey: chavesDosConvites.tudo })
    },
  })
}

export const usePedir = () => useEscritaDePedido(pedir)
export const useAjustarPedido = () => useEscritaDePedido(ajustarPedido)
export const useCancelarPedido = () => useEscritaDePedido(cancelarPedido)

/**
 * Emite os convites de um pedido de convite extra antes da quitação — "paga o resto na porta"
 * (Sprint 21, P2). Da Gestão, com motivo, e fica na auditoria.
 */
export function useLiberarConvites() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: liberarConvites,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chavesDosConvites.tudo })
    },
  })
}
