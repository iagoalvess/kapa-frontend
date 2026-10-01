import { api } from '@/lib/http/cliente'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  FiltroDeNotificacoes,
  Notificacao,
  Preferencia,
  Regra,
  Regua,
} from '../types/notificacoes.types'

const NOTIFICACOES = '/api/v1/notificacoes'

/** A régua da turma: os degraus do Kapa, cada um ligado ou não. */
export function obterRegua(signal?: AbortSignal) {
  return api.get<Regua>(`${NOTIFICACOES}/regras`, { signal })
}

/** Liga ou desliga um degrau. Devolve a régua inteira, já com a mudança. */
export function definirRegra({ id, ativa }: Pick<Regra, 'id' | 'ativa'>) {
  return api.put<Regua>(`${NOTIFICACOES}/regras/${id}`, { body: { ativa } })
}

/** Uma página do histórico: quem recebeu o quê, quando e com qual resultado. */
export function listarHistorico(filtro: FiltroDeNotificacoes, signal?: AbortSignal) {
  const { status, de, ate, busca, ...paginacao } = filtro

  return api.get<Pagina<Notificacao>>(`${NOTIFICACOES}/historico`, {
    query: { ...paginacaoNaQuery(paginacao), status, de, ate, busca },
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
