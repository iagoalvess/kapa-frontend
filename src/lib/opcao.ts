/**
 * Diz se o valor que veio da URL é uma das chaves do mapa de opções da tela — a pílula, a aba, o
 * status.
 *
 * `Object.hasOwn`, e não `in`: `in` também acha o que o objeto herda, e `?situacao=toString` ou
 * `?aba=constructor` passavam pela guarda e chegavam à consulta como filtro.
 *
 * @param valor O que `parametros.get()` devolveu.
 * @param mapa As opções da tela, com o valor da URL como chave.
 */
export function ehOpcao<M extends object>(valor: string | null, mapa: M): valor is Extract<keyof M, string> {
  return valor !== null && Object.hasOwn(mapa, valor)
}
