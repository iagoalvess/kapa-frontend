/** Situação da assinatura. Espelha `StatusDaAssinatura`. */
export type StatusDaAssinatura = 'Pendente' | 'Ativa' | 'Vencida' | 'Cancelada'

/** Periodicidade da cobrança. Espelha `CicloDeCobranca`. */
export type CicloDeCobranca = 'Mensal' | 'Anual'

/** Plano contratável. Espelha `PlanoDTO`. */
export interface Plano {
  id: string
  codigo: string
  nome: string
  /** Uma linha embaixo do nome, no card: para que turma o plano serve. */
  descricao: string
  /** Inteiro, em centavos: `34990` é R$ 349,90. Converta só na exibição (`formatarCentavos`). */
  preco_em_centavos: number
  /** Preço sem desconto, o valor riscado. Ausente quando não há desconto — o backend omite nulo. */
  preco_cheio_em_centavos?: number
  ciclo: CicloDeCobranca
  limite_de_formandos: number
  /** Módulos incluídos, na ordem de exibição. */
  modulos: string[]
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
