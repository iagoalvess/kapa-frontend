import type { FiltroDeInformes } from '../types/pagamentos.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['pagamentos'] as const,
  extrato: () => ['pagamentos', 'extrato'] as const,
  parcela: (parcelaId: string) => ['pagamentos', 'parcela', parcelaId] as const,
  pix: (parcelaId: string) => ['pagamentos', 'pix', parcelaId] as const,
  informes: (filtro: FiltroDeInformes) => ['pagamentos', 'informes', filtro] as const,
  divergencias: (filtro: FiltroDeInformes) => ['pagamentos', 'divergencias', filtro] as const,
}
