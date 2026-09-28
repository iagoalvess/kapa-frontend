import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { FormularioDeFormatura } from '../schemas/formatura.schema'

/**
 * Passo 2 da criação: colação e festa, se a comissão já souber. Precisa estar dentro de `<Form>`.
 *
 * Só na criação: desde a Sprint 19 as duas datas são eventos da agenda, e a edição da turma não as
 * mostra — dois lugares para editar a mesma data é o que a decisão 1 de lá fecha.
 */
export function PassoDasDatas() {
  const { control } = useFormContext<FormularioDeFormatura>()

  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
  )
}
