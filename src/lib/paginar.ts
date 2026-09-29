/** Quantos registros cabem numa página de lista já carregada inteira. */
export const TAMANHO_DA_PAGINA_LOCAL = 10

/**
 * Recorta uma página de uma lista que já veio inteira da API — o que é curto demais para paginar no
 * servidor, mas longo demais para desenhar de uma vez (os opcionais do plano, os pedidos do formando).
 *
 * A página pedida é presa ao intervalo válido: a lista que encolheu (um filtro, uma exclusão) não
 * deixa a tela numa página vazia.
 *
 * @param itens A lista inteira, já filtrada e ordenada.
 * @param pagina A página pedida, começando em 1.
 * @param tamanho Registros por página.
 * @returns Os registros da página e os números que o `Paginacao` desenha.
 */
export function paginar<T>(itens: readonly T[], pagina: number, tamanho = TAMANHO_DA_PAGINA_LOCAL) {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / tamanho))
  const atual = Math.min(Math.max(1, Math.trunc(pagina) || 1), totalPaginas)

  return {
    visiveis: itens.slice((atual - 1) * tamanho, atual * tamanho),
    pagina: atual,
    totalPaginas,
    total: itens.length,
  }
}
