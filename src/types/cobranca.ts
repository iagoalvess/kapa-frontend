/** Os tipos de um item do plano — o que a turma inteira paga. */
export const TIPOS_DO_PLANO = ['Mensalidade', 'Adesao', 'Rifa', 'ConviteExtra', 'Avulsa'] as const

/**
 * Os tipos de um item opcional — o que cada formando compra para si. O convite extra é dos dois.
 *
 * Categorias, não regras: só o `ConviteExtra` tem comportamento (o convite da festa). Os outros
 * dão o ícone, o filtro e o agrupamento no relatório.
 */
export const TIPOS_DOS_OPCIONAIS = [
  'ConviteExtra',
  'FotoEAlbum',
  'Filmagem',
  'Beca',
  'Vestuario',
  'Kit',
  'Mesa',
  'Acompanhante',
  'Joia',
  'Outro',
] as const

/** O que um item cobra. Espelha `TipoDeCobranca`. */
export type TipoDeCobranca = (typeof TIPOS_DO_PLANO)[number] | (typeof TIPOS_DOS_OPCIONAIS)[number]

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
  FotoEAlbum: 'Foto e álbum',
  Filmagem: 'Filmagem',
  Beca: 'Beca',
  Vestuario: 'Vestuário',
  Kit: 'Kit',
  Mesa: 'Mesa',
  Acompanhante: 'Acompanhante',
  Joia: 'Joia',
  Outro: 'Outro',
}

/**
 * A cor do círculo por tipo de cobrança — a mensalidade do mês e a rifa se distinguem de relance.
 *
 * Sai da paleta dos avatares (`Avatar`), a mesma que nomeia as pessoas em Membros, mais dois tons só
 * dela (`avatar-7` e `avatar-8`); o laranja (`avatar-5`) fica de fora, que é a cor da marca e só o
 * botão a usa.
 */
export const CORES_DE_TIPO: Record<TipoDeCobranca, string> = {
  Mensalidade: 'bg-avatar-2',
  Adesao: 'bg-avatar-1',
  Rifa: 'bg-avatar-4',
  ConviteExtra: 'bg-avatar-3',
  Avulsa: 'bg-avatar-6',
  // Os opcionais repetem tons do plano — oito não dão para quatorze tipos —, mas vizinhos na vitrine
  // nunca se repetem, e os dois verdes (1 e 6) ficam com um opcional só: eram eles que dominavam a tela.
  FotoEAlbum: 'bg-avatar-8',
  Filmagem: 'bg-avatar-4',
  Beca: 'bg-avatar-2',
  Vestuario: 'bg-avatar-1',
  Kit: 'bg-avatar-7',
  Mesa: 'bg-avatar-8',
  Acompanhante: 'bg-avatar-3',
  Joia: 'bg-avatar-7',
  Outro: 'bg-avatar-4',
}

/** O nome do item na tela: a descrição, se a tesouraria deu uma; senão, o tipo. */
export const rotuloDoItem = ({
  tipo,
  descricao,
}: {
  tipo: TipoDeCobranca
  /** Opcional porque também serve ao que a tela monta; da API chega `null`. */
  descricao?: string | null
}) => descricao ?? ROTULOS_DE_TIPO[tipo]

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
 * Uma parcela, como a gestão e o próprio formando a veem. Espelha `ParcelaDTO`.
 *
 * Mora em `types/` porque a lista da gestão (`cobrancas`) e o extrato e a conferência
 * (`pagamentos`) mostram a mesma parcela.
 */
export interface Parcela {
  id: string
  usuario_id: string
  nome: string
  /** Item de origem — é por ele que a tela junta as parcelas de um pedido, sem adivinhar pelo rótulo. */
  item_de_cobranca_id: string
  tipo: TipoDeCobranca
  descricao: string | null
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
  valor_pago_em_centavos: number | null
  pago_em: string | null
  /** Só na aberta e na vencida, e já abatido o que foi pago em parte. */
  valor_do_dia: ValorDoDia | null
  /**
   * A última baixa que vale — o recibo que a linha abre (Sprint 22). Nula sem baixa; na parcela
   * quitada em partes, os recibos anteriores chegam pelo e-mail de cada confirmação.
   */
  recebimento_id: string | null
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

/**
 * A parcela é um **crédito**: a bolsa lançada como `Avulsa` negativa, ou a devolução de um pedido
 * cancelado (P5 da Sprint 20).
 *
 * Ela abate o que a pessoa deve — é para isso que existe — e por isso entra na soma em aberto. O
 * que ela não é é algo a pagar: "pague −R$ 350,00" não é uma frase.
 */
export const ehCredito = (parcela: Parcela) => parcela.valor_original_em_centavos < 0

/** A parcela que o botão "Pagar" aceita: devida, sem aviso na fila e com valor a pagar. */
export const aPagar = (parcela: Parcela) =>
  emAberto(parcela) && !parcela.em_conferencia && !ehCredito(parcela)
