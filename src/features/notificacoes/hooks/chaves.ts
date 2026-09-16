import type { FiltroDeNotificacoes } from '../types/notificacoes.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  /** A régua da turma — gravar um degrau derruba a linha do tempo e o editor. */
  regua: ['notificacoes', 'regua'] as const,
  /** Prefixo de todo histórico: um disparo avulso muda a lista. */
  todoHistorico: ['notificacoes', 'historico'] as const,
  historico: (filtro: FiltroDeNotificacoes) => ['notificacoes', 'historico', filtro] as const,
  preferencias: ['notificacoes', 'preferencias'] as const,
}
