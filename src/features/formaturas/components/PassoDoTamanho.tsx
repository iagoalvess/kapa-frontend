import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { FormularioDeFormatura } from '../schemas/formatura.schema'

/**
 * Passo 2: quando e de que tamanho. Precisa estar dentro de `<Form>`.
 *
 * @param emPares Ver `PassoDaTurma`: na grade de quem chama, os três ocupam uma linha inteira,
 *   repartida em três — a partir de 44rem de cartão, que é onde os rótulos cabem sem quebrar.
 * @param comDatas As duas datas, só na criação. Na edição elas não aparecem: desde a Sprint 19
 *   colação e festa são eventos da agenda, e o cadastro da turma não as guarda mais — dois lugares
 *   para editar a mesma data é o que a decisão 1 de lá fecha.
 */
export function PassoDoTamanho({
  emPares = false,
  comDatas = true,
}: {
  emPares?: boolean
  comDatas?: boolean
}) {
  const { control } = useFormContext<FormularioDeFormatura>()

  return (
    <div className={cn('grid gap-4', emPares && 'col-span-full @md:grid-cols-2 @[44rem]:grid-cols-3')}>
      {comDatas ? (
        <div className={cn(emPares ? 'contents' : 'grid gap-4 sm:grid-cols-2')}>
          <FormField
            control={control}
            name="previsao_de_colacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previsão de colação (opcional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="previsao_da_festa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previsão da festa (opcional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : null}

      <FormField
        control={control}
        name="quantidade_estimada_de_formandos"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Número estimado de formandos</FormLabel>
            <FormControl>
              <Input type="number" inputMode="numeric" min={1} max={2000} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
