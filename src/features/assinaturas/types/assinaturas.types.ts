import type { StatusDaAssinatura } from '@/types/assinatura'
import type { Plano } from '@/types/plano'

// O plano subiu para `types/plano.ts` na Sprint 16: a tabela de preços da página institucional
// também o consome, e feature não importa de feature. Fica reexportado aqui para o resto da
// assinatura continuar lendo um arquivo só. O status subiu pelo mesmo motivo: o suporte o mostra.
export type { CicloDeCobranca, Plano } from '@/types/plano'
export type { StatusDaAssinatura } from '@/types/assinatura'

/** A assinatura mais recente da formatura. Espelha `AssinaturaDTO`. */
export interface Assinatura {
  id: string
  status: StatusDaAssinatura
  plano: Plano
  vigente_ate: string | null
  /** Nula sem renovação automática por vir. */
  proxima_cobranca_em: string | null
  cancelada_em: string | null
  criado_em: string
}

/** Sessão de pagamento criada no provedor. Espelha `CheckoutDTO`. */
export interface Checkout {
  url: string
}
