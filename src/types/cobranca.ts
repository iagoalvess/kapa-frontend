/** O que um item cobra. Espelha `TipoDeCobranca`. */
export type TipoDeCobranca = 'Mensalidade' | 'Adesao' | 'Rifa' | 'ConviteExtra' | 'Avulsa'

/**
 * Como cada tipo aparece na tela. O valor do tipo é contrato da API e vem sem acento.
 *
 * Mora em `types/` porque o plano (feature `cobrancas`) e o termo aceito (feature `adesoes`) mostram
 * os mesmos itens — e uma feature não importa de outra.
 */
export const ROTULOS_DE_TIPO: Record<TipoDeCobranca, string> = {
  Mensalidade: 'Mensalidade',
  Adesao: 'Adesão',
  Rifa: 'Rifa',
  ConviteExtra: 'Convite extra',
  Avulsa: 'Avulsa',
}

/** O nome do item na tela: a descrição, se a tesouraria deu uma; senão, o tipo. */
export const rotuloDoItem = ({ tipo, descricao }: { tipo: TipoDeCobranca; descricao?: string }) =>
  descricao ?? ROTULOS_DE_TIPO[tipo]

/** `Vencida` é calculado pela API: aberta com vencimento passado. */
export type StatusDaParcela = 'Aberta' | 'Paga' | 'Vencida' | 'Cancelada' | 'Renegociada'

/**
 * O valor de uma parcela hoje, com a conta aberta. Espelha `ValorDoDiaDTO`.
 *
 * Multa e juros depois da carência; desconto antes do vencimento — pelas regras que o formando
 * aceitou na adesão, e nunca gravado (Sprint 9).
 */
export interface ValorDoDia {
  original_em_centavos: number
  multa_em_centavos: number
  juros_em_centavos: number
  desconto_em_centavos: number
  /** Já abatido o `ja_pago_em_centavos`. */
  total_em_centavos: number
  dias_de_atraso: number
  /** O que já entrou por esta parcela em pagamentos parciais; zero na maioria. */
  ja_pago_em_centavos: number
}

/**
 * Uma parcela, como a gestão e o próprio formando a veem. Espelha `ParcelaDTO`; a API omite os nulos.
 *
 * Mora em `types/` porque a lista da gestão (`cobrancas`) e o extrato e a conferência
 * (`pagamentos`) mostram a mesma parcela.
 */
export interface Parcela {
  id: string
  usuario_id: string
  nome: string
  tipo: TipoDeCobranca
  descricao?: string
  numero: number
  /** Total de parcelas do item — o "24" de "1/24". */
  de: number
  vencimento: string
  valor_original_em_centavos: number
  status: StatusDaParcela
  /** Tem aviso de pagamento esperando a tesouraria. Leitura, não status. */
  em_conferencia: boolean
  /**
   * Quanto já entrou por esta parcela — a soma das baixas. Numa parcela em aberto quer dizer
   * pagamento parcial: ela não fecha antes de o dinheiro cobrir o que ela cobra.
   */
  valor_pago_em_centavos?: number
  pago_em?: string
  /** Só na aberta e na vencida, e já abatido o que foi pago em parte. */
  valor_do_dia?: ValorDoDia
}

/** Aberta ou vencida: ainda se deve. */
export const emAberto = ({ status }: Pick<Parcela, 'status'>) => status === 'Aberta' || status === 'Vencida'

/**
 * O número que a coluna "Valor" mostra: o que entrou, na paga; o que ainda se deve, nas demais.
 *
 * Na parcela em aberto com pagamento parcial, o pago **não** serve — quem lê a grade quer saber
 * quanto falta, e o `valor_do_dia` já vem com o abatimento feito pela API.
 */
export const valorNaLista = (parcela: Parcela) =>
  parcela.status === 'Paga'
    ? (parcela.valor_pago_em_centavos ?? parcela.valor_original_em_centavos)
    : (parcela.valor_do_dia?.total_em_centavos ?? parcela.valor_original_em_centavos)

/** Pagou parte e a parcela continua em aberto — o que falta é o `valor_do_dia`. */
export const pagaEmParte = (parcela: Parcela) =>
  emAberto(parcela) && (parcela.valor_pago_em_centavos ?? 0) > 0
