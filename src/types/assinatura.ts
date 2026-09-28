import type { MeioDePagamento } from './pagamento'

/** Situação da assinatura. Espelha `StatusDaAssinatura`. */
export type StatusDaAssinatura = 'Pendente' | 'Ativa' | 'Vencida' | 'Cancelada'

/**
 * O nome e a cor de cada situação da assinatura.
 *
 * Mora aqui porque a tela da assinatura (feature `assinaturas`) e o painel de suporte (feature
 * `suporte`) mostram o mesmo status — e cada uma tinha o seu mapa, com "Pendente" num e "Aguardando
 * pagamento" no outro para a mesma assinatura.
 */
export const APARENCIA_DA_ASSINATURA = {
  Pendente: { rotulo: 'Aguardando pagamento', tom: 'alerta' },
  Ativa: { rotulo: 'Ativa', tom: 'sucesso' },
  Vencida: { rotulo: 'Vencida', tom: 'perigo' },
  Cancelada: { rotulo: 'Renovação cancelada', tom: 'neutro' },
} as const satisfies Record<StatusDaAssinatura, { rotulo: string; tom: string }>

/** Situação de um pagamento do plano. Espelha `SituacaoDaCobrancaDoPlano`. */
export type SituacaoDaCobrancaDoPlano = 'Aberta' | 'Paga' | 'Cancelada' | 'Estornada'

/**
 * Um pagamento do plano: o PIX de um ciclo, o débito do cartão ou a diferença da subida de plano. Espelha
 * `CobrancaDoPlanoDTO` (Sprint 37).
 *
 * Mora aqui, e não na feature, porque a tela da assinatura mostra o histórico e o painel de suporte estorna a
 * partir da mesma lista.
 */
export interface CobrancaDoPlano {
  id: string
  plano_nome: string
  motivo: 'Ciclo' | 'Diferenca'
  meio: MeioDePagamento
  valor_em_centavos: number
  situacao: SituacaoDaCobrancaDoPlano
  /** A página do Mercado Pago, enquanto aberta. */
  url: string | null
  criada_em: string
  paga_em: string | null
  valor_estornado_em_centavos: number | null
  estornada_em: string | null
}

/** O nome e a cor de cada situação do pagamento do plano. */
export const APARENCIA_DA_COBRANCA = {
  Aberta: { rotulo: 'Aguardando pagamento', tom: 'alerta' },
  Paga: { rotulo: 'Paga', tom: 'sucesso' },
  Cancelada: { rotulo: 'Cancelada', tom: 'neutro' },
  Estornada: { rotulo: 'Estornada', tom: 'perigo' },
} as const satisfies Record<SituacaoDaCobrancaDoPlano, { rotulo: string; tom: string }>

/** O que o pagamento pagou, numa palavra. */
export const MOTIVO_DA_COBRANCA = { Ciclo: 'Mensalidade do plano', Diferenca: 'Diferença de plano' } as const
