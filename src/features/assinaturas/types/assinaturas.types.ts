import type { Plano } from '@/types/plano'

// O plano subiu para `types/plano.ts` na Sprint 16: a tabela de preços da página institucional
// também o consome, e feature não importa de feature. Fica reexportado aqui para o resto da
// assinatura continuar lendo um arquivo só.
export type { CicloDeCobranca, Plano } from '@/types/plano'

/** Situação da assinatura. Espelha `StatusDaAssinatura`. */
export type StatusDaAssinatura = 'Pendente' | 'Ativa' | 'Vencida' | 'Cancelada'

/**
 * A assinatura mais recente da formatura. Espelha `AssinaturaDTO`.
 *
 * Datas ausentes não chegam como `null`: o backend omite campo nulo do JSON.
 */
export interface Assinatura {
  id: string
  status: StatusDaAssinatura
  plano: Plano
  vigente_ate?: string
  /** Só existe com renovação automática por vir. */
  proxima_cobranca_em?: string
  cancelada_em?: string
  criado_em: string
}

/** Sessão de pagamento criada no provedor. Espelha `CheckoutDTO`. */
export interface Checkout {
  url: string
}
