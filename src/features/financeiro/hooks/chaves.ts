import type {
  FiltroDeDespesas,
  FiltroDeFornecedores,
  FiltroDeOutrasReceitas,
} from '../types/financeiro.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['financeiro'] as const,
  /** Prefixo de todo fornecedor: cadastrar, alterar e excluir derrubam as listas. */
  todosOsFornecedores: ['financeiro', 'fornecedores'] as const,
  fornecedores: (filtro: FiltroDeFornecedores) => ['financeiro', 'fornecedores', filtro] as const,
  fornecedor: (id: string) => ['financeiro', 'fornecedores', 'um', id] as const,
  resumoDeFornecedores: ['financeiro', 'fornecedores', 'resumo'] as const,
  /** Prefixo de toda despesa: lançar, pagar e cancelar mudam lista, resumo e caixa. */
  todasAsDespesas: ['financeiro', 'despesas'] as const,
  despesas: (filtro: FiltroDeDespesas) => ['financeiro', 'despesas', filtro] as const,
  despesa: (id: string) => ['financeiro', 'despesas', 'uma', id] as const,
  resumo: (filtro: Omit<FiltroDeDespesas, 'status' | 'pagina' | 'tamanho'>) =>
    ['financeiro', 'despesas', 'resumo', filtro] as const,
  /** Prefixo de toda receita: lançar, receber e cancelar mudam lista, resumo e caixa. */
  todasAsOutrasReceitas: ['financeiro', 'outras-receitas'] as const,
  outrasReceitas: (filtro: FiltroDeOutrasReceitas) => ['financeiro', 'outras-receitas', filtro] as const,
  resumoDeOutrasReceitas: (
    filtro: Omit<FiltroDeOutrasReceitas, 'status' | 'atrasadas' | 'pagina' | 'tamanho'>,
  ) => ['financeiro', 'outras-receitas', 'resumo', filtro] as const,
  /** Prefixo do caixa: toda escrita do financeiro o invalida, porque saldo é agregação. */
  caixa: ['financeiro', 'caixa'] as const,
  consolidado: ['financeiro', 'caixa', 'consolidado'] as const,
  projecao: ['financeiro', 'caixa', 'projecao'] as const,
}
