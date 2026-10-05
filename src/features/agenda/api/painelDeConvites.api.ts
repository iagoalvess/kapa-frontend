import { api } from '@/lib/http/cliente'
import type { EventoDoConvite, PainelDeConvites } from '@/types/festa'

const PAINEL = '/api/v1/festa/painel-de-convites'

/** O painel de convites de um evento (festa ou colação). 404 `agenda.evento_nao_encontrado` sem o evento. */
export function buscarPainelDeConvites(tipo: EventoDoConvite['tipo'], signal?: AbortSignal) {
  return api.get<PainelDeConvites>(PAINEL, { query: { tipo }, signal })
}

/** Grava a capacidade do local. Passar dela avisa no painel e salva. */
export function definirCapacidade(tipo: EventoDoConvite['tipo'], capacidade: number | null) {
  return api.put<PainelDeConvites>(`${PAINEL}/capacidade`, { query: { tipo }, body: { capacidade } })
}

/** Solta os convites de pacote de um formando presos por atraso, em todos os eventos (D24). */
export function liberarConvitesPresos(vinculoId: string) {
  return api.post<{ liberados: number }>(`${PAINEL}/presos/${vinculoId}/liberacao`)
}
