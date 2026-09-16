import type { StatusDaParcela } from '@/types/cobranca'
import type { CategoriaDeDespesa, StatusDaDespesa } from '@/types/financeiro'
import type { Caixa, GastoPorFornecedor, MesDoCaixa } from '@/types/financeiro'

/** Quanto do que já venceu entrou. Espelha `AdimplenciaDTO`. */
export interface Adimplencia {
  devido_em_centavos: number
  recebido_em_centavos: number
  em_atraso_em_centavos: number
  /** Base 10.000: `9850` é 98,5%. Sem nada vencido, 10.000. */
  percentual_base_dez_mil: number
}

/**
 * O painel da turma. Espelha `DashboardPublicoDTO`.
 *
 * Não existe campo de pessoa aqui, e é de propósito: o que a turma pode ver é soma. Nada de trazer
 * para o front o que o usuário não pode ver.
 */
export interface DashboardPublico {
  caixa: Caixa
  adimplencia: Adimplencia
  por_fornecedor: GastoPorFornecedor[]
  meses: MesDoCaixa[]
}

/** Uma linha agrupada do balancete. Espelha `LinhaDeBalanceteDTO`. */
export interface LinhaDeBalancete {
  rotulo: string
  quantidade: number
  valor_em_centavos: number
}

/** Um mês do período, no gráfico do balancete. Espelha `MesDoBalanceteDTO`. */
export interface MesDoBalancete {
  /** Primeiro dia do mês. */
  mes: string
  entradas_em_centavos: number
  saidas_em_centavos: number
}

/** Os totais do período anterior, de igual tamanho — a base da variação. Espelha `TotaisDoPeriodoDTO`. */
export interface TotaisDoPeriodo {
  entradas_em_centavos: number
  saidas_em_centavos: number
  /** Entradas menos saídas. Pode ser negativo. */
  resultado_em_centavos: number
}

/** O balancete do período. Espelha `BalanceteDTO`. */
export interface Balancete {
  formatura: string
  instituicao: string
  de: string
  ate: string
  emitido_por: string
  emitido_em: string
  entradas: LinhaDeBalancete[]
  saidas_por_categoria: LinhaDeBalancete[]
  saidas_por_fornecedor: LinhaDeBalancete[]
  entradas_em_centavos: number
  saidas_em_centavos: number
  /** Entradas menos saídas do período. Pode ser negativo. */
  saldo_do_periodo_em_centavos: number
  /** O saldo da turma hoje — o mesmo número do painel. */
  saldo_acumulado_em_centavos: number
  /** O movimento mês a mês dentro do período, sem buraco — a curva e os minigráficos da tela. */
  meses: MesDoBalancete[]
  anterior: TotaisDoPeriodo
}

/**
 * A variação de um número contra o mesmo número no período anterior, como o selo do indicador.
 *
 * Sem base não há percentual: o período anterior zerado devolve nada, em vez de "+∞%" ou de um
 * "+100%" que não quer dizer coisa alguma. Saída maior é vermelho e entrada maior é verde, então
 * quem chama diz o que significa subir.
 *
 * @param atual Valor do período escolhido, em centavos.
 * @param anterior O mesmo valor no período de antes.
 * @param subirEhBom `true` para entradas, `false` para saídas.
 */
export function variacao(atual: number, anterior: number, subirEhBom: boolean) {
  if (anterior <= 0) return undefined

  const percentual = Math.round(((atual - anterior) / anterior) * 100)
  if (percentual === 0) return { texto: 'igual ao anterior', tom: 'positivo' } as const

  return {
    texto: `${percentual > 0 ? '+' : ''}${percentual}%`,
    tom: percentual > 0 === subirEhBom ? ('positivo' as const) : ('negativo' as const),
  }
}

/** O intervalo que a tela pede. Ausente, a API assume o ano corrente até hoje. */
export interface PeriodoDoRelatorio {
  de?: string
  ate?: string
}

/**
 * O recorte de um relatório: o período mais o que estreita as linhas. Espelha `RecorteDoRelatorioDTO`.
 *
 * Um objeto só para os quatro relatórios, com cada um usando os campos que lhe dizem respeito — a
 * API ignora o que não for do tipo pedido, e o balancete ignora todos: recortado, ele deixa de
 * fechar. Quem diz o que cada um aceita é `FILTROS_DO_RELATORIO`.
 */
export interface FiltroDoRelatorio extends PeriodoDoRelatorio {
  fornecedor_id?: string
  categoria?: CategoriaDeDespesa
  situacao_da_despesa?: StatusDaDespesa
  formando_id?: string
  item_de_cobranca_id?: string
  situacao_da_parcela?: StatusDaParcela
}

/** Um recorte que a tela sabe oferecer. */
export type CampoDeFiltro = Exclude<keyof FiltroDoRelatorio, 'de' | 'ate'>

/**
 * Que recortes cada relatório aceita.
 *
 * É a mesma divisão do backend, e existe aqui para a tela **não oferecer** o que a API descartaria:
 * filtro que aparece, é escolhido e não muda nada é pior que filtro que não existe. O balancete não
 * tem entrada nenhuma de propósito.
 */
export const FILTROS_DO_RELATORIO = {
  Balancete: [],
  Despesas: ['fornecedor_id', 'categoria', 'situacao_da_despesa'],
  Parcelas: ['formando_id', 'item_de_cobranca_id', 'situacao_da_parcela'],
  Fornecedores: ['fornecedor_id'],
} as const satisfies Record<TipoDeRelatorio, readonly CampoDeFiltro[]>

/** Os campos de recorte em uso, na ordem em que a tela os desenha. */
export const CAMPOS_DE_FILTRO = [
  'fornecedor_id',
  'categoria',
  'situacao_da_despesa',
  'formando_id',
  'item_de_cobranca_id',
  'situacao_da_parcela',
] as const satisfies readonly CampoDeFiltro[]

/** Uma opção de um seletor de filtro. Espelha `OpcaoDeFiltroDTO`. */
export interface OpcaoDeFiltro {
  id: string
  nome: string
}

/** O que os seletores de filtro oferecem. Espelha `OpcoesDeFiltroDTO`. */
export interface OpcoesDeFiltro {
  fornecedores: OpcaoDeFiltro[]
  formandos: OpcaoDeFiltro[]
  itens: OpcaoDeFiltro[]
}

/** Os recortes que moram dentro do painel "Filtros"; os demais são seletores à vista na barra. */
const CAMPOS_DO_PAINEL = [
  'categoria',
  'situacao_da_despesa',
  'situacao_da_parcela',
] as const satisfies readonly CampoDeFiltro[]

/**
 * Quantos recortes escondidos estão ligados — o número no botão "Filtros".
 *
 * Conta só os do painel: os seletores da barra estão à vista, e somá-los aqui avisaria de novo o
 * que a pessoa já está lendo na tela.
 *
 * @param filtro Recorte em vigor.
 */
export const recortesLigados = (filtro: FiltroDoRelatorio) =>
  CAMPOS_DO_PAINEL.filter((campo) => filtro[campo] !== undefined).length

/** Em que pé está uma solicitação. */
export type StatusDaSolicitacao = 'NaFila' | 'Pronta' | 'Falhou'

/** O nome de cada situação na tela. */
export const ROTULOS_DE_SOLICITACAO = {
  NaFila: 'Gerando',
  Pronta: 'Pronto',
  Falhou: 'Falhou',
} as const satisfies Record<StatusDaSolicitacao, string>

/** Qual relatório. Espelha `TipoDeRelatorio` — valor de enum é dado, e vai como a API o escreve. */
export type TipoDeRelatorio = 'Balancete' | 'Despesas' | 'Parcelas' | 'Fornecedores'

/** Em que formato o relatório sai. */
export type FormatoDoRelatorio = 'excel' | 'pdf'

/**
 * O que cada formato entrega, e como o menu o anuncia.
 *
 * A diferença não é cosmética: a planilha é montada na própria requisição e baixa na hora; o PDF
 * entra na fila do worker, porque paginar e diagramar é o que demora.
 */
export const FORMATOS = {
  excel: { rotulo: 'Excel', dica: 'Planilha .xlsx, baixa na hora.' },
  pdf: { rotulo: 'PDF', dica: 'Documento para imprimir; fica pronto em instantes.' },
} as const satisfies Record<FormatoDoRelatorio, { rotulo: string; dica: string }>

/** O que cada relatório entrega, na ordem em que o menu os lista. */
export const RELATORIOS = [
  { tipo: 'Balancete', rotulo: 'Balancete do período', descricao: 'Entradas e saídas consolidadas.' },
  { tipo: 'Despesas', rotulo: 'Despesas lançadas', descricao: 'Uma linha por despesa, com fornecedor.' },
  {
    tipo: 'Parcelas',
    rotulo: 'Parcelas e pagamentos',
    descricao: 'Uma linha por parcela. Nomeia quem deve.',
  },
  {
    tipo: 'Fornecedores',
    rotulo: 'Fornecedores',
    descricao: 'O que já saiu e o que ainda sai para cada um.',
  },
] as const satisfies readonly { tipo: TipoDeRelatorio; rotulo: string; descricao: string }[]

/** O nome do relatório, para a fila — que mistura os quatro tipos. */
export const ROTULOS_DE_RELATORIO = Object.fromEntries(
  RELATORIOS.map(({ tipo, rotulo }) => [tipo, rotulo]),
) as Record<TipoDeRelatorio, string>

/** Uma solicitação de PDF. Espelha `SolicitacaoDTO`. */
export interface Solicitacao {
  id: string
  tipo: TipoDeRelatorio
  de: string
  ate: string
  status: StatusDaSolicitacao
  /** Por que falhou, quando falhou. */
  motivo?: string
  /** Quando o arquivo deixa de estar disponível. Ausente enquanto não ficou pronto. */
  expira_em?: string
  criado_em: string
  /** Se o download responde agora — é o que habilita o botão. */
  disponivel: boolean
}

/**
 * O índice de adimplência em percentual inteiro.
 *
 * A API manda em base 10.000, como todo percentual do contrato; a tela mostra o número redondo, e
 * sempre com o dígito ao lado do medidor — medidor sem número não se lê.
 */
export const percentualDeAdimplencia = ({ percentual_base_dez_mil }: Adimplencia) =>
  Math.round(percentual_base_dez_mil / 100)
