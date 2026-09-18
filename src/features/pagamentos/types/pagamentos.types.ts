import type { Parcela } from '@/types/cobranca'
import type { PaginacaoRequest } from '@/types/paginacao'

export type { Parcela, StatusDaParcela, ValorDoDia } from '@/types/cobranca'

/*
  A API omite campo nulo (`WhenWritingNull`): o que pode faltar é opcional aqui, e se testa por
  presença — nunca `=== null`.
*/

/** Como o dinheiro chegou. Espelha `FormaDePagamento`. */
export type FormaDePagamento = 'Pix' | 'Dinheiro' | 'Transferencia' | 'Outro'

/** Situação do aviso de pagamento. Espelha `StatusDoInforme`. */
export type StatusDoInforme = 'Pendente' | 'Confirmado' | 'Recusado'

/** O extrato do próprio formando. Espelha `ExtratoDTO`. */
export interface Extrato {
  /** Soma do valor de hoje das abertas e vencidas. */
  em_aberto_em_centavos: number
  /** A primeira a pagar — aberta ou vencida, sem aviso pendente. */
  proxima?: Parcela
  parcelas: Parcela[]
}

/** O que o extrato tem de pendente, sem o extrato. Espelha `PendenciasDoExtratoDTO`. */
export interface PendenciasDoExtrato {
  /** Parcelas vencidas em que o formando ainda não avisou o pagamento. */
  vencidas_sem_aviso: number
}

/** O PIX de uma parcela, montado na hora. Espelha `PixDaParcelaDTO`. */
export interface PixDaParcela {
  copia_e_cola: string
  /** O valor de hoje. */
  valor_em_centavos: number
  chave: string
  /** O nome que o banco vai mostrar. */
  nome_do_titular: string
  identificador: string
}

/** Um aviso de pagamento na fila da tesouraria. Espelha `InformeDTO`. */
export interface Informe {
  id: string
  parcela: Parcela
  pago_em: string
  valor_em_centavos: number
  /** O valor da parcela no dia informado. */
  devido_em_centavos: number
  tem_comprovante: boolean
  status: StatusDoInforme
  informado_em: string
  /** Quando a tesouraria confirmou ou recusou; ausente enquanto pendente. */
  conferido_em?: string
}

/** Filtros de `GET /api/v1/informes`. */
export interface FiltroDeInformes extends PaginacaoRequest {
  status?: StatusDoInforme
  /** Só os conferidos hoje, pelo dia local do servidor — o painel do que já foi fechado. */
  conferidos_hoje?: boolean
  /** Trecho do nome do formando. */
  busca?: string
  /** Pagamento informado a partir deste dia, inclusive. */
  de?: string
  /** Pagamento informado até este dia, inclusive. */
  ate?: string
}

/** Um informe do lote, com o que de fato entrou. Espelha `ConfirmacaoDeInformeDTO`. */
export interface ConfirmacaoDeInforme {
  informe_id: string
  valor_recebido_em_centavos: number
}

/** Espelha `ResultadoDaConferenciaDTO`. */
export interface ResultadoDaConferencia {
  confirmados: number
  /** Já conferidos antes — o clique duplo. */
  ignorados: number
}

/** Uma baixa com recebido diferente do devido. Espelha `DivergenciaDTO`. */
export interface Divergencia {
  recebimento_id: string
  parcela: Parcela
  pago_em: string
  devido_em_centavos: number
  recebido_em_centavos: number
  forma: FormaDePagamento
  baixado_por: string
}
