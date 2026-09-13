/** Situação da assinatura. Espelha `StatusDaAssinatura`. */
export type StatusDaAssinatura = 'Pendente' | 'Ativa' | 'Vencida' | 'Cancelada'

/** Periodicidade da cobrança. Espelha `CicloDeCobranca`. */
export type CicloDeCobranca = 'Mensal' | 'Anual'

/** Plano contratável. Espelha `PlanoDTO`. */
export interface Plano {
  id: string
  codigo: string
  nome: string
  /** Inteiro, em centavos: `34990` é R$ 349,90. Converta só na exibição (`formatarCentavos`). */
  precoEmCentavos: number
  ciclo: CicloDeCobranca
  limiteDeFormandos: number
  recomendado: boolean
}

/**
 * A assinatura mais recente da formatura. Espelha `AssinaturaDTO`.
 *
 * Datas ausentes não chegam como `null`: o backend omite campo nulo do JSON.
 */
export interface Assinatura {
  id: string
  status: StatusDaAssinatura
  plano: Plano
  vigenteAte?: string
  /** Só existe com renovação automática por vir. */
  proximaCobrancaEm?: string
  canceladaEm?: string
  criadoEm: string
}

/** Sessão de pagamento criada no provedor. Espelha `CheckoutDTO`. */
export interface Checkout {
  url: string
}
