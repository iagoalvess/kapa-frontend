import type { FiltroDeAdesoes } from '../types/adesoes.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['adesoes'] as const,
  conteudo: (pacotes: string[] = []) => ['adesoes', 'conteudo', pacotes] as const,
  minha: () => ['adesoes', 'minha'] as const,
  /** Sob `minha`: aderir e publicar já invalidam `adesoes` inteiro, e a guarda solta a pessoa junto. */
  minhaSituacao: () => ['adesoes', 'minha', 'situacao'] as const,
  /** A cesta viva do formando (Sprint 48) — o aditivo e o cancelamento a mudam. */
  cesta: () => ['adesoes', 'cesta'] as const,
  termos: () => ['adesoes', 'termos'] as const,
  resumo: () => ['adesoes', 'resumo'] as const,
  /** Prefixo de toda página do painel: aderir ou publicar muda quem está em cada filtro. */
  situacoes: ['adesoes', 'situacoes'] as const,
  situacao: (filtro: FiltroDeAdesoes) => ['adesoes', 'situacoes', filtro] as const,
}
