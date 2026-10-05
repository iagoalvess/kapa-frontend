import type { DadosDoItem, FiltroDeParcelas, FiltroDePedidos } from '../types/cobrancas.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['cobrancas'] as const,
  planos: () => ['cobrancas', 'planos'] as const,
  plano: (planoId: string) => ['cobrancas', 'plano', planoId] as const,
  /** Prefixo de toda simulação: mudar o plano derruba as prévias de uma vez. */
  simulacoes: ['cobrancas', 'simulacao'] as const,
  simulacao: (planoId: string, itens?: DadosDoItem[]) =>
    ['cobrancas', 'simulacao', planoId, itens ?? null] as const,
  /** Prefixo de toda lista de parcelas: repactuar ou encerrar muda valores e situações. */
  todasAsParcelas: ['cobrancas', 'parcelas'] as const,
  parcelas: (filtro: FiltroDeParcelas) => ['cobrancas', 'parcelas', filtro] as const,
  resumo: (filtro: Omit<FiltroDeParcelas, 'status' | 'pagina' | 'tamanho'>) =>
    ['cobrancas', 'parcelas', 'resumo', filtro] as const,
  /** A vitrine do formando: o que ele pode pedir hoje. */
  opcionais: ['cobrancas', 'opcionais'] as const,
  /** Prefixo de tudo o que é pedido: pedir, ajustar e cancelar mexem na lista, no resumo e nos meus. */
  todosOsPedidos: ['cobrancas', 'pedidos'] as const,
  meusPedidos: ['cobrancas', 'pedidos', 'meus'] as const,
  pedidos: (filtro: FiltroDePedidos) => ['cobrancas', 'pedidos', 'lista', filtro] as const,
  resumoDosPedidos: ['cobrancas', 'pedidos', 'resumo'] as const,
  /** A fila de solicitações de cancelamento (Sprint 48). Fica sob o prefixo: responder mexe em pedidos e parcelas. */
  solicitacoes: (status?: string) => ['cobrancas', 'solicitacoes', status ?? null] as const,
  lancamentos: ['cobrancas', 'lancamentos'] as const,
  alcanceDoPreco: (planoId: string, itemId: string, valor: number) =>
    ['cobrancas', 'alcance-do-preco', planoId, itemId, valor] as const,
  alcanceDoRateio: (planoId: string, alvo: string[], valor: number) =>
    ['cobrancas', 'alcance-do-rateio', planoId, alvo, valor] as const,
}
