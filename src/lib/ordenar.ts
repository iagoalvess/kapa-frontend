/**
 * Ordena uma lista na tela, pela coluna escolhida.
 *
 * Para as listas que a API manda inteiras e a tela recorta no navegador — Festa, Portaria, Vitrine:
 * ali a ordenação não vai ao servidor, e a coluna é uma chave entre as que a tela oferece. Nome que
 * não está no mapa devolve a lista como veio, na ordem padrão da consulta.
 *
 * `toSorted` porque a lista é a do cache do React Query: ordenar no lugar mexeria no cache.
 *
 * @param itens A lista como veio da consulta.
 * @param chaves O que cada coluna compara, pelo nome que vai na URL.
 * @param por A coluna escolhida, ou nada — aí vale a ordem da consulta.
 * @param descendente Se é decrescente.
 */
export function ordenarPor<T>(
  itens: readonly T[],
  chaves: Record<string, (item: T) => string | number>,
  por: string | undefined,
  descendente: boolean,
) {
  const chave = por ? chaves[por] : undefined
  if (!chave) return [...itens]

  return itens.toSorted((a, b) => {
    const [x, y] = [chave(a), chave(b)]
    const ordem =
      typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR')

    return descendente ? -ordem : ordem
  })
}
