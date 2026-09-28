import type { StatusDaParcela, TipoDeCobranca } from '@/types/cobranca'
import type { PaginacaoRequest } from '@/types/paginacao'

// Tipo, rótulo e parcela moram em `types/cobranca`: `adesoes` e `pagamentos` mostram os mesmos itens.
export {
  emAberto,
  type Parcela,
  ROTULOS_DE_TIPO,
  rotuloDoItem,
  type StatusDaParcela,
  type TipoDeCobranca,
  TIPOS_DO_PLANO,
  TIPOS_DOS_OPCIONAIS,
  type ValorDoDia,
} from '@/types/cobranca'

/**
 * Por qual porta o opcional se vende (Sprint 26, decisão 1): a vitrine do formando ou a loja pública.
 * As portas são exclusivas (P8) — o item da loja sai da vitrine, e o formando compra pelo link.
 */
export type ModoDeVenda = 'AoFormando' | 'Publica'

/** `Rascunho` é nome interno: na tela, "Em montagem". */
export type StatusDoPlano = 'Rascunho' | 'Vigente'

/**
 * Um item como a API recebe — no cadastro e na simulação. Espelha `ItemDeCobrancaRequestDTO`.
 *
 * Dinheiro em centavos, sempre inteiro: `valor_em_centavos` é o **total** por formando, que a API
 * divide nas parcelas.
 */
export interface DadosDoItem {
  tipo: TipoDeCobranca
  descricao?: string
  valor_em_centavos: number
  numero_de_parcelas: number
  /** De 1 a 31; no mês mais curto vale o último dia. */
  dia_de_vencimento: number
  /** `aaaa-mm-dd`, dia 1. */
  primeiro_mes: string
  /**
   * Rateio extraordinário: cobra também quem já aderiu. Exige `origem_da_decisao` e um primeiro
   * mês que ainda não passou. Só na inclusão — a alteração e a simulação ignoram.
   */
  aplicar_a_quem_ja_aderiu?: boolean
  /** Onde a turma decidiu: "assembleia de 12/10". */
  origem_da_decisao?: string
}

/** Um item gravado. Espelha `ItemDeCobrancaDTO`; a API escreve o nulo em vez de omitir. */
export interface ItemDeCobranca extends DadosDoItem {
  id: string
  encerrado_em: string | null
  /** Já gerou parcela: não se remove, só se encerra, e só o valor muda. */
  em_uso: boolean
  /**
   * Item opcional (Sprint 20): só cobra quem pedir, e `valor_em_centavos` é o preço **unitário**.
   *
   * É a marca que o tira de `ItensAtivos` no servidor — e da adesão de todo mundo.
   */
  opcional: boolean
  /** Cota por formando; nulo, sem cota. */
  limite_por_formando: number | null
  /** Último dia para pedir, `aaaa-mm-dd`; nulo, sem prazo. */
  pedidos_ate_dia: string | null
  /** Unidades existentes; nulo, sem teto. */
  estoque: number | null
  /** Unidades já pedidas. */
  reservados: number
  /** A partir de quando se pode pedir — instante em UTC, com hora (Sprint 26, P10); nulo, aberto desde sempre. */
  abertura_de_vendas: string | null
  /** O item da festa que este item vende (decisão 11); nulo é o caso comum. */
  item_da_festa_id: string | null
  /** Vitrine do formando ou loja pública (Sprint 26). */
  modo_de_venda: ModoDeVenda
  /** Preço de uma unidade na loja; nulo, o mesmo do formando (P4). */
  preco_publico_em_centavos: number | null
}

/**
 * Um item opcional como a tesouraria o envia. Espelha `OpcionalRequestDTO`.
 *
 * `valor_em_centavos` é o preço de **uma unidade** — o pedido multiplica pela quantidade antes de
 * montar a grade (decisão 2).
 */
export interface DadosDoOpcional {
  tipo: TipoDeCobranca
  descricao?: string
  valor_em_centavos: number
  numero_de_parcelas: number
  dia_de_vencimento: number
  /** `aaaa-mm-dd`, dia 1. */
  primeiro_mes: string
  limite_por_formando?: number
  pedidos_ate_dia?: string
  estoque?: number
  /** Instante em UTC. */
  abertura_de_vendas?: string
  item_da_festa_id?: string
  modo_de_venda: ModoDeVenda
  preco_publico_em_centavos?: number
}

/** Um item da vitrine do formando. Espelha `OpcionalDTO`. */
export interface Opcional {
  id: string
  tipo: TipoDeCobranca
  descricao: string | null
  /** Preço de **uma** unidade, em centavos. */
  valor_em_centavos: number
  /** O teto: o formando escolhe de 1 (à vista) até este número. */
  numero_de_parcelas: number
  dia_de_vencimento: number
  /**
   * Mês a partir do qual as parcelas do pedido vencem, `aaaa-mm-dd`.
   *
   * O calendário do diálogo começa no maior entre ele e o próximo vencimento a partir de hoje — é a
   * mesma regra que a API aplica ao gravar, e é por isso que ele viaja.
   */
  primeiro_mes: string
  limite_por_formando: number | null
  pedidos_ate_dia: string | null
  estoque: number | null
  reservados: number
  /** Quantas ainda cabem; nulo no item sem teto. É **reservado**, não pago. */
  disponivel: number | null
  abertura_de_vendas: string | null
  item_da_festa_id: string | null
  /** Falso mostra a data da abertura no lugar do botão. */
  aberto_a_pedido: boolean
}

/** Confirmado ou cancelado — não há aprovação da comissão (P2). */
export type StatusDoPedido = 'Confirmado' | 'Cancelado'

/** Um pedido, como o formando e a Gestão o veem. Espelha `PedidoDTO`. */
export interface Pedido {
  id: string
  item_de_cobranca_id: string
  tipo: TipoDeCobranca
  descricao: string | null
  usuario_id: string
  nome: string
  quantidade: number
  /** Em quantas vezes o formando escolheu pagar. O aumento de quantidade sai com a mesma divisão. */
  parcelas: number
  valor_unitario_em_centavos: number
  total_em_centavos: number
  /** O que já entrou pelas parcelas deste pedido. */
  pago_em_centavos: number
  quitado: boolean
  status: StatusDoPedido
  pedido_em: string
  cancelado_em: string | null
}

/**
 * A conta aberta de um item na faixa da tela de Pedidos. Espelha `ResumoDoItemPedidoDTO`.
 *
 * `disponivel` quer dizer **reservado**, não pago: é por isso que a faixa mostra as duas contas.
 */
export interface ResumoDoItemPedido {
  item_de_cobranca_id: string
  tipo: TipoDeCobranca
  descricao: string | null
  pedidos: number
  /** Unidades confirmadas — o número que a comissão leva ao fornecedor. */
  unidades: number
  unidades_quitadas: number
  estoque: number | null
  disponivel: number | null
  total_em_centavos: number
  pago_em_centavos: number
}

/** Filtros de `GET /api/v1/pedidos`. */
export interface FiltroDePedidos extends PaginacaoRequest {
  item_de_cobranca_id?: string
  status?: StatusDoPedido
  /** Só os pagos por inteiro (`true`) ou só os que ainda devem (`false`). */
  quitado?: boolean
  /** Trecho do nome da conta ou do nome civil de quem pediu. */
  busca?: string
}

/**
 * Nome e regras de atraso. Espelha `PlanoDeCobrancaRequestDTO`.
 *
 * Percentuais em base 10.000: `200` é 2%.
 */
export interface DadosDoPlano {
  nome: string
  percentual_de_multa: number
  percentual_de_juros_ao_mes: number
  carencia_em_dias: number
  percentual_de_desconto_por_antecipacao: number
  /**
   * Dias de antecedência que o desconto exige. Obrigatório acima de zero quando há desconto — sem
   * ele, quem paga um dia antes leva o desconto inteiro (revisão de 17/09/2026).
   */
  dias_minimos_para_desconto: number
}

/** Espelha `PlanoDeCobrancaResumoDTO`. */
export interface PlanoDeCobrancaResumo {
  id: string
  nome: string
  status: StatusDoPlano
  vigente_desde: string | null
}

/** Espelha `PlanoDeCobrancaDTO`. */
export interface PlanoDeCobranca extends DadosDoPlano {
  id: string
  status: StatusDoPlano
  vigente_desde: string | null
  itens: ItemDeCobranca[]
  /**
   * Quantos já aderiram. Item incluído agora vale só para quem aderir depois (decisão de
   * 14/09/2026) — a não ser que seja um rateio extraordinário (revisão de 17/09/2026).
   */
  formandos_com_parcela: number
}

/** Espelha `ParcelaSimuladaDTO`. */
export interface ParcelaSimulada {
  tipo: TipoDeCobranca
  descricao: string | null
  numero: number
  /** Total de parcelas do item — o "24" de "1/24". */
  de: number
  vencimento: string
  valor_em_centavos: number
}

/** Espelha `SimulacaoDoPlanoDTO`. */
export interface SimulacaoDoPlano {
  parcelas: ParcelaSimulada[]
  total_por_formando: number
  /** Membros ativos da turma hoje. */
  formandos: number
  total_da_turma: number
}

/** Filtros de `GET /api/v1/cobrancas/parcelas`. */
export interface FiltroDeParcelas extends PaginacaoRequest {
  usuario_id?: string
  status?: StatusDaParcela
  /** Trecho do nome da conta ou do nome civil. */
  busca?: string
  /** Vencimento a partir de, `aaaa-mm-dd`. */
  de?: string
  /** Vencimento até, `aaaa-mm-dd`. */
  ate?: string
}

/** Quantas parcelas e quanto somam. Espelha `SomaDeParcelasDTO`. */
export interface SomaDeParcelas {
  quantidade: number
  /** O original; nas pagas, o que entrou. */
  valor_em_centavos: number
}

/** A faixa da tela Parcelas, numa chamada. Espelha `ResumoDeParcelasDTO`. */
export interface ResumoDeParcelas {
  todas: SomaDeParcelas
  aberta: SomaDeParcelas
  vencida: SomaDeParcelas
  paga: SomaDeParcelas
  cancelada: SomaDeParcelas
  /** As vencidas pelo valor de hoje, com multa e juros. */
  vencido_atualizado_em_centavos: number
}
