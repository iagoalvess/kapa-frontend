import type { FiltroDeFormandos } from '../types/formandos.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['formandos'] as const,
  meu: () => ['formandos', 'eu'] as const,
  listas: ['formandos', 'lista'] as const,
  lista: (filtro: FiltroDeFormandos) => ['formandos', 'lista', filtro] as const,
  detalhe: (usuarioId: string) => ['formandos', 'detalhe', usuarioId] as const,
  foto: (arquivoId: string) => ['formandos', 'foto', arquivoId] as const,
}
