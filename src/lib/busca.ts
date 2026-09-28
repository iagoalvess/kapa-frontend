/**
 * O texto como a busca o compara: minúsculo, sem acento e sem espaço nas pontas.
 *
 * É a busca das listas que vêm inteiras e se filtram no navegador; as paginadas o backend atende
 * com `unaccent`, e as duas precisam achar "Colação" digitando "colacao".
 *
 * @param texto O que foi digitado, ou o campo a comparar.
 */
export function normalizarBusca(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

/**
 * Diz se algum dos campos contém o que foi digitado, ignorando acento e caixa. Busca vazia deixa
 * tudo passar.
 *
 * @param busca O que foi digitado.
 * @param campos Onde procurar; nulo e ausente contam como vazio.
 */
export function contemBusca(busca: string, ...campos: (string | null | undefined)[]) {
  const termo = normalizarBusca(busca)

  return termo === '' || campos.some((campo) => normalizarBusca(campo ?? '').includes(termo))
}
