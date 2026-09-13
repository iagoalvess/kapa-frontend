import { useFormContext, useWatch } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { formatarData, formatarNumero } from '@/lib/formato'
import type { FormularioDeFormatura } from '../schemas/formatura.schema'

/** Nome da turma, editável. Precisa estar dentro de `<Form>`. */
export function CampoDeNome() {
  const { control } = useFormContext<FormularioDeFormatura>()

  return (
    <FormField
      control={control}
      name="nome"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nome da formatura</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/**
 * Linhas de um resumo da formatura.
 *
 * A previsão é `yyyy-MM-dd` sem fuso: o meio-dia fixo impede que o fuso do navegador a mostre um
 * dia antes.
 */
export function ResumoDaFormatura({
  dados,
}: {
  dados: Pick<FormularioDeFormatura, 'curso' | 'instituicao' | 'ano' | 'semestre' | 'previsaoDeColacao'> & {
    quantidadeEstimadaDeFormandos: string | number
  }
}) {
  const linhas: [string, string][] = [
    ['Curso', dados.curso],
    ['Instituição', dados.instituicao],
    ['Conclusão', `${dados.ano}.${dados.semestre}`],
    ['Previsão de colação', dados.previsaoDeColacao ? formatarData(dados.previsaoDeColacao) : '—'],
    ['Formandos estimados', formatarNumero(Number(dados.quantidadeEstimadaDeFormandos))],
  ]

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      {linhas.map(([rotulo, valor]) => (
        <div key={rotulo} className="contents">
          <dt className="text-muted-foreground">{rotulo}</dt>
          <dd className="text-foreground">{valor}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Passo 3: confere tudo, ajusta o nome e cria. Precisa estar dentro de `<Form>`. */
export function PassoDeConfirmacao() {
  const dados = useWatch<FormularioDeFormatura>() as FormularioDeFormatura

  return (
    <div className="grid gap-5">
      <CampoDeNome />
      <ResumoDaFormatura dados={dados} />
    </div>
  )
}
