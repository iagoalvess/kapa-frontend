import { api } from '@/lib/http/cliente'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  Aviso,
  DadosDoAviso,
  DadosDoDocumento,
  Documento,
  FiltroDeAvisos,
  FiltroDeDocumentos,
  NovidadesDoMural,
  ResumoDoAcervo,
  ResumoDoMural,
} from '../types/comunicacao.types'

const AVISOS = '/api/v1/comunicacao/avisos'
const DOCUMENTOS = '/api/v1/comunicacao/documentos'

/** Uma página do mural: fixados primeiro, depois do mais novo para o mais antigo. */
export function listarAvisos(filtro: FiltroDeAvisos, signal?: AbortSignal) {
  const { fixado, destaque, visibilidade, de, ate, busca, ...paginacao } = filtro

  return api.get<Pagina<Aviso>>(AVISOS, {
    query: { ...paginacaoNaQuery(paginacao), fixado, destaque, visibilidade, de, ate, busca },
    signal,
  })
}

/** O mural em números: avisos, fixados, importantes, internos e a última publicação. */
export function resumirMural(signal?: AbortSignal) {
  return api.get<ResumoDoMural>(`${AVISOS}/resumo`, { signal })
}

/** Um aviso. O interno pedido por formando a API responde 404. */
export function obterAviso(id: string, signal?: AbortSignal) {
  return api.get<Aviso>(`${AVISOS}/${id}`, { signal })
}

/** Publica um aviso. O quarto fixado a API recusa com `comunicacao.limite_de_fixados`. */
export function publicarAviso(dados: DadosDoAviso) {
  return api.post<Aviso>(AVISOS, { body: dados })
}

/** Corrige um aviso — autor e data de publicação ficam. */
export function atualizarAviso({ id, dados }: { id: string; dados: DadosDoAviso }) {
  return api.put<Aviso>(`${AVISOS}/${id}`, { body: dados })
}

/** Exclui um aviso; quem excluiu fica na auditoria. */
export function excluirAviso(id: string) {
  return api.delete<void>(`${AVISOS}/${id}`)
}

/** Uma página do acervo, por categoria e título. */
export function listarDocumentos(filtro: FiltroDeDocumentos, signal?: AbortSignal) {
  const { categoria, busca, ...paginacao } = filtro

  return api.get<Pagina<Documento>>(DOCUMENTOS, {
    query: { ...paginacaoNaQuery(paginacao), categoria, busca },
    signal,
  })
}

/** O acervo em números: quantos, quanto ocupa, o último envio e quantos por categoria. */
export function resumirAcervo(signal?: AbortSignal) {
  return api.get<ResumoDoAcervo>(`${DOCUMENTOS}/resumo`, { signal })
}

/** Os campos do documento no multipart, com o arquivo quando houver. */
function multipart(dados: DadosDoDocumento, arquivo?: File) {
  const corpo = new FormData()
  corpo.append('titulo', dados.titulo)
  corpo.append('categoria', dados.categoria)
  corpo.append('visibilidade', dados.visibilidade)
  if (arquivo) corpo.append('arquivo', arquivo)

  return corpo
}

/** Envia um documento novo. O arquivo é obrigatório; a API confere o tipo pelos primeiros bytes. */
export function enviarDocumento({ dados, arquivo }: { dados: DadosDoDocumento; arquivo: File }) {
  return api.post<Documento>(DOCUMENTOS, { body: multipart(dados, arquivo) })
}

/** Corrige título, categoria e visibilidade; com arquivo, substitui o atual pela versão seguinte. */
export function atualizarDocumento({
  id,
  dados,
  arquivo,
}: {
  id: string
  dados: DadosDoDocumento
  arquivo?: File
}) {
  return api.put<Documento>(`${DOCUMENTOS}/${id}`, { body: multipart(dados, arquivo) })
}

/** Exclui um documento e o arquivo dele; quem excluiu fica na auditoria. */
export function excluirDocumento(id: string) {
  return api.delete<void>(`${DOCUMENTOS}/${id}`)
}

/**
 * O arquivo de um documento.
 *
 * A API confere formatura e visibilidade e responde 302 para uma URL assinada de minutos; o `fetch`
 * segue o redirecionamento sozinho e entrega os bytes. Vem como blob porque o endpoint exige o
 * bearer, e uma aba aberta por `href` não o manda.
 */
export function baixarDocumento(id: string) {
  return api.get<Blob>(`${DOCUMENTOS}/${id}/download`, { resposta: 'blob' })
}

/** O que entrou no mural desde a última visita — o sino do cabeçalho. */
export function obterNovidades(signal?: AbortSignal) {
  return api.get<NovidadesDoMural>(`${AVISOS}/novidades`, { signal })
}

/** Marca o mural como visto agora: o sino zera. */
export function marcarMuralVisto() {
  return api.post<void>(`${AVISOS}/novidades/visto`)
}
