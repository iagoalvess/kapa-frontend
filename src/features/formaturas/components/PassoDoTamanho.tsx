import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { FormularioDeFormatura } from '../schemas/formatura.schema'

/** Passo 2: quando e de que tamanho. Precisa estar dentro de `<Form>`. */
export function PassoDoTamanho() {
  const { control } = useFormContext<FormularioDeFormatura>()

  return (
    <div className="grid gap-4">
      <FormField
        control={control}
        name="previsaoDeColacao"
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
        name="quantidadeEstimadaDeFormandos"
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
