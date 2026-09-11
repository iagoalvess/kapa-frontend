import { useFormState } from 'react-hook-form'

/**
 * Erro do formulário inteiro (`errors.root`) — o que não pertence a campo nenhum.
 *
 * Precisa estar dentro de `<Form>`. `useFormState`, e não `useFormContext().formState`: ele
 * assina as mudanças por conta própria, sem depender de o pai re-renderizar.
 */
export function ErroDoFormulario() {
  const { errors } = useFormState()
  const mensagem = errors.root?.message

  if (!mensagem) return null

  return (
    <p role="alert" className="text-destructive text-sm">
      {mensagem}
    </p>
  )
}
