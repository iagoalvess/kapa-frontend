import type { FiltroDeCompras } from '../types/loja.types'

// A loja e a compra são públicas, e a chave leva o id da turma ou o token; a lista da Gestão é da
// turma da sessão, e trocar de formatura limpa o cache inteiro.
export const chaves = {
  loja: (formaturaId: string) => ['loja', 'vitrine', formaturaId] as const,
  compra: (token: string) => ['loja', 'compra', token] as const,
  /** Prefixo de tudo o que é da Gestão: a lista e o resumo mudam juntos. */
  gestao: ['loja', 'gestao'] as const,
  compras: (filtro: FiltroDeCompras) => ['loja', 'gestao', 'lista', filtro] as const,
  resumo: ['loja', 'gestao', 'resumo'] as const,
  /** A fila de pedidos de cancelamento (Sprint 38). */
  pedidos: ['loja', 'gestao', 'pedidos'] as const,
  convitesDaCompra: (compraId: string) => ['loja', 'gestao', 'convites', compraId] as const,
}
