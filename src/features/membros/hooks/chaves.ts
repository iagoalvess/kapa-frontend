import type { FiltroDeMembros } from '../types/membros.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['membros'] as const,
  lista: (filtro: FiltroDeMembros) => ['membros', 'lista', filtro] as const,
  resumo: () => ['membros', 'resumo'] as const,
  saida: (usuario_id: string) => ['membros', 'saida', usuario_id] as const,
}
