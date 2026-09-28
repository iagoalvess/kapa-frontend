import { api } from '@/lib/http/cliente'
import type { DadosDaCota, PainelDaCota } from '@/types/festa'

const COTA = '/api/v1/festa/colacao/cota'

/** O painel da cota da colação. 404 `agenda.evento_nao_encontrado` sem colação na agenda. */
export function buscarCota(signal?: AbortSignal) {
  return api.get<PainelDaCota>(COTA, { signal })
}

/** Grava a cota e a capacidade. Depois de aberta, a cota só sobe (`festa.cota_ja_aberta`). */
export function definirCota(dados: DadosDaCota) {
  return api.put<PainelDaCota>(COTA, { body: dados })
}

/** Abre ou reabre a cota: emite o que falta a cada formando ativo. Reabrir não duplica. */
export function abrirCota() {
  return api.post<PainelDaCota>(`${COTA}/abrir`)
}
