import { api } from '@/lib/http/cliente'
import type {
  MeusDados,
  Operador,
  SolicitacaoDePrivacidade,
  TipoDeSolicitacao,
} from '../types/privacidade.types'

const PRIVACIDADE = '/api/v1/privacidade'

/** Tudo o que a Kapa guarda sobre o titular, por seção — conta, turmas, consentimentos, comunicações. */
export function obterMeusDados(signal?: AbortSignal) {
  return api.get<MeusDados>(`${PRIVACIDADE}/meus-dados`, { signal })
}

/**
 * Abre uma solicitação de exportação ou de eliminação.
 *
 * Volta na hora; quem trabalha é o worker. Pedido igual já pendente devolve o mesmo, então dois
 * cliques no botão não viram dois pedidos.
 */
export function solicitar(tipo: TipoDeSolicitacao, senha?: string) {
  return api.post<SolicitacaoDePrivacidade>(`${PRIVACIDADE}/solicitacoes`, { body: { tipo, senha } })
}

/** As solicitações do titular, da mais recente. */
export function listarSolicitacoes(signal?: AbortSignal) {
  return api.get<SolicitacaoDePrivacidade[]>(`${PRIVACIDADE}/solicitacoes`, { signal })
}

/** Confirma a eliminação e dispensa a espera dos quinze dias. */
export function confirmarSolicitacao(id: string) {
  return api.post<SolicitacaoDePrivacidade>(`${PRIVACIDADE}/solicitacoes/${id}/confirmar`)
}

/** Desiste de uma solicitação ainda pendente. */
export function cancelarSolicitacao(id: string) {
  return api.post<SolicitacaoDePrivacidade>(`${PRIVACIDADE}/solicitacoes/${id}/cancelar`)
}

/**
 * O pacote de uma exportação concluída.
 *
 * Vem como blob porque o endpoint exige o bearer, e uma aba aberta por `href` não o manda — o mesmo
 * motivo do PDF do balancete.
 */
export function baixarPacote(id: string) {
  return api.get<Blob>(`${PRIVACIDADE}/solicitacoes/${id}/arquivo`, { resposta: 'blob' })
}

/** Revoga um consentimento registrado. Grava linha nova; o aceite original fica. */
export function revogarConsentimento(id: string) {
  return api.post<void>(`${PRIVACIDADE}/consentimentos/${id}/revogar`)
}

/** Com quem a Kapa compartilha dado pessoal. Anônimo: abre antes do cadastro. */
export function listarOperadores(signal?: AbortSignal) {
  return api.get<Operador[]>(`${PRIVACIDADE}/operadores`, { signal })
}
