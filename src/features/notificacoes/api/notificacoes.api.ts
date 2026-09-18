import { api } from '@/lib/http/cliente'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  DadosDaRegra,
  FiltroDeNotificacoes,
  Notificacao,
  Preferencia,
  Regua,
} from '../types/notificacoes.types'

const NOTIFICACOES = '/api/v1/notificacoes'

/** A régua da turma. Quem nunca configurou recebe a padrão, já gravada pela API. */
export function obterRegua(signal?: AbortSignal) {
  return api.get<Regua>(`${NOTIFICACOES}/regras`, { signal })
}

/** Grava a régua inteira. Variável desconhecida a API recusa com 400, antes de qualquer envio. */
export function salvarRegua(regras: DadosDaRegra[]) {
  return api.put<Regua>(`${NOTIFICACOES}/regras`, { body: { regras } })
}

/** Manda o degrau com dados de exemplo para o e-mail de quem clicou. A turma não recebe nada. */
export function testarRegra(id: string) {
  return api.post<void>(`${NOTIFICACOES}/regras/${id}/testar`)
}

/** Uma página do histórico: quem recebeu o quê, quando e com qual resultado. */
export function listarHistorico(filtro: FiltroDeNotificacoes, signal?: AbortSignal) {
  const { status, busca, ...paginacao } = filtro

  return api.get<Pagina<Notificacao>>(`${NOTIFICACOES}/historico`, {
    query: { ...paginacaoNaQuery(paginacao), status, busca },
    signal,
  })
}

/** O que o próprio membro escolheu receber. */
export function obterPreferencias(signal?: AbortSignal) {
  return api.get<Preferencia[]>(`${NOTIFICACOES}/preferencias/eu`, { signal })
}

/** Grava as escolhas do próprio membro. Desligar a cobrança a API recusa com 409. */
export function salvarPreferencias(preferencias: Pick<Preferencia, 'tipo' | 'ativa'>[]) {
  return api.put<Preferencia[]>(`${NOTIFICACOES}/preferencias/eu`, { body: { preferencias } })
}

/** Cobra uma parcela agora, à mão, com o degrau de atraso mais próximo. */
export function cobrarParcela(parcelaId: string) {
  return api.post<void>(`${NOTIFICACOES}/cobrar/${parcelaId}`)
}
