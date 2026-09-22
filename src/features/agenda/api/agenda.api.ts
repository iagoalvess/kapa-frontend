import { api } from '@/lib/http/cliente'
import type { DadosDoEvento, EventoDaTurma } from '@/types/agenda'

const AGENDA = '/api/v1/agenda'

/*
  A criação mora em `hooks/useAgenda`, junto da leitura: quem marca a colação e a festa da turma
  nova é o wizard de criação da formatura, que é outra feature. As duas escritas que só esta tela
  faz ficam aqui.
*/

/** Corrige uma data — inclusive a de um evento cancelado, que é como se remarca. */
export function atualizarEvento({ id, dados }: { id: string; dados: DadosDoEvento }) {
  return api.put<EventoDaTurma>(`${AGENDA}/${id}`, { body: dados })
}

/** Tira o evento da agenda. O que a turma desmarcou vira `Cancelado`, e não some. */
export function excluirEvento(id: string) {
  return api.delete<void>(`${AGENDA}/${id}`)
}
