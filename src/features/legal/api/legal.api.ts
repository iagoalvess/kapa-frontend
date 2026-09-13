import type { TipoDeDocumento } from '@/config/legal'
import { api } from '@/lib/http/cliente'
import type { AceiteDeDocumento, DocumentoLegal, MeusAceites } from '../types/legal.types'

const BASE = '/api/v1/legal'

/** Uma versão específica — o link permanente de um aceite. Pública. */
export function obterVersao(tipo: TipoDeDocumento, versao: string, signal?: AbortSignal) {
  return api.get<DocumentoLegal>(`${BASE}/${tipo}/${encodeURIComponent(versao)}`, {
    autenticar: false,
    signal,
  })
}

/** Histórico de aceites do usuário e o que falta aceitar. */
export function obterMeusAceites(signal?: AbortSignal) {
  return api.get<MeusAceites>(`${BASE}/meus-aceites`, { signal })
}

/** Registra o aceite das versões vigentes informadas. */
export function registrarAceites(aceites: AceiteDeDocumento[]) {
  return api.post<void>(`${BASE}/aceites`, { body: { aceites } })
}
