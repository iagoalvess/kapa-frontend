import type { StatusDaParcela, TipoDeCobranca } from '@/types/cobranca'
import type { PaginacaoRequest } from '@/types/paginacao'

// Tipo, rótulo e parcela moram em `types/cobranca`: `adesoes` e `pagamentos` mostram os mesmos itens.
export {
  beneficiosPorExtenso,
  cancelavelHoje,
  emAberto,
  type Parcela,
  ROTULOS_DE_TIPO,
  rotuloDoItem,
  type StatusDaParcela,
  type TipoDeCobranca,
  TIPOS_DOS_OPCIONAIS,
  TIPOS_DOS_PACOTES,
  TIPOS_DOS_RATEIOS,
  type ValorDoDia,
} from '@/types/cobranca'

/**
 * Por qual porta o opcional se vende (Sprint 26, decisão 1): a vitrine do formando ou a loja pública.
 * As portas são exclusivas (P8) — o item da loja sai da vitrine, e o formando compra pelo link.
 */
type ModoDeVenda = 'AoFormando' | 'Publica'

/** `Rascunho` é nome interno: na tela, "Em montagem". */
type StatusDoPlano = 'Rascunho' | 'Vigente'

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
  /** Grupo de faixas do pacote ("Festa"); ausente, pacote avulso. Na cesta, uma faixa por grupo (Sprint 47). */
  grupo?: string | null
  /** Convites da festa que o pacote concede. */
  convites_da_festa?: number
  /** Convites da colação que o pacote concede. */
  convites_da_colacao?: number
  /** Até quando a última parcela pode vencer, `aaaa-mm-dd`; ausente, nada é conferido (D28). */
  ultimo_vencimento?: string | null
  /** Último dia para o formando pedir o cancelamento, `aaaa-mm-dd`; ausente, sem trava (Sprint 48, D36). */
  cancelavel_ate?: string | null
  /** No rateio, os pacotes de quem paga (Sprint 48, D19); vazio ou ausente, todos os que já aderiram. Só na inclusão. */
  alvo?: string[]
  /**
   * Na alteração do preço de um item em uso: repactua também quem já aderiu, no que ainda não venceu (D21). Ausente,
   * o preço novo vale só para quem aderir depois.
   */
  aplicar_aos_atuais?: boolean
}

/**
 * Um item gravado. Espelha `ItemDeCobrancaDTO`; a API escreve o nulo em vez de omitir.
 *
 * Sem `aplicar_a_quem_ja_aderiu`: é ordem da inclusão, não dado do item, e a resposta não o traz.
 */
export interface ItemDeCobranca extends Omit<
  DadosDoItem,
  'aplicar_a_quem_ja_aderiu' | 'alvo' | 'aplicar_aos_atuais'
> {
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
  /** Pacote do catálogo: só cobra quem o escolhe na adesão (Sprint 47). Falso no opcional e no rateio. */
  pacote: boolean
  grupo: string | null
  convites_da_festa: number
  convites_da_colacao: number
  ultimo_vencimento: string | null
  cancelavel_ate: string | null
  /** Os pacotes de quem o rateio cobrou; vazio é todos (D19). */
  alvo_do_rateio: string[]
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
  /** Até quando a última parcela pode vencer, `aaaa-mm-dd` — o teto do item e a divisão de cada pedido (D28). */
  ultimo_vencimento?: string
  /** Último dia para o formando pedir o cancelamento do pedido, `aaaa-mm-dd` (Sprint 48, D36). */
  cancelavel_ate?: string
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
  /** Até quando a última parcela do pedido pode vencer; a prévia avisa antes de a API recusar (D28). */
  ultimo_vencimento: string | null
}

/** Confirmado ou cancelado — não há aprovação da comissão (P2). */
type StatusDoPedido = 'Confirmado' | 'Cancelado'

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
  total_em_centavos: number
  /** O que já entrou pelas parcelas deste pedido. */
  pago_em_centavos: number
  quitado: boolean
  status: StatusDoPedido
  pedido_em: string
  /** O detalhe livre de quem pediu — tamanho da beca, nome no convite (Sprint 48, D26). */
  observacao: string | null
  /** Último dia para pedir o cancelamento; nulo, sem trava (D36). */
  cancelavel_ate: string | null
  /** Há solicitação de cancelamento esperando a comissão (D8). */
  cancelamento_solicitado: boolean
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
interface ParcelaSimulada {
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
interface SomaDeParcelas {
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

/** Quantos formandos uma operação alcança e quanto muda. Espelha `AlcanceDTO` (Sprint 48, D19/D21). */
export interface Alcance {
  formandos: number
  /** Quantas parcelas mudam; zero no rateio. */
  parcelas: number
  /** Quanto a soma do que eles devem muda, em centavos. */
  total_em_centavos: number
}

/** `Aberto` espera a comissão; `Aprovado` cancelou; `Recusado` voltou a cobrar. */
export type StatusDaSolicitacao = 'Aberto' | 'Aprovado' | 'Recusado'

/** Uma solicitação de cancelamento de pacote ou pedido (Sprint 48, D8). Espelha `SolicitacaoDeCancelamentoDTO`. */
export interface SolicitacaoDeCancelamento {
  id: string
  usuario_id: string
  nome: string
  item_de_cobranca_id: string
  tipo: TipoDeCobranca
  descricao: string | null
  grupo: string | null
  /** O pedido avulso; nulo é pacote da cesta. */
  pedido_id: string | null
  motivo: string | null
  pedido_em: string
  /** Último dia do prazo de resposta — e da suspensão das parcelas (D37). */
  resposta_ate: string
  status: StatusDaSolicitacao
  motivo_da_resposta: string | null
  respondido_em: string | null
  /** O que já entrou pelas parcelas do item — vai para "a devolver" se aprovar (D9). */
  pago_em_centavos: number
}

/** Corpo de `POST /cobrancas/avulsas` (Sprint 48, D23). */
export interface DadosDoLancamento {
  usuario_id: string
  descricao: string
  /** Positivo cobra; negativo credita (bolsa, desconto). */
  valor_em_centavos: number
  numero_de_parcelas: number
  /** `aaaa-mm-dd`. */
  primeiro_vencimento: string
}

/** Um lançamento avulso, na lista da tesouraria. Espelha `LancamentoDTO`. */
export interface Lancamento {
  item_de_cobranca_id: string
  plano_id: string
  usuario_id: string
  nome: string
  descricao: string | null
  valor_em_centavos: number
  numero_de_parcelas: number
  primeiro_vencimento: string
  lancado_em: string
  encerrado_em: string | null
  pago_em_centavos: number
}
