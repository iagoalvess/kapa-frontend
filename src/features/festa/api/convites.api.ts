import { api } from '@/lib/http/cliente'
import type {
  ConsultaNaPortaria,
  ConviteNaPortaria,
  ConvitePublico,
  DadosDoConvidado,
  EntradaNaPortaria,
  EntradaSemRede,
  ListaDaPortaria,
  MeuConvite,
  MeusConvites,
  ResultadoDaSincronizacao,
  TipoDoEventoDoConvite,
} from '../types/convites.types'

const CONVITES = '/api/v1/festa/convites'
const PORTARIA = '/api/v1/festa/portaria'

/** Os convites do próprio formando para a festa (os comprados) ou para a colação (os da cota). */
export function buscarMeusConvites(tipo: TipoDoEventoDoConvite, signal?: AbortSignal) {
  return api.get<MeusConvites>(`${CONVITES}/meus`, { signal, query: { tipo } })
}

/** A página pública do convite — sem sessão, pelo token do QR. */
export function buscarConvitePublico(token: string, signal?: AbortSignal) {
  return api.get<ConvitePublico>(`${CONVITES}/${encodeURIComponent(token)}`, { signal })
}

/** O convite em PDF. Público, como a página. */
export function baixarConviteEmPdf(token: string) {
  return api.get<Blob>(`${CONVITES}/${encodeURIComponent(token)}/pdf`, { resposta: 'blob' })
}

/** Nomeia ou troca o convidado. Trocar o titular devolve o convite com código novo (decisão 17). */
export function nomearConvidado({ id, dados }: { id: string; dados: DadosDoConvidado }) {
  return api.put<MeuConvite>(`${CONVITES}/${id}/convidado`, { body: dados })
}

/** Revoga o código e emite outro para o mesmo convidado. */
export function reemitirConvite(id: string) {
  return api.post<ConviteNaPortaria>(`${CONVITES}/${id}/reemitir`)
}

/** Convite da turma, sem dono: o paraninfo, o patrocinador (decisão 14). Sem `evento_id`, é da festa. */
export function emitirCortesia(dados: DadosDoConvidado & { motivo: string; evento_id?: string }) {
  return api.post<ConviteNaPortaria>(`${CONVITES}/cortesias`, { body: dados })
}

/** Emite os convites de um pedido antes da quitação (P2). */
export function liberarConvites(dados: { pedido_id: string; motivo: string }) {
  return api.post<{ quantidade: number }>(`${CONVITES}/liberar`, { body: dados })
}

/** Emite os convites dos pedidos quitados que esperavam a festa ficar completa na agenda. */
export function emitirPendentes() {
  return api.post<{ quantidade: number }>(`${CONVITES}/emitir-pendentes`)
}

/** A lista da portaria do evento, com a busca por nome ou código. */
export function buscarPortaria(tipo: TipoDoEventoDoConvite, busca: string | undefined, signal?: AbortSignal) {
  return api.get<ListaDaPortaria>(PORTARIA, { signal, query: { tipo, busca } })
}

/** A lista da portaria em PDF, com o documento inteiro — a que o salão pede. */
export function baixarListaDaPortaria(tipo: TipoDoEventoDoConvite) {
  return api.get<Blob>(`${PORTARIA}/pdf`, { resposta: 'blob', query: { tipo } })
}

/** Um convite como a portaria o vê. 404 quando não é desta turma. */
export function consultarNaPortaria(codigo: string, signal?: AbortSignal) {
  return api.get<ConsultaNaPortaria>(`${PORTARIA}/convites/${encodeURIComponent(codigo)}`, { signal })
}

/**
 * Valida a entrada. A segunda vez responde 409 `festa.ja_validado`, com a entrada anterior em `dados`.
 *
 * Com `eventoId`, convite de outro evento responde 409 `festa.outro_evento`: a portaria da colação não
 * deixa entrar o convite da festa. Sem ele — a câmera abrindo o QR —, vale o evento do próprio convite.
 */
export function validarEntrada({ codigo, eventoId }: { codigo: string; eventoId?: string }) {
  return api.post<EntradaNaPortaria>(`${CONVITES}/${encodeURIComponent(codigo)}/check-in`, {
    body: { evento_id: eventoId ?? null },
  })
}

/** Desfaz uma entrada validada por engano. */
export function desfazerEntrada(checkInId: string) {
  return api.post<void>(`/api/v1/festa/check-ins/${checkInId}/desfazer`)
}

/** Sobe as entradas registradas no celular sem internet (decisão 16). */
export function sincronizarEntradas(entradas: EntradaSemRede[]) {
  return api.post<ResultadoDaSincronizacao>('/api/v1/festa/check-ins/sincronizar', { body: { entradas } })
}
