/** Página de resultados devolvida pela API. Espelha `PaginaDTO<T>` do backend. */
export interface Pagina<T> {
  itens: T[]
  pagina: number
  tamanho: number
  total: number
  totalPaginas: number
  temProxima: boolean
}

/** Parâmetros de paginação aceitos na query string. */
export interface PaginacaoRequest {
  pagina?: number
  tamanho?: number
}
