import type { ReactNode } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { FormField, FormItem, FormMessage } from '@/components/ui/form'
import { cn } from '@/lib/utils'

/**
 * Uma caixa de marcar do formulário, com o rótulo ao lado e a dica embaixo.
 *
 * O rótulo envolve a caixa (clicar no texto marca), e a dica fica **fora** dele: dentro, a frase
 * inteira viraria o nome da caixa para o leitor de tela.
 *
 * @param control O `control` do formulário.
 * @param name O campo booleano.
 * @param rotulo O nome da caixa.
 * @param dica Uma frase embaixo, do que marcar muda.
 * @param desabilitado Trava a caixa — formatura fora de `Ativa`, campo que não se aplica.
 * @param className Na moldura do campo, para quem o põe num quadro.
 */
export function CampoDeMarcar<T extends FieldValues>({
  control,
  name,
  rotulo,
  dica,
  desabilitado,
  className,
}: {
  control: Control<T>
  name: Path<T>
  rotulo: ReactNode
  dica?: ReactNode
  desabilitado?: boolean
  className?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('gap-1', className)}>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.value === true}
              disabled={desabilitado}
              onChange={(evento) => field.onChange(evento.target.checked)}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              className="size-4 shrink-0"
            />
            {rotulo}
          </label>
          {dica ? <p className="text-texto-muted pl-6 text-xs">{dica}</p> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
