import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { estilos } from '@/components/layout/LayoutDeAutenticacao'
import { Button } from '@/components/ui/button'
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
  paraEventosIniciais,
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
    campos: ['previsao_de_colacao', 'previsao_da_festa', 'quantidade_estimada_de_formandos'],
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
  // Os passos da turma e do tamanho também servem à edição, onde recebem o layout em pares.
  Conteudo: React.ComponentType
}[]

/**
 * Criação da formatura em três passos, dentro do onboarding (`LayoutDeOnboarding`).
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
      previsao_de_colacao: '',
      previsao_da_festa: '',
      quantidade_estimada_de_formandos: '',
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
    criar.mutate(
      { dados: paraDados(dados), eventos: paraEventosIniciais(dados) },
      {
        onSuccess: (datasMarcadas) => {
          // A turma existe de qualquer jeito; o que pode faltar são as duas datas, e aí a comissão
          // precisa saber onde informá-las — calar aqui seria perder o que ela digitou.
          if (!datasMarcadas)
            toast.warning('Turma criada. Não consegui marcar as datas — informe-as na Agenda.')

          navegar(ROTAS.inicio, { replace: true })
        },
        onError: (erro) => {
          exibirErroNoFormulario(erro, formulario.setError)

          // Erro de campo de outro passo ficaria invisível: volta para onde ele está.
          const comErro = PASSOS.findIndex((p) =>
            p.campos.some((campo) => formulario.getFieldState(campo).error),
          )
          if (comErro >= 0) definirPasso(comErro)
        },
      },
    ),
  )

  const voltar = 'h-11 rounded-lg px-5 text-base'

  return (
    <>
      <p className="text-muted-foreground mb-1 text-sm font-semibold">
        Passo {passo + 1} de {PASSOS.length}
      </p>

      {/* `key` pelo passo: título e campos novos entram com a animação padrão. */}
      <div key={passo} className="motion-safe:animate-entrar">
        <h1 className={estilos.titulo}>{atual.titulo}</h1>
        <p className={estilos.subtitulo}>{atual.descricao}</p>
      </div>

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
          <div key={passo} className={`motion-safe:animate-entrar ${estilos.campos}`}>
            <atual.Conteudo />
          </div>

          <ErroDoFormulario />

          <div className="flex gap-3">
            {/* No primeiro passo, voltar é desistir de criar: leva de volta à escolha. */}
            {passo > 0 ? (
              <Button
                type="button"
                variant="outline"
                className={voltar}
                onClick={() => definirPasso(passo - 1)}
              >
                Voltar
              </Button>
            ) : (
              <Button asChild variant="outline" className={voltar}>
                <Link to={ROTAS.selecionarFormatura}>Voltar</Link>
              </Button>
            )}

            <Button type="submit" disabled={criar.isPending} className={`${estilos.cta} flex-1`}>
              {!ultimo ? 'Continuar' : criar.isPending ? 'Criando…' : 'Criar formatura'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}
