import { diaDeHoje } from '@/lib/formato'

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
  'Joia',
  'Outro',
] as const

/**
 * Os tipos de um pacote do catálogo (Sprint 47) — o que cada formando escolhe na adesão. Todos menos o
 * `Avulsa`, que é o gancho do valor negativo; a festa e a colação primeiro, que são os pacotes com faixa.
 */
export const TIPOS_DOS_PACOTES = [
  'Festa',
  'Colacao',
  'FotoEAlbum',
  'Filmagem',
  'Beca',
  'Vestuario',
  'Kit',
  'Mesa',
  'Joia',
  'ConviteExtra',
  'Mensalidade',
  'Adesao',
  'Rifa',
  'Outro',
] as const

/**
 * Os tipos de um rateio extraordinário — o item da assembleia, que cobra quem já aderiu (Sprint 7): os do pacote e o
 * `Avulsa`, que aceita valor negativo (a bolsa).
 */
export const TIPOS_DOS_RATEIOS = [...TIPOS_DOS_PACOTES, 'Avulsa'] as const

/** O que um item cobra. Espelha `TipoDeCobranca`. */
export type TipoDeCobranca = (typeof TIPOS_DOS_OPCIONAIS)[number] | (typeof TIPOS_DOS_RATEIOS)[number]

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
  Joia: 'Joia',
  Outro: 'Outro',
  Festa: 'Festa',
  Colacao: 'Colação',
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
  Joia: 'bg-avatar-7',
  Outro: 'bg-avatar-4',
  Festa: 'bg-avatar-3',
  Colacao: 'bg-avatar-1',
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

/** "1 convite", "15 convites". */
const convites = (quantos: number) => `${quantos} ${quantos === 1 ? 'convite' : 'convites'}`

/**
 * "15 convites da festa e 3 da colação" — o que um pacote concede (Sprint 47), ou `null` se não concede convite.
 * O mesmo texto do PDF do termo (`PacoteDaCesta.BeneficiosPorExtenso`).
 */
export function beneficiosPorExtenso({
  convites_da_festa = 0,
  convites_da_colacao = 0,
}: {
  convites_da_festa?: number
  convites_da_colacao?: number
}) {
  if (convites_da_festa && convites_da_colacao)
    return `${convites(convites_da_festa)} da festa e ${convites_da_colacao} da colação`
  if (convites_da_festa) return `${convites(convites_da_festa)} da festa`
  if (convites_da_colacao) return `${convites(convites_da_colacao)} da colação`

  return null
}

/** `Vencida` é calculado pela API: aberta com vencimento passado. */
export type StatusDaParcela = 'Aberta' | 'Paga' | 'Vencida' | 'Cancelada'

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
  /**
   * Alguma baixa que vale veio do Mercado Pago (Sprint 42): o estorno à mão só desfaz o registro — a
   * devolução pelo painel do Mercado Pago é da comissão.
   */
  pelo_mercado_pago: boolean
  /**
   * Até quando a parcela está fora da régua e da inadimplência — há solicitação de cancelamento esperando a
   * comissão (Sprint 48, D12). Nula, cobra normalmente. Enquanto vale, a vencida chega como `Aberta`.
   */
  suspensa_ate: string | null
}

/**
 * Se o formando ainda pode pedir o cancelamento hoje (Sprint 48, D36): sem data, sempre; com, até o dia, inclusive.
 * A API confere de novo — aqui é só para não oferecer o botão que ela recusaria.
 */
export const cancelavelHoje = (cancelavelAte: string | null) => !cancelavelAte || cancelavelAte >= diaDeHoje()

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
const ehCredito = (parcela: Parcela) => parcela.valor_original_em_centavos < 0

/** A parcela que o botão "Pagar" aceita: devida, sem aviso na fila e com valor a pagar. */
export const aPagar = (parcela: Parcela) =>
  emAberto(parcela) && !parcela.em_conferencia && !ehCredito(parcela)
