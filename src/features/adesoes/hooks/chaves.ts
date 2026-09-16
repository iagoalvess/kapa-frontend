import type { FiltroDeAdesoes } from '../types/adesoes.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['adesoes'] as const,
  conteudo: () => ['adesoes', 'conteudo'] as const,
  minha: () => ['adesoes', 'minha'] as const,
  termos: () => ['adesoes', 'termos'] as const,
  resumo: () => ['adesoes', 'resumo'] as const,
  /** Prefixo de toda página do painel: aderir ou publicar muda quem está em cada filtro. */
  situacoes: ['adesoes', 'situacoes'] as const,
  situacao: (filtro: FiltroDeAdesoes) => ['adesoes', 'situacoes', filtro] as const,
}
