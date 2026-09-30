import { api } from '@/lib/http/cliente'
import type { FormularioDaInscricao } from '../schemas/listaDeEspera.schema'

/** O corpo da inscrição: o formulário, o token do Turnstile e a origem (UTM da URL). */
interface DadosDaInscricao extends FormularioDaInscricao {
  token_do_turnstile: string
  origem: string | null
}

/**
 * Inscreve na lista de espera — 204 para inscrição nova e repetida. É a Pages Function do site, na
 * mesma origem da página, e não a API (Sprint 36, P3).
 */
export function inscreverNaListaDeEspera(dados: DadosDaInscricao) {
  return api.post<void>('/api/lista-de-espera', { autenticar: false, naMesmaOrigem: true, body: dados })
}
