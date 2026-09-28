import { BookOpen, CalendarCheck, CalendarDays, type LucideIcon, PartyPopper, School } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { formatarConclusao, formatarData } from '@/lib/formato'
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
  dados: Pick<
    FormularioDeFormatura,
    'curso' | 'instituicao' | 'ano' | 'semestre' | 'previsao_de_colacao' | 'previsao_da_festa'
  >
}) {
  const linhas: [LucideIcon, string, string][] = [
    [BookOpen, 'Curso', dados.curso],
    [School, 'Instituição', dados.instituicao],
    [CalendarDays, 'Conclusão', formatarConclusao(dados.ano, dados.semestre)],
    [
      CalendarCheck,
      'Previsão de colação',
      dados.previsao_de_colacao ? formatarData(dados.previsao_de_colacao) : 'A definir',
    ],
    [
      PartyPopper,
      'Previsão da festa',
      dados.previsao_da_festa ? formatarData(dados.previsao_da_festa) : 'A definir',
    ],
  ]

  return (
    <ListaDeDados>
      {linhas.map(([icone, rotulo, valor]) => (
        <Dado key={rotulo} icone={icone} rotulo={rotulo}>
          {valor}
        </Dado>
      ))}
    </ListaDeDados>
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
