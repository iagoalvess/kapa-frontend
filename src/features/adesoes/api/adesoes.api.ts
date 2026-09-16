import { api } from '@/lib/http/cliente'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  Adesao,
  CodigoEnviado,
  ConteudoParaAdesao,
  FiltroDeAdesoes,
  MinhaAdesao,
  ResumoDeAdesoes,
  SituacaoDeAdesao,
  TermoPublicado,
  VersaoDoTermo,
} from '../types/adesoes.types'

const BASE = '/api/v1/adesoes'

/** O termo vigente, o plano vigente e o hash dos dois — o que a tela exibe antes do aceite. */
export function obterConteudoParaAdesao(signal?: AbortSignal) {
  return api.get<ConteudoParaAdesao>(`${BASE}/termos/vigente`, { signal })
}

/** A própria adesão mais recente e o que falta no cadastro para aderir. */
export function obterMinhaAdesao(signal?: AbortSignal) {
  return api.get<MinhaAdesao>(`${BASE}/eu`, { signal })
}

/** Pede o código de seis dígitos do aceite; a resposta diz em que e-mail ele caiu. */
export function solicitarCodigo() {
  return api.post<CodigoEnviado>(`${BASE}/codigo`)
}

/**
 * Aceita o termo vigente. O hash é o que a tela recebeu com o conteúdo: se o termo ou o plano mudou
 * enquanto a pessoa lia, a API recusa com `adesao.termo_desatualizado`. O código é o que chegou por
 * e-mail; vencido ou errado, a API recusa com `adesao.codigo_invalido`.
 */
export function aderir({ hash_do_conteudo, codigo }: { hash_do_conteudo: string; codigo: string }) {
  return api.post<Adesao>(BASE, { body: { hash_do_conteudo, codigo } })
}

/** O termo assinado em PDF, remontado pela API. */
export function baixarPdf(adesao_id: string) {
  return api.get<Blob>(`${BASE}/${adesao_id}/pdf`, { resposta: 'blob' })
}

/** As versões publicadas. Só o Presidente. */
export function listarTermos(signal?: AbortSignal) {
  return api.get<TermoPublicado[]>(`${BASE}/termos`, { signal })
}

/** Publica a versão seguinte do termo. Só o Presidente. */
export function publicarTermo(conteudo: string) {
  return api.post<VersaoDoTermo>(`${BASE}/termos`, { body: { conteudo } })
}

/** Quem aderiu e quem falta. Gestão. */
export function listarSituacoes(filtro: FiltroDeAdesoes, signal?: AbortSignal) {
  return api.get<Pagina<SituacaoDeAdesao>>(BASE, {
    query: { ...paginacaoNaQuery(filtro), aderiu: filtro.aderiu, busca: filtro.busca },
    signal,
  })
}

/** Quantos aderiram, de quantos. Gestão. */
export function obterResumo(signal?: AbortSignal) {
  return api.get<ResumoDeAdesoes>(`${BASE}/resumo`, { signal })
}

/** Lembra por e-mail quem ainda não aderiu à versão vigente. Gestão. */
export function lembrar(usuario_id: string) {
  return api.post<void>(`${BASE}/${usuario_id}/lembrete`)
}
