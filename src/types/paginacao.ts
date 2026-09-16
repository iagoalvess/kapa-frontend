/** Página de resultados devolvida pela API. Espelha `PaginaDTO<T>` do backend. */
export interface Pagina<T> {
  itens: T[]
  pagina: number
  tamanho: number
  total: number
  total_paginas: number
  tem_proxima: boolean
}

/** Parâmetros de paginação e ordenação aceitos na query string. */
export interface PaginacaoRequest {
  pagina?: number
  tamanho?: number
  /**
   * Coluna da ordenação, no nome que a tela e o repositório combinaram (`nome`, `vencimento`).
   *
   * Coluna que a listagem não aceita é ignorada pelo servidor, que devolve a ordem padrão dela —
   * nenhuma listagem quebra por causa de um parâmetro estranho na URL.
   */
  ordenar_por?: string
  descendente?: boolean
}

/**
 * As chaves de paginação e ordenação, como toda listagem as manda.
 *
 * Existe para que uma coluna nova não precise ser lembrada em seis arquivos de API: o filtro de
 * cada tela espalha isto e acrescenta o que é dele.
 */
export const paginacaoNaQuery = ({ pagina, tamanho, ordenar_por, descendente }: PaginacaoRequest) => ({
  pagina,
  tamanho,
  ordenar_por,
  // `false` é o padrão do servidor: mandá-lo só sujaria a URL e a chave do cache.
  descendente: descendente || undefined,
})
