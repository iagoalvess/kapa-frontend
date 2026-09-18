import type { FiltroDeAvisos, FiltroDeDocumentos } from '../types/comunicacao.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  /** Prefixo de todo aviso: publicar, corrigir e excluir derrubam o mural e o detalhe. */
  todosOsAvisos: ['comunicacao', 'avisos'] as const,
  avisos: (filtro: FiltroDeAvisos) => ['comunicacao', 'avisos', filtro] as const,
  aviso: (id: string) => ['comunicacao', 'avisos', 'um', id] as const,
  resumoDoMural: ['comunicacao', 'avisos', 'resumo'] as const,
  novidades: ['comunicacao', 'avisos', 'novidades'] as const,
  /** Prefixo de todo documento: enviar, substituir e excluir mudam a lista e o resumo. */
  todosOsDocumentos: ['comunicacao', 'documentos'] as const,
  documentos: (filtro: FiltroDeDocumentos) => ['comunicacao', 'documentos', filtro] as const,
  resumoDoAcervo: ['comunicacao', 'documentos', 'resumo'] as const,
}
