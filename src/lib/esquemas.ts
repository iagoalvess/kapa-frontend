import { z } from 'zod'

/**
 * Número inteiro digitado num campo de texto, dentro de uma faixa.
 *
 * Fica texto no formulário porque o `<input>` entrega texto — e `z.coerce` transformaria o campo
 * vazio em zero, que passaria por "informado". Quem converte é o `paraDados…` de cada schema.
 *
 * @param minimo Menor valor aceito.
 * @param maximo Maior valor aceito.
 * @param mensagem O erro, com a faixa escrita como a tela a explica.
 */
export const inteiroEmTexto = (minimo: number, maximo: number, mensagem: string) =>
  z
    .string()
    .trim()
    .refine((valor) => /^\d+$/.test(valor) && Number(valor) >= minimo && Number(valor) <= maximo, mensagem)
