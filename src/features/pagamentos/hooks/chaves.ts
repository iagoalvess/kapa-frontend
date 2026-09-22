import type { FiltroDeInformes } from '../types/pagamentos.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['pagamentos'] as const,
  extrato: () => ['pagamentos', 'extrato'] as const,
  /** Sob `extrato`: quem invalida o extrato depois de um aviso já apaga o selo do menu junto. */
  pendencias: () => ['pagamentos', 'extrato', 'pendencias'] as const,
  parcela: (parcelaId: string) => ['pagamentos', 'parcela', parcelaId] as const,
  cobranca: (parcelaId: string) => ['pagamentos', 'cobranca', parcelaId] as const,
  cobrancaDeVarias: (parcelaIds: string[]) => ['pagamentos', 'cobranca', parcelaIds] as const,
  informes: (filtro: FiltroDeInformes) => ['pagamentos', 'informes', filtro] as const,
  divergencias: (filtro: FiltroDeInformes) => ['pagamentos', 'divergencias', filtro] as const,
}
