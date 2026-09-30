import { formatarCnpj, formatarCpf } from '@/lib/formato'
import type {
  CategoriaDeDespesa,
  CategoriaDeOutraReceita,
  MesDoCaixa,
  StatusDaDespesa,
  StatusDaOutraReceita,
} from '@/types/financeiro'

// O caixa e as categorias vivem em `types/financeiro` porque a feature `relatorios` mostra os
// mesmos números — e uma feature não importa de outra. Reexportados aqui para quem já os pedia
// deste módulo continuar pedindo do mesmo lugar.
export type {
  Caixa,
  CategoriaDeDespesa,
  CategoriaDeOutraReceita,
  GastoPorCategoria,
  GastoPorFornecedor,
  LancamentoDoCaixa,
  MesDoCaixa,
  OutraReceitaPorCategoria,
  StatusDaDespesa,
  StatusDaOutraReceita,
} from '@/types/financeiro'
export {
  fatiaDaCategoria,
  fatiaDaOutraReceita,
  ROTULOS_DE_CATEGORIA,
  ROTULOS_DE_CATEGORIA_DE_OUTRA_RECEITA,
  ROTULOS_DE_SITUACAO,
  ROTULOS_DE_SITUACAO_DA_OUTRA_RECEITA,
  totalDaCategoria,
} from '@/types/financeiro'

/** Um fornecedor da turma, com o que já foi gasto com ele. */
export interface Fornecedor {
  id: string
  nome: string
  /** Só dígitos; nulo quando a comissão não tem o documento. */
  documento: string | null
  categoria: CategoriaDeDespesa
  telefone: string | null
  email: string | null
  observacoes: string | null
  ativo: boolean
  /** Despesas lançadas com ele — com alguma, excluir devolve 409. */
  quantidade_de_despesas: number
  pago_em_centavos: number
  previsto_em_centavos: number
}

/** O cadastro do fornecedor, como a tela o envia. */
export interface DadosDoFornecedor {
  nome: string
  documento?: string
  categoria: CategoriaDeDespesa
  telefone?: string
  email?: string
  observacoes?: string
  ativo: boolean
}

/** Quantos fornecedores a turma tem em cada situação. Espelha `ContagemDeFornecedoresDTO`. */
export interface ContagemDeFornecedores {
  ativos: number
  inativos: number
}

/** Filtros da lista de fornecedores. */
export interface FiltroDeFornecedores {
  pagina?: number
  tamanho?: number
  ativo?: boolean
  categoria?: CategoriaDeDespesa
  busca?: string
}

/** Uma despesa da turma. */
export interface Despesa {
  id: string
  /** O lançamento que a criou — as parcelas irmãs de uma parcelada têm o mesmo. */
  lancamento_id: string
  fornecedor_id: string | null
  /** Item da festa que esta despesa paga; nulo, é um gasto que não é da festa. */
  item_da_festa_id: string | null
  fornecedor: string | null
  descricao: string
  categoria: CategoriaDeDespesa
  valor_em_centavos: number
  /** Mês do gasto, sempre no dia 1. */
  competencia: string
  vencimento: string
  numero: number
  total_de_parcelas: number
  status: StatusDaDespesa
  pago_em: string | null
  tem_comprovante: boolean
  /** Prevista com vencimento no passado. Vem calculado da API. */
  atrasada: boolean
}

/** O lançamento, como o formulário o envia: o valor é o total do compromisso. */
export interface NovaDespesa {
  fornecedor_id?: string
  /** Item da festa que esta despesa paga; nulo, é um gasto que não é da festa. */
  item_da_festa_id?: string
  descricao: string
  categoria: CategoriaDeDespesa
  valor_em_centavos: number
  numero_de_parcelas: number
  competencia: string
  vencimento: string
  /** Preenchido quando a despesa já nasce paga — exige comprovante. */
  paga_em?: string
}

/** A correção de uma linha já lançada. */
export interface DadosDaDespesa {
  fornecedor_id?: string
  /** Item da festa que esta despesa paga; nulo, é um gasto que não é da festa. */
  item_da_festa_id?: string
  descricao: string
  categoria: CategoriaDeDespesa
  valor_em_centavos: number
  competencia: string
  vencimento: string
}

/** Filtros da lista de despesas. */
export interface FiltroDeDespesas {
  pagina?: number
  tamanho?: number
  /** Só as linhas deste lançamento — as parcelas de uma parcelada. */
  lancamento_id?: string
  fornecedor_id?: string
  categoria?: CategoriaDeDespesa
  status?: StatusDaDespesa
  atrasadas?: boolean
  de?: string
  ate?: string
  busca?: string
}

/** Quantos lançamentos — despesas ou receitas — e quanto somam. Espelha `SomaDeLancamentosDTO`. */
interface SomaDeLancamentos {
  quantidade: number
  valor_em_centavos: number
}

/** A faixa da tela Despesas, no mesmo filtro da lista. */
export interface ResumoDeDespesas {
  todas: SomaDeLancamentos
  prevista: SomaDeLancamentos
  atrasada: SomaDeLancamentos
  paga: SomaDeLancamentos
  cancelada: SomaDeLancamentos
}

/** O documento do acervo ligado a uma receita — o comprovante. Abre para qualquer membro. */
interface DocumentoDaOutraReceita {
  id: string
  titulo: string
  nome_do_arquivo: string
  content_type: string
}

/** Dinheiro que entrou, ou vai entrar, sem ser parcela de formando: patrocínio, evento, doação. */
export interface OutraReceita {
  id: string
  descricao: string
  /** Quem pagou, em texto livre — "Clínica Sorriso". */
  origem: string | null
  categoria: CategoriaDeOutraReceita
  valor_em_centavos: number
  /** O dia previsto, na prevista; o dia em que entrou, na recebida. */
  data: string
  status: StatusDaOutraReceita
  /** Prevista com a data no passado. Vem calculado da API. */
  atrasada: boolean
  documento: DocumentoDaOutraReceita | null
}

/** O lançamento de uma receita, como o formulário o envia. */
export interface NovaOutraReceita {
  descricao: string
  origem?: string
  categoria: CategoriaDeOutraReceita
  valor_em_centavos: number
  data: string
  /** Já caiu na conta: nasce recebida, e a data não pode ser futura. */
  recebida?: boolean
  documento_id?: string
}

/** A correção de uma receita lançada — prevista ou recebida. */
export type DadosDaOutraReceita = Omit<NovaOutraReceita, 'recebida'>

/** Filtros da lista de receitas. */
export interface FiltroDeOutrasReceitas {
  pagina?: number
  tamanho?: number
  categoria?: CategoriaDeOutraReceita
  status?: StatusDaOutraReceita
  atrasadas?: boolean
  de?: string
  ate?: string
  busca?: string
}

/** A faixa da tela Receitas, no mesmo filtro da lista. */
export interface ResumoDeOutrasReceitas {
  todas: SomaDeLancamentos
  prevista: SomaDeLancamentos
  atrasada: SomaDeLancamentos
  recebida: SomaDeLancamentos
  cancelada: SomaDeLancamentos
}

/** O caixa mês a mês: realizado até hoje, projetado até a colação. */
export interface ProjecaoDoCaixa {
  meses: MesDoCaixa[]
  saldo_em_centavos: number
  em_atraso_em_centavos: number
}

/** O rótulo da linha: "Buffet 2/3" na parcelada, só a descrição na despesa à vista. */
export function rotuloDaDespesa(despesa: Despesa) {
  return despesa.total_de_parcelas > 1
    ? `${despesa.descricao} ${despesa.numero}/${despesa.total_de_parcelas}`
    : despesa.descricao
}

/** CNPJ tem 14 dígitos, CPF tem 11 — a máscara sai do tamanho, sem campo de tipo no cadastro. */
export function formatarDocumento(documento: string) {
  return documento.length === 14 ? formatarCnpj(documento) : formatarCpf(documento)
}
