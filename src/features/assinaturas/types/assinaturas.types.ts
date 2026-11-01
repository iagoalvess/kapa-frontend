import type { StatusDaAssinatura } from '@/types/assinatura'
import type { MeioDePagamento } from '@/types/pagamento'
import type { Plano } from '@/types/plano'

// O plano subiu para `types/plano.ts` na Sprint 16: a tabela de preços da página institucional
// também o consome, e feature não importa de feature. Fica reexportado aqui para o resto da
// assinatura continuar lendo um arquivo só. O status subiu pelo mesmo motivo: o suporte o mostra.
export type { CicloDeCobranca, Plano } from '@/types/plano'
export type { StatusDaAssinatura } from '@/types/assinatura'

/**
 * O recado que a volta do checkout deixa para o app: o Início abre o aviso de pagamento confirmado.
 *
 * Viaja no `state` da rota `/inicio` e é apagado quando o aviso fecha — recarregar depois de fechar
 * não o traz de volta.
 */
export interface EstadoDoPagamentoConfirmado {
  /** Nome do plano que acabou de ser ativado. */
  pagamentoConfirmado: string
}

/** A assinatura mais recente da formatura. Espelha `AssinaturaDTO`. */
export interface Assinatura {
  id: string
  status: StatusDaAssinatura
  plano: Plano
  vigente_ate: string | null
  /** Nula sem renovação automática por vir. */
  proxima_cobranca_em: string | null
  cancelada_em: string | null
  /** Cartão recorrente ou um PIX avulso por ciclo (Sprint 37). */
  meio: MeioDePagamento
  /** O plano que vale a partir da próxima renovação — a descida agendada. */
  proximo_plano: Plano | null
  /** A troca para o cartão espera a autorização na página do Mercado Pago. */
  cartao_aguardando_autorizacao: boolean
  /** O cupom da primeira cobrança (Sprint 51); nulo sem cupom. */
  cupom: CupomAplicavel | null
  /**
   * Até quando o Presidente pode solicitar a análise do reembolso do último ciclo pago.
   * Nula fora do prazo de 7 dias; o pedido enviado no prazo continua disponível para acompanhamento.
   */
  desistencia_ate: string | null
  /** Pedido do último ciclo pago, para acompanhamento da análise manual. */
  pedido_de_reembolso: {
    id: string
    status: 'Pendente' | 'Concluido' | 'Recusado'
    solicitado_em: string
  } | null
}

/** Cupom que vale para a turma. Espelha `CupomAplicavelDTO` — o desconto é só na primeira cobrança. */
export interface CupomAplicavel {
  codigo: string
  /** De 1 a 50. */
  percentual: number
}

/** O que a troca de plano ou de meio deu. Espelha `TrocaDTO`; a assinatura nova se relê da API. */
export interface Troca {
  /** A página para pagar a diferença ou autorizar o cartão; nula quando nada precisa ser pago agora. */
  url: string | null
}

/** Sessão de pagamento criada no provedor. Espelha `CheckoutDTO`. */
export interface Checkout {
  url: string
}
