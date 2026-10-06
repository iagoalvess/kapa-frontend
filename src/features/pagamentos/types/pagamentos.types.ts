import type { Parcela, TipoDeCobranca } from '@/types/cobranca'
import type { PaginacaoRequest } from '@/types/paginacao'
import type { CartaoParaPagar, MeioDePagamento } from '@/types/pagamento'
import type { DadosBancarios, MeioDeRecebimento } from '@/types/recebimento'

export type { MeioDeRecebimento } from '@/types/recebimento'

export type { Parcela, StatusDaParcela, ValorDoDia } from '@/types/cobranca'

/** Como o dinheiro chegou. Espelha `FormaDePagamento`. */
export type FormaDePagamento = 'Pix' | 'Dinheiro' | 'Transferencia' | 'Outro' | 'Cartao'

/** Situação do aviso de pagamento. Espelha `StatusDoInforme`. */
type StatusDoInforme = 'Pendente' | 'Confirmado' | 'Recusado'

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

/** As duas parcelas do Início, sem o extrato. Espelha `ProximasParcelasDTO`. */
export interface ProximasParcelas {
  /** A primeira a pagar — a mesma `proxima` do extrato; nula quando a pessoa está em dia. */
  proxima: Parcela | null
  /** A que vem depois dela, pela mesma regra. */
  seguinte: Parcela | null
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
interface PixDoMercadoPago {
  copia_e_cola: string
  /** Até quando aceita pagamento (UTC) — o fim do dia. */
  expira_em: string
}

/** A cobrança da parcela, montada na hora. Espelha `CobrancaDaParcelaDTO`. */
export interface CobrancaDaParcela {
  /** O valor de hoje, somado quando são várias parcelas. */
  valor_em_centavos: number
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

/** De onde veio o dinheiro que a comissão tem de resolver. Espelha `OrigemDoValorADevolver`. */
export type OrigemDoValorADevolver = 'CreditoDePedido' | 'ParcelaCancelada' | 'PagoSemParcela'

/** Espelha `StatusDoValorADevolver`. */
export type StatusDoValorADevolver = 'ADevolver' | 'Devolvido' | 'Fechado'

/**
 * Um item da lista "a devolver" da tesouraria (Sprint 42). Espelha `ValorADevolverDTO`.
 *
 * O Kapa não devolve dinheiro: a comissão faz o PIX de volta (ou devolve no painel do Mercado Pago) e
 * registra aqui.
 */
export interface ValorADevolver {
  id: string
  usuario_id: string
  nome: string
  origem: OrigemDoValorADevolver
  status: StatusDoValorADevolver
  /** Quanto falta devolver. */
  valor_em_centavos: number
  tipo: TipoDeCobranca
  descricao: string | null
  /** A parcela de origem; nula no crédito de pedido. */
  numero_da_parcela: number | null
  vencimento: string | null
  criado_em: string
  resolvido_em: string | null
  /** O que a comissão fez com o pago sem parcela, ou por que ele fechou sozinho. */
  observacao: string | null
  tem_comprovante: boolean
}

/** Filtros da lista "a devolver". */
export interface FiltroDeValoresADevolver extends PaginacaoRequest {
  /** Os já devolvidos ou fechados, em vez dos que esperam. */
  resolvidos?: boolean
  busca?: string
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
