/**
 * Copia o texto para a área de transferência.
 *
 * Devolve se deu certo, e não lança: o navegador nega sem aviso (aba sem foco, permissão, página
 * fora de HTTPS), e cada tela escolhe o que dizer — em geral, pedir para selecionar e copiar à mão.
 *
 * @param texto O que vai para a área de transferência.
 * @returns `true` se copiou.
 */
export async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}
