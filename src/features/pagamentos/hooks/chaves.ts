import type { FiltroDeInformes, FiltroDeValoresADevolver } from '../types/pagamentos.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['pagamentos'] as const,
  extrato: () => ['pagamentos', 'extrato'] as const,
  /** Sob `extrato`: quem invalida o extrato depois de um aviso já apaga o selo do menu junto. */
  pendencias: () => ['pagamentos', 'extrato', 'pendencias'] as const,
  /** Sob `extrato` pelo mesmo motivo: o aviso e a baixa que mudam o extrato mudam a parcela do Início. */
  proximas: () => ['pagamentos', 'extrato', 'proximas'] as const,
  parcela: (parcelaId: string) => ['pagamentos', 'parcela', parcelaId] as const,
  cobranca: (parcelaId: string) => ['pagamentos', 'cobranca', parcelaId] as const,
  cobrancaDeVarias: (parcelaIds: string[]) => ['pagamentos', 'cobranca', parcelaIds] as const,
  informes: (filtro: FiltroDeInformes) => ['pagamentos', 'informes', filtro] as const,
  divergencias: (filtro: FiltroDeInformes) => ['pagamentos', 'divergencias', filtro] as const,
  recibo: (recebimentoId: string) => ['pagamentos', 'recibo', recebimentoId] as const,
  valoresADevolver: (filtro: FiltroDeValoresADevolver) => ['pagamentos', 'a-devolver', filtro] as const,
}
