import type { Parcela } from '@/types/cobranca'
import type { PaginacaoRequest } from '@/types/paginacao'
import type { CartaoParaPagar, MeioDePagamento } from '@/types/pagamento'
import type { DadosBancarios, MeioDeRecebimento } from '@/types/recebimento'

export type { MeioDeRecebimento } from '@/types/recebimento'

export type { Parcela, StatusDaParcela, ValorDoDia } from '@/types/cobranca'

/** Como o dinheiro chegou. Espelha `FormaDePagamento`. */
export type FormaDePagamento = 'Pix' | 'Dinheiro' | 'Transferencia' | 'Outro' | 'Cartao'

/** Situação do aviso de pagamento. Espelha `StatusDoInforme`. */
export type StatusDoInforme = 'Pendente' | 'Confirmado' | 'Recusado'

/** O extrato do próprio formando. Espelha `ExtratoDTO`. */
export interface Extrato {
  /** Soma do valor de hoje das abertas e vencidas. */
  em_aberto_em_centavos: number
  /** A primeira a pagar — aberta ou vencida, sem aviso pendente; nula quando não há. */
  proxima: Parcela | null
  parcelas: Parcela[]
}

/** O que o extrato tem de pendente, sem o extrato. Espelha `PendenciasDoExtratoDTO`. */
export interface PendenciasDoExtrato {
  /** Parcelas vencidas em que o formando ainda não avisou o pagamento. */
  vencidas_sem_aviso: number
}

/** O PIX pronto para pagar. Espelha `PixParaPagarDTO`. */
export interface PixParaPagar {
  copia_e_cola: string
  chave: string
  /** O nome que o banco vai mostrar. */
  nome_do_titular: string
  /** CPF mascarado ou CNPJ, quando é esse o tipo da chave; nulo nos demais. */
  documento_do_titular: string | null
  /**
   * Quando a comissão conferiu no banco que a chave é desse titular. Nulo: a conferir — e volta a
   * nulo a cada troca de chave, que é o que faz o aviso reaparecer sozinho.
   */
  conferida_em: string | null
}

/**
 * Um meio que a turma aceita, com o que a tela precisa mostrar. Espelha `MeioDaCobrancaDTO`.
 *
 * Só o campo do próprio meio vem preenchido; os outros vêm `null`.
 */
export interface MeioDaCobranca {
  meio: MeioDeRecebimento
  pix: PixParaPagar | null
  transferencia: DadosBancarios | null
  /** Com quem falar, em `Dinheiro`. */
  instrucao: string | null
}

/**
 * Um meio do Mercado Pago da turma, com o que a tela precisa mostrar. Espelha `PagamentoPeloMercadoPagoDTO`.
 *
 * Baixa sozinho quando pago: não há "já paguei" a dar.
 */
export interface PeloMercadoPago {
  meio: MeioDePagamento
  /** O PIX pronto, em `Pix`. */
  pix: PixDoMercadoPago | null
  /** O formulário do cartão e o valor que ele cobra, em `Cartao` (Sprint 39). */
  cartao: CartaoParaPagar | null
}

/** Em que pé ficou o pagamento no cartão. Espelha `SituacaoDoCartao`. */
export type SituacaoDoCartao = 'Pago' | 'EmAnalise'

/** O PIX do Mercado Pago da turma. Espelha `PixDinamicoParaPagarDTO`. */
export interface PixDoMercadoPago {
  copia_e_cola: string
  /** Até quando aceita pagamento (UTC) — o fim do dia. */
  expira_em: string
}

/** A cobrança da parcela, montada na hora. Espelha `CobrancaDaParcelaDTO`. */
export interface CobrancaDaParcela {
  /** O valor de hoje, somado quando são várias parcelas. */
  valor_em_centavos: number
  identificador: string
  /** Os meios do Mercado Pago da turma, primeiro na tela; vazio sem a conta conectada. */
  pelo_mercado_pago: PeloMercadoPago[]
  /** Os meios da conta da comissão. Com um meio só, somando as duas listas, a tela não desenha seletor. */
  meios: MeioDaCobranca[]
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
  /** Como o formando diz ter pago; nulo nos avisos anteriores à Sprint 18. */
  meio_escolhido: MeioDeRecebimento | null
  status: StatusDoInforme
  informado_em: string
  /** Quando a tesouraria confirmou ou recusou; nulo enquanto pendente. */
  conferido_em: string | null
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
