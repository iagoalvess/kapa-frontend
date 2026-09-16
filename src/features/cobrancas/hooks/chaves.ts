import type { DadosDoItem, FiltroDeParcelas } from '../types/cobrancas.types'

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
}
