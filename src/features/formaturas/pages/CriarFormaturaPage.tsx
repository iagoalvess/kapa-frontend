import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { ROTAS } from '@/config/rotas'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { PassoDaTurma } from '../components/PassoDaTurma'
import { PassoDeConfirmacao } from '../components/PassoDeConfirmacao'
import { PassoDoTamanho } from '../components/PassoDoTamanho'
import { useCriarFormatura } from '../hooks/useCriarFormatura'
import {
  esquemaDeFormatura,
  type FormularioDeFormatura,
  paraDados,
  sugerirNome,
} from '../schemas/formatura.schema'

const PASSOS = [
  {
    titulo: 'A turma',
    descricao: 'Curso, instituição e quando a turma se forma.',
    campos: ['curso', 'instituicao', 'ano', 'semestre'],
    Conteudo: PassoDaTurma,
  },
  {
    titulo: 'O tamanho',
    descricao: 'Uma estimativa basta — dá para ajustar depois.',
    campos: ['previsaoDeColacao', 'quantidadeEstimadaDeFormandos'],
    Conteudo: PassoDoTamanho,
  },
  {
    titulo: 'Confirmação',
    descricao: 'Confira os dados e dê o nome pelo qual a turma vai se reconhecer.',
    campos: ['nome'],
    Conteudo: PassoDeConfirmacao,
  },
] as const satisfies readonly {
  titulo: string
  descricao: string
  campos: readonly (keyof FormularioDeFormatura)[]
  Conteudo: () => React.ReactNode
}[]

/**
 * Criação da formatura em três passos, um card por passo.
 *
 * O estado vive só no cliente e sai num **único** `POST` no fim. Passo salvo pela metade criaria
 * formatura incompleta no banco e um botão "continuar cadastro" que ninguém clica — abandonar no
 * meio não deixa rastro.
 *
 * ponytail: o wizard é um único `useForm` com um índice de passo. Sem biblioteca de stepper —
 * são três campos por passo e um botão.
 */
export default function CriarFormaturaPage() {
  const navegar = useNavigate()
  const criar = useCriarFormatura()
  const [passo, definirPasso] = useState(0)

  const formulario = useForm<FormularioDeFormatura>({
    resolver: zodResolver(esquemaDeFormatura),
    defaultValues: {
      curso: '',
      instituicao: '',
      ano: '',
      semestre: '',
      previsaoDeColacao: '',
      quantidadeEstimadaDeFormandos: '',
      nome: '',
    },
  })

  const atual = PASSOS[passo] ?? PASSOS[0]
  const ultimo = passo === PASSOS.length - 1

  const avancar = async () => {
    if (!(await formulario.trigger(atual.campos))) return

    // A sugestão acompanha a turma até a comissão mexer no nome; depois disso, o nome é dela.
    if (passo === 0 && !formulario.getFieldState('nome').isDirty)
      formulario.setValue('nome', sugerirNome(formulario.getValues()))

    definirPasso(passo + 1)
  }

  const enviar = formulario.handleSubmit((dados) =>
    criar.mutate(paraDados(dados), {
      onSuccess: () => navegar(ROTAS.inicio, { replace: true }),
      onError: (erro) => {
        exibirErroNoFormulario(erro, formulario.setError)

        // Erro de campo de outro passo ficaria invisível: volta para onde ele está.
        const comErro = PASSOS.findIndex((p) =>
          p.campos.some((campo) => formulario.getFieldState(campo).error),
        )
        if (comErro >= 0) definirPasso(comErro)
      },
    }),
  )

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <p className="text-muted-foreground text-xs">
          Passo {passo + 1} de {PASSOS.length}
        </p>
        <CardTitle>{atual.titulo}</CardTitle>
        <CardDescription>{atual.descricao}</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...formulario}>
          <form
            noValidate
            className="grid gap-6"
            onSubmit={(evento) => {
              if (ultimo) return void enviar(evento)
              evento.preventDefault()
              void avancar()
            }}
          >
            {/* `key` pelo passo: o conteúdo novo entra com a animação padrão. */}
            <div key={passo} className="motion-safe:animate-entrar">
              <atual.Conteudo />
            </div>

            {formulario.formState.errors.root?.message ? (
              <p role="alert" className="text-destructive text-sm">
                {formulario.formState.errors.root.message}
              </p>
            ) : null}

            <div className="flex justify-between gap-3">
              {passo > 0 ? (
                <Button type="button" variant="outline" onClick={() => definirPasso(passo - 1)}>
                  Voltar
                </Button>
              ) : (
                <span />
              )}

              <Button type="submit" disabled={criar.isPending}>
                {!ultimo ? 'Continuar' : criar.isPending ? 'Criando…' : 'Criar formatura'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
