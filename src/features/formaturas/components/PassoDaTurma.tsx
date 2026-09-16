import { useFormContext } from 'react-hook-form'
import { Select } from '@/components/Select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { anosDeConclusao, type FormularioDeFormatura } from '../schemas/formatura.schema'

/**
 * Passo 1: qual é a turma. Precisa estar dentro de `<Form>`.
 *
 * @param emPares Entrega os campos soltos (`display: contents`), para a grade de quem chama — a
 *   tela de edição, que tem quatro colunas num `@container` largo e duas no estreito. Curso e
 *   instituição ocupam duas colunas lá. O assistente, estreito, empilha e não passa nada.
 */
export function PassoDaTurma({ emPares = false }: { emPares?: boolean }) {
  const { control } = useFormContext<FormularioDeFormatura>()

  return (
    <div className={cn(emPares ? 'contents' : 'grid gap-4')}>
      <FormField
        control={control}
        name="curso"
        render={({ field }) => (
          <FormItem className={cn(emPares && '@2xl:col-span-2')}>
            <FormLabel>Curso</FormLabel>
            <FormControl>
              <Input placeholder="Medicina" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="instituicao"
        render={({ field }) => (
          <FormItem className={cn(emPares && '@md:col-span-2')}>
            <FormLabel>Instituição</FormLabel>
            <FormControl>
              <Input placeholder="UFPR" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className={cn(emPares ? 'contents' : 'grid gap-4 sm:grid-cols-2')}>
        <FormField
          control={control}
          name="ano"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ano de conclusão</FormLabel>
              <FormControl>
                <Select {...field}>
                  <option value="">Escolha</option>
                  {anosDeConclusao().map((ano) => (
                    <option key={ano} value={String(ano)}>
                      {ano}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="semestre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semestre</FormLabel>
              <FormControl>
                <Select {...field}>
                  <option value="">Escolha</option>
                  <option value="1">1º semestre</option>
                  <option value="2">2º semestre</option>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
