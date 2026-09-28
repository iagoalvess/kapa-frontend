import { api } from '@/lib/http/cliente'
import type { DadosDoConvidado, MeuConvite } from '@/types/festa'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  Compra,
  CompraCriada,
  CompraNaGestao,
  DadosDaCompra,
  FiltroDeCompras,
  Loja,
  ResumoDaLoja,
} from '../types/loja.types'

const LOJA = '/api/v1/loja'

// A loja e a compra são públicas: sem o token de quem por acaso está logado, e sem renovação à toa.
const PUBLICO = { autenticar: false } as const

/** A vitrine da loja da turma, com o relógio do servidor. */
export function buscarLoja(formaturaId: string, signal?: AbortSignal) {
  return api.get<Loja>(`${LOJA}/${formaturaId}`, { ...PUBLICO, signal })
}

/** Compra: reserva na hora e devolve o link da compra. A mesma chave devolve a mesma compra. */
export function comprar({ formaturaId, dados }: { formaturaId: string; dados: DadosDaCompra }) {
  return api.post<CompraCriada>(`${LOJA}/${formaturaId}/compras`, { ...PUBLICO, body: dados })
}

/** Reenvia o link das compras deste e-mail — 204 exista compra ou não. */
export function reenviarLink({ formaturaId, email }: { formaturaId: string; email: string }) {
  return api.post<void>(`${LOJA}/${formaturaId}/reenvio`, { ...PUBLICO, body: { email } })
}

/** A compra pelo link. */
export function buscarCompra(token: string, signal?: AbortSignal) {
  return api.get<Compra>(`${LOJA}/compras/${encodeURIComponent(token)}`, { ...PUBLICO, signal })
}

/**
 * Gera o documento da compra que ficou sem ele — o Mercado Pago falhou na hora da compra.
 * Idempotente: pedir de novo devolve o mesmo.
 */
export function gerarCobranca(token: string) {
  return api.post<Compra>(`${LOJA}/compras/${encodeURIComponent(token)}/cobranca`, PUBLICO)
}

/** Nomeia ou transfere um convite da compra. */
export function nomearConvidadoDaCompra({
  token,
  conviteId,
  dados,
}: {
  token: string
  conviteId: string
  dados: DadosDoConvidado
}) {
  return api.put<MeuConvite>(`${LOJA}/compras/${encodeURIComponent(token)}/convites/${conviteId}/convidado`, {
    ...PUBLICO,
    body: dados,
  })
}

/** Apaga nome, e-mail e CPF de quem comprou. Depois disso o link não abre mais. */
export function apagarDados(token: string) {
  return api.post<void>(`${LOJA}/compras/${encodeURIComponent(token)}/exclusao`, PUBLICO)
}

/** Uma página das compras da turma (Gestão). */
export function listarCompras(filtro: FiltroDeCompras, signal?: AbortSignal) {
  return api.get<Pagina<CompraNaGestao>>(`${LOJA}/compras`, {
    query: { ...paginacaoNaQuery(filtro), status: filtro.status, busca: filtro.busca },
    signal,
  })
}

/** O que vendeu, o que está preso esperando e o que falta devolver (Gestão). */
export function resumirLoja(signal?: AbortSignal) {
  return api.get<ResumoDaLoja>(`${LOJA}/compras/resumo`, { signal })
}

/** A lista em planilha, com os contatos — para a comissão devolver (P5). */
export function exportarCompras(filtro: Pick<FiltroDeCompras, 'status' | 'busca'>) {
  return api.get<Blob>(`${LOJA}/compras/planilha`, {
    query: { status: filtro.status, busca: filtro.busca },
    resposta: 'blob',
  })
}
