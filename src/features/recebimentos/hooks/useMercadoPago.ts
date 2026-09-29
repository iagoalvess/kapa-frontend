import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  autorizarMercadoPago,
  configurarCartao,
  configurarCobranca,
  desconectarMercadoPago,
  obterMercadoPago,
} from '../api/recebimentos.api'
import { chaves } from './chaves'

/** O Mercado Pago da turma. `data.provedor` nulo: ainda não conectou. */
export function useMercadoPago() {
  return useQuery({ queryKey: chaves.mercadoPago(), queryFn: ({ signal }) => obterMercadoPago(signal) })
}

/**
 * Começa a conexão: a API devolve a página de autorização do Mercado Pago, e o navegador vai para lá.
 * Volta sozinho para a tela da turma, com `?mercado_pago=conectado` — quem lê é o cartão.
 */
export function useConectarMercadoPago() {
  return useMutation({
    mutationFn: autorizarMercadoPago,
    onSuccess: ({ url }) => globalThis.location.assign(url),
  })
}

/** Desconecta: a turma volta a não ter Mercado Pago no cache. */
export function useDesconectarMercadoPago() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: desconectarMercadoPago,
    onSuccess: () => queryClient.setQueryData(chaves.mercadoPago(), { provedor: null }),
  })
}

/** Troca o modo de cobrança; a conexão que volta vai direto para o cache. */
export function useConfigurarCobranca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: configurarCobranca,
    onSuccess: (provedor) => queryClient.setQueryData(chaves.mercadoPago(), provedor),
  })
}

/** Liga ou desliga o cartão (Sprint 39); a conexão que volta vai direto para o cache. */
export function useConfigurarCartao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: configurarCartao,
    onSuccess: (provedor) => queryClient.setQueryData(chaves.mercadoPago(), provedor),
  })
}
