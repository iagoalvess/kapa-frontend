import type { PaginacaoRequest } from '@/types/paginacao'
import type { DadosDoConvidado, EventoDoConvite, MeuConvite } from '@/types/festa'
import type { CartaoParaPagar, MeioDePagamento } from '@/types/pagamento'

/** Em que ponto está a compra. Espelha `StatusDaCompra`. */
export type StatusDaCompra = 'Pendente' | 'Paga' | 'Expirada' | 'ADevolver' | 'Devolvida'

export const ROTULOS_DA_COMPRA = {
  Pendente: 'Aguardando pagamento',
  Paga: 'Paga',
  Expirada: 'Expirada',
  ADevolver: 'A devolver',
  Devolvida: 'Devolvida',
} as const satisfies Record<StatusDaCompra, string>

/** Um convite à venda. Espelha `ItemDaLojaDTO`. */
export interface ItemDaLoja {
  id: string
  descricao: string
  preco_em_centavos: number
  /** Quantos ainda cabem; nulo no item sem teto — aí a tela não mostra número. */
  disponivel: number | null
  /** Quantos um CPF leva (P3); nulo, sem limite. */
  limite_por_pessoa: number | null
  /** Quando abre, em UTC; nulo, aberto. */
  abertura_de_vendas: string | null
  /** Último dia de venda, `aaaa-mm-dd`. */
  vendas_ate: string | null
  /** Se vende agora, pelo relógio do servidor. */
  aberto: boolean
}

/** A loja da turma. Espelha `LojaDTO`. */
export interface Loja {
  /** Quem vende (P5). */
  turma: string
  instituicao: string
  festa: EventoDoConvite | null
  contato_da_comissao: string | null
  /** Os meios que a loja aceita agora, na ordem da tela. */
  meios: MeioDePagamento[]
  /** O relógio do servidor, em UTC: a contagem regressiva sai dele, nunca do celular (decisão 8). */
  agora: string
  itens: ItemDaLoja[]
}

/** O corpo da compra. Espelha `CompraRequestDTO`. */
export interface DadosDaCompra {
  item_de_cobranca_id: string
  quantidade: number
  nome: string
  email: string
  cpf: string
  meio: MeioDePagamento
  /** Sorteada ao abrir o formulário e repetida em toda nova tentativa (decisão 7). */
  chave_de_idempotencia: string
  /** Quem vai usar cada convite, na ordem — um por unidade. */
  convidados: DadosDoConvidado[]
}

/** O documento para pagar. Espelha `CobrancaDaCompraDTO`. */
export interface CobrancaDaCompra {
  meio: MeioDePagamento
  copia_e_cola: string | null
  expira_em: string
}

/** A compra, pelo link. Espelha `CompraDTO`. */
export interface Compra {
  id: string
  status: StatusDaCompra
  item: string
  quantidade: number
  valor_em_centavos: number
  meio: MeioDePagamento
  /** Até quando a reserva vale sem pagamento, em UTC. */
  expira_em: string
  paga_em: string | null
  /** Nulo depois da exclusão dos dados. */
  nome_do_comprador: string | null
  /** Mascarado. */
  email: string | null
  turma: string
  contato_da_comissao: string | null
  festa: EventoDoConvite | null
  /** Nula na pendente cuja emissão falhou: a tela oferece gerar de novo. */
  cobranca: CobrancaDaCompra | null
  lista_aberta: boolean
  pode_apagar_dados: boolean
  convites: MeuConvite[]
  /** A turma — o caminho de volta para a loja. */
  formatura_id: string
  /** Quantos convites da compra deixaram de valer (Sprint 38). */
  convites_cancelados: number
  /** O que a comissão ainda devolve. */
  valor_a_devolver_em_centavos: number
  /** O pedido aberto, ou o último respondido (P1). */
  pedido_de_cancelamento: PedidoDoComprador | null
  /** Se há convite que ele ainda pode pedir para cancelar. */
  pode_pedir_cancelamento: boolean
  /** O formulário do cartão e o valor, na compra pendente no cartão (Sprint 39); nulo nas demais. */
  cartao: CartaoParaPagar | null
}

/** Situação do pedido de cancelamento. Espelha `StatusDoPedidoDeCancelamento`. */
export type StatusDoPedidoDeCancelamento = 'Aberto' | 'Aprovado' | 'Recusado'

/** O pedido como o comprador o acompanha. Espelha `PedidoDoCompradorDTO`. */
export interface PedidoDoComprador {
  status: StatusDoPedidoDeCancelamento
  pedido_em: string
  convites: number
  respondido_em: string | null
  motivo_da_resposta: string | null
}

/** A compra recém-criada. Espelha `CompraCriadaDTO`. */
export interface CompraCriada {
  /** O segredo do link: a tela navega para `/compra/{token}`. */
  token: string
  compra: Compra
}

/** Uma compra na lista da Gestão. Espelha `CompraNaGestaoDTO`. */
export interface CompraNaGestao {
  id: string
  criada_em: string
  nome: string | null
  /** Inteiro — é por ele que a comissão devolve (P5). */
  email: string | null
  /** Mascarado. */
  cpf: string | null
  item: string
  quantidade: number
  valor_em_centavos: number
  meio: MeioDePagamento
  status: StatusDaCompra
  expira_em: string
  paga_em: string | null
  valor_pago_em_centavos: number | null
  /** O CPF de quem pagou não é o da compra — o sinal da P6. */
  pagador_diferente: boolean
  /** Quantos convites deixaram de valer (Sprint 38). */
  convites_cancelados: number
  /** O que a comissão ainda devolve. */
  valor_a_devolver_em_centavos: number
  devolvida_em: string | null
  /** O comprador pediu cancelamento e ninguém respondeu. */
  pedido_de_cancelamento_aberto: boolean
}

/** Um convite da compra, para a Gestão escolher o que cancelar. Espelha `ConviteDaCompraDTO`. */
export interface ConviteDaCompra {
  id: string
  sequencial: number
  codigo: string
  nome_do_convidado: string | null
  /** A entrada na portaria — convite usado não se cancela (P3). */
  validado_em: string | null
  revogado_em: string | null
  motivo_da_revogacao: string | null
}

/** Um pedido de cancelamento aberto. Espelha `PedidoNaGestaoDTO`. */
export interface PedidoNaGestao {
  id: string
  compra_id: string
  nome: string | null
  email: string | null
  item: string
  quantidade_da_compra: number
  convites: number
  motivo: string | null
  pedido_em: string
}

/** O que o cancelamento fez. Espelha `CompraCanceladaDTO`. */
export interface CompraCancelada {
  convites_cancelados: number
  estorno_em_centavos: number
}

/** A conta da loja. Espelha `ResumoDaLojaDTO`. */
export interface ResumoDaLoja {
  convites_vendidos: number
  aguardando_pix: number
  compras_a_devolver: number
  arrecadado_em_centavos: number
  /** A festa da agenda — o alvo de "Cancelar as vendas da festa" (P6). */
  festa_id: string | null
}

/** O filtro da lista da Gestão. */
export interface FiltroDeCompras extends PaginacaoRequest {
  status?: StatusDaCompra
  busca?: string
}
