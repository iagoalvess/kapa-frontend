/**
 * Em que a turma gasta. Lista fechada — a mesma do backend.
 *
 * Valor, e não só tipo: o `z.enum` da despesa e o do item da festa precisam da lista em tempo de
 * execução, e cada um copiava a sua.
 */
export const CATEGORIAS_DE_DESPESA = [
  'Buffet',
  'Espaco',
  'Banda',
  'Fotografia',
  'Decoracao',
  'Convites',
  'Beca',
  'Taxas',
  'Outros',
] as const

/** Em que a turma gasta. */
export type CategoriaDeDespesa = (typeof CATEGORIAS_DE_DESPESA)[number]

/**
 * O nome de cada categoria na tela, na ordem em que a lista as mostra.
 *
 * Mora em `types/` porque as despesas (feature `financeiro`) e os painéis (feature `relatorios`)
 * mostram a mesma categoria — e uma feature não importa de outra. O valor é contrato da API e vem
 * sem acento; o rótulo é o que a turma lê.
 */
export const ROTULOS_DE_CATEGORIA = {
  Buffet: 'Buffet',
  Espaco: 'Espaço',
  Banda: 'Banda',
  Fotografia: 'Fotografia',
  Decoracao: 'Decoração',
  Convites: 'Convites',
  Beca: 'Beca',
  Taxas: 'Taxas',
  Outros: 'Outros',
} as const satisfies Record<CategoriaDeDespesa, string>

/** Situação de uma despesa. "Atrasada" não é status: é `Prevista` com vencimento no passado. */
export type StatusDaDespesa = 'Prevista' | 'Paga' | 'Cancelada'

/**
 * O nome de cada situação na tela.
 *
 * Mora aqui pelo mesmo motivo de `ROTULOS_DE_CATEGORIA`: a lista de despesas (feature `financeiro`)
 * e o filtro dos relatórios (feature `relatorios`) escrevem a mesma palavra, e uma feature não
 * importa de outra. A feature `financeiro` reexporta os dois.
 */
export const ROTULOS_DE_SITUACAO = {
  Prevista: 'A pagar',
  Paga: 'Paga',
  Cancelada: 'Cancelada',
} as const satisfies Record<StatusDaDespesa, string>

/** Quanto a turma gastou numa categoria. Espelha `GastoPorCategoriaDTO`. */
export interface GastoPorCategoria {
  categoria: CategoriaDeDespesa
  quantidade: number
  pago_em_centavos: number
  previsto_em_centavos: number
}

/** Quanto a turma pagou a um fornecedor. Espelha `GastoPorFornecedorDTO`. */
export interface GastoPorFornecedor {
  /** Nulo nos gastos sem fornecedor cadastrado — uma taxa bancária, um reembolso. */
  fornecedor_id: string | null
  nome: string
  quantidade: number
  pago_em_centavos: number
  previsto_em_centavos: number
}

/** Um mês do fluxo de caixa. Espelha `MesDoCaixaDTO`. */
export interface MesDoCaixa {
  mes: string
  entradas_em_centavos: number
  saidas_em_centavos: number
  entradas_previstas_em_centavos: number
  saidas_previstas_em_centavos: number
  saldo_acumulado_em_centavos: number
  /** Mês no futuro: a tela desenha pontilhado e rotula como projeção. */
  projetado: boolean
}

/** O caixa de hoje. Espelha `CaixaDTO`. */
export interface Caixa {
  arrecadado_em_centavos: number
  gasto_em_centavos: number
  saldo_em_centavos: number
  a_receber_em_centavos: number
  em_atraso_em_centavos: number
  saldo_projetado_em_centavos: number
  por_categoria: GastoPorCategoria[]
  /** O que entrou sem ser parcela de formando, por categoria (Sprint 28). */
  outras_receitas_por_categoria: OutraReceitaPorCategoria[]
  /** Entradas e saídas misturadas — a receita recebida entra aqui como entrada. */
  ultimos: LancamentoDoCaixa[]
}

/** Uma linha do extrato do caixa. Espelha `LancamentoDTO`. */
export interface LancamentoDoCaixa {
  data: string
  descricao: string
  valor_em_centavos: number
  entrada: boolean
}

/** O que a categoria custa à turma: o que já saiu mais o que ainda vai sair. */
export const totalDaCategoria = (linha: GastoPorCategoria) =>
  linha.pago_em_centavos + linha.previsto_em_centavos

/** A categoria como fatia da rosca — o tamanho é o que ela custa, não o estágio de pagamento. */
export const fatiaDaCategoria = (linha: GastoPorCategoria) => ({
  chave: linha.categoria,
  rotulo: ROTULOS_DE_CATEGORIA[linha.categoria],
  valor: totalDaCategoria(linha),
})

/** O fornecedor como fatia da rosca: só o que já saiu para ele. */
export const fatiaDoFornecedor = (linha: GastoPorFornecedor) => ({
  chave: linha.fornecedor_id ?? 'sem-fornecedor',
  rotulo: linha.nome,
  valor: linha.pago_em_centavos,
})

/**
 * De onde vem o dinheiro que não é parcela de formando (Sprint 28). Lista fechada — a mesma do
 * backend, pelo mesmo motivo das categorias de despesa: livre, o quadro do caixa deixa de somar.
 */
export const CATEGORIAS_DE_OUTRA_RECEITA = [
  'Patrocinio',
  'Evento',
  'Doacao',
  'Rendimento',
  'VendaDeConvite',
  'Outros',
] as const

/** De onde vem uma receita. */
export type CategoriaDeOutraReceita = (typeof CATEGORIAS_DE_OUTRA_RECEITA)[number]

/** O nome de cada categoria de receita na tela. Mora aqui porque o caixa também a mostra. */
export const ROTULOS_DE_CATEGORIA_DE_OUTRA_RECEITA = {
  Patrocinio: 'Patrocínio',
  Evento: 'Evento de arrecadação',
  Doacao: 'Doação',
  Rendimento: 'Rendimento',
  VendaDeConvite: 'Venda de convite',
  Outros: 'Outros',
} as const satisfies Record<CategoriaDeOutraReceita, string>

/** Situação de uma receita. "Atrasada" não é status: é `Prevista` com a data no passado. */
export type StatusDaOutraReceita = 'Prevista' | 'Recebida' | 'Cancelada'

/** O nome de cada situação da receita na tela. */
export const ROTULOS_DE_SITUACAO_DA_OUTRA_RECEITA = {
  Prevista: 'A receber',
  Recebida: 'Recebida',
  Cancelada: 'Cancelada',
} as const satisfies Record<StatusDaOutraReceita, string>

/**
 * Quanto entrou numa categoria de receita. Espelha `ReceitaPorCategoriaDTO`.
 *
 * O previsto vem à parte e não soma no arrecadado (P2 da Sprint 28): patrocínio prometido não é
 * dinheiro na conta.
 */
export interface OutraReceitaPorCategoria {
  categoria: CategoriaDeOutraReceita
  quantidade: number
  recebido_em_centavos: number
  previsto_em_centavos: number
}

/** A categoria de receita como fatia da rosca: só o que já entrou. */
export const fatiaDaOutraReceita = (linha: OutraReceitaPorCategoria) => ({
  chave: linha.categoria,
  rotulo: ROTULOS_DE_CATEGORIA_DE_OUTRA_RECEITA[linha.categoria],
  valor: linha.recebido_em_centavos,
})
