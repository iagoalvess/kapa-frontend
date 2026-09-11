import { useLocation } from 'react-router'

/**
 * Lê um texto do `state` da navegação — o recado que uma tela deixa para a próxima (o caminho de
 * volta do login, o e-mail já digitado, o aviso de senha trocada).
 *
 * O `state` é `unknown` de verdade: some no F5 em outra aba e pode vir de qualquer `navigate`.
 * Por isso a leitura estreita o tipo em vez de confiar num cast.
 *
 * @param chave Campo do `state`.
 * @returns O texto, ou `undefined` se não houver.
 */
export function useEstadoDeNavegacao(chave: string): string | undefined {
  const { state } = useLocation()

  if (typeof state !== 'object' || state === null) return undefined

  const valor: unknown = (state as Record<string, unknown>)[chave]
  return typeof valor === 'string' ? valor : undefined
}
