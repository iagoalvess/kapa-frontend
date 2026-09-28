import { useEffect, useState } from 'react'

/**
 * O valor, só depois de ele parar de mudar por `ms` milissegundos — o debounce de um campo que
 * consulta a API a cada tecla.
 *
 * Compara por conteúdo (JSON), não por referência: o objeto montado a cada render é "novo" sempre,
 * e compará-lo por referência nunca deixaria o atraso terminar.
 *
 * @param valor Valor serializável em JSON.
 * @param ms Quanto tempo parado antes de valer.
 */
export function useComAtraso<T>(valor: T, ms: number): T {
  const [atrasado, definirAtrasado] = useState(valor)
  const conteudo = JSON.stringify(valor)

  useEffect(() => {
    const espera = setTimeout(
      () => definirAtrasado(conteudo === undefined ? undefined : JSON.parse(conteudo)),
      ms,
    )
    return () => clearTimeout(espera)
  }, [conteudo, ms])

  return atrasado
}
