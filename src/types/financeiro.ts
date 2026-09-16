/** Em que a turma gasta. Lista fechada — a mesma do backend. */
export type CategoriaDeDespesa =
  'Buffet' | 'Espaco' | 'Banda' | 'Fotografia' | 'Decoracao' | 'Convites' | 'Beca' | 'Taxas' | 'Outros'

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
  /** Ausente nos gastos sem fornecedor cadastrado — uma taxa bancária, um reembolso. */
  fornecedor_id?: string
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
