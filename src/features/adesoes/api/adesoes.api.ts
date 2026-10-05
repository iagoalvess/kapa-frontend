import { api } from '@/lib/http/cliente'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  Adesao,
  MinhaCesta,
  ObservacaoDoPacote,
  PreviaDoAditivo,
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

/**
 * O termo vigente, o catálogo e o plano com a cesta escolhida, e o hash dos dois — o que a tela exibe antes do
 * aceite. A cesta vai em `?pacotes=`, um par por pacote.
 */
export function obterConteudoParaAdesao(pacotes: string[], signal?: AbortSignal) {
  return api.get<ConteudoParaAdesao>(`${BASE}/termos/vigente`, { query: { pacotes }, signal })
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
export function aderir({
  hash_do_conteudo,
  codigo,
  pacotes,
  observacoes,
}: {
  hash_do_conteudo: string
  codigo: string
  /** A cesta, a mesma do conteúdo que deu o hash. */
  pacotes: string[]
  /** O detalhe livre de cada pacote (Sprint 48, D40) — fora do hash. */
  observacoes?: ObservacaoDoPacote[]
}) {
  return api.post<Adesao>(BASE, { body: { hash_do_conteudo, codigo, pacotes, observacoes } })
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

/** A própria cesta e o que o aditivo pode acrescentar (Sprint 48). */
export function obterMinhaCesta(signal?: AbortSignal) {
  return api.get<MinhaCesta>(`${BASE}/minha-cesta`, { signal })
}

/** O aditivo antes do aceite: o que muda, as parcelas novas e o hash a devolver. */
export function simularAditivo(pacotes: string[]) {
  return api.post<PreviaDoAditivo>(`${BASE}/aditivo/previa`, { body: { pacotes } })
}

/** Pede o código de seis dígitos do aditivo — outro, não o da adesão. */
export function solicitarCodigoDoAditivo() {
  return api.post<CodigoEnviado>(`${BASE}/aditivo/codigo`)
}

/** Aceita o aditivo. Hash da prévia vencido, 409 `adesao.aditivo_desatualizado`. */
export function aceitarAditivo(corpo: {
  pacotes: string[]
  hash_do_conteudo: string
  codigo: string
  observacoes?: ObservacaoDoPacote[]
}) {
  return api.post<PreviaDoAditivo>(`${BASE}/aditivo`, { body: corpo })
}

/**
 * Pede à comissão o cancelamento de um pacote da cesta (Sprint 48, D8). O endpoint é o de cobranças; a chamada mora
 * aqui porque a cesta é desta tela.
 */
export function solicitarCancelamentoDoPacote({ itemId, motivo }: { itemId: string; motivo?: string }) {
  return api.post<unknown>('/api/v1/cobrancas/solicitacoes-de-cancelamento', {
    body: { item_de_cobranca_id: itemId, motivo: motivo || undefined },
  })
}
