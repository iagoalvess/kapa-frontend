import { useFormState } from 'react-hook-form'
import { cn } from '@/lib/utils'

/**
 * Erro do formulário inteiro (`errors.root`) — o que não pertence a campo nenhum.
 *
 * Precisa estar dentro de `<Form>`. `useFormState`, e não `useFormContext().formState`: ele
 * assina as mudanças por conta própria, sem depender de o pai re-renderizar.
 *
 * @param className Onde a mensagem cai no formulário em grade (`sm:col-span-3`); a cor é daqui.
 */
export function ErroDoFormulario({ className }: { className?: string } = {}) {
  const { errors } = useFormState()
  const mensagem = errors.root?.message

  if (!mensagem) return null

  return (
    <p role="alert" className={cn('text-destructive text-sm', className)}>
      {mensagem}
    </p>
  )
}
