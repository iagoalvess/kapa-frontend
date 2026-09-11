import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ehErroDaApi } from './erros'

/**
 * Devolve ao formulário os erros de validação que vieram da API.
 *
 * O backend agrupa por nome de propriedade do modelo (`Email`), e o formulário usa o nome do
 * campo (`email`) — a única diferença é a primeira letra. Erro sem campo (a chave vazia do
 * `ProblemDetails`) vira erro do formulário inteiro, em `root`.
 *
 * @param erro Falha capturada na mutação.
 * @param setError `setError` do `useForm`.
 * @returns `true` se algum erro foi aplicado — o chamador então não precisa exibir toast.
 */
export function aplicarErrosDaApi<T extends FieldValues>(
  erro: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!ehErroDaApi(erro)) return false

  const entradas = Object.entries(erro.erros)
  if (entradas.length === 0) return false

  for (const [campo, mensagens] of entradas) {
    const mensagem = mensagens.join(' ')
    const nome = campo === '' ? 'root' : campo.charAt(0).toLowerCase() + campo.slice(1)
    setError(nome as Path<T>, { type: 'server', message: mensagem })
  }

  return true
}
