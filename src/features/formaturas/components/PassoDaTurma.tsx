import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { anosDeConclusao, type FormularioDeFormatura } from '../schemas/formatura.schema'

/** `<select>` nativo com a cara do `Input`: teclado, leitor de tela e roleta do celular prontos. */
const estiloDeSelect =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 text-base shadow-xs outline-none focus-visible:ring-[3px] disabled:opacity-50 md:text-sm'

/** Passo 1: qual é a turma. Precisa estar dentro de `<Form>`. */
export function PassoDaTurma() {
  const { control } = useFormContext<FormularioDeFormatura>()

  return (
    <div className="grid gap-4">
      <FormField
        control={control}
        name="curso"
        render={({ field }) => (
          <FormItem>
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
          <FormItem>
            <FormLabel>Instituição</FormLabel>
            <FormControl>
              <Input placeholder="UFPR" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="ano"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ano de conclusão</FormLabel>
              <FormControl>
                <select className={estiloDeSelect} {...field}>
                  <option value="">Escolha</option>
                  {anosDeConclusao().map((ano) => (
                    <option key={ano} value={String(ano)}>
                      {ano}
                    </option>
                  ))}
                </select>
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
                <select className={estiloDeSelect} {...field}>
                  <option value="">Escolha</option>
                  <option value="1">1º semestre</option>
                  <option value="2">2º semestre</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
