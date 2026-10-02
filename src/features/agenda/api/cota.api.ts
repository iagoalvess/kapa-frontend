import { api } from '@/lib/http/cliente'
import type { DadosDaCota, EventoDoConvite, PainelDaCota } from '@/types/festa'

const COTA = '/api/v1/festa/cota'

/** O painel da cota de um evento (festa ou colação). 404 `agenda.evento_nao_encontrado` sem o evento. */
export function buscarCota(tipo: EventoDoConvite['tipo'], signal?: AbortSignal) {
  return api.get<PainelDaCota>(`${COTA}?tipo=${tipo}`, { signal })
}

/** Grava a cota e a capacidade. Depois de aberta, a cota só sobe (`festa.cota_ja_aberta`). */
export function definirCota(tipo: EventoDoConvite['tipo'], dados: DadosDaCota) {
  return api.put<PainelDaCota>(`${COTA}?tipo=${tipo}`, { body: dados })
}

/** Abre ou reabre a cota: emite o que falta a cada formando ativo. Reabrir não duplica. */
export function abrirCota(tipo: EventoDoConvite['tipo']) {
  return api.post<PainelDaCota>(`${COTA}/abrir?tipo=${tipo}`)
}
