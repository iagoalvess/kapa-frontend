import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ROTAS } from '@/config/rotas'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { mensagemDoErro } from '@/lib/http/erros'
import type { FormaturaDetalhe } from '@/types/formatura'
import { CampoDeNome, ResumoDaFormatura } from '../components/PassoDeConfirmacao'
import { PassoDaTurma } from '../components/PassoDaTurma'
import { PassoDoTamanho } from '../components/PassoDoTamanho'
import { useAtualizarFormatura, useDescartarFormatura, useEncerrarFormatura } from '../hooks/useFormaturas'
import { esquemaDeFormatura, type FormularioDeFormatura, paraDados } from '../schemas/formatura.schema'

const paraFormulario = (formatura: FormaturaDetalhe): FormularioDeFormatura => ({
  nome: formatura.nome,
  curso: formatura.curso,
  instituicao: formatura.instituicao,
  ano: String(formatura.ano),
  semestre: String(formatura.semestre),
  previsaoDeColacao: formatura.previsaoDeColacao ?? '',
  quantidadeEstimadaDeFormandos: String(formatura.quantidadeEstimadaDeFormandos),
})

/**
 * Dados da turma: todo membro lê, só o Presidente edita, encerra (depois de pagar) e descarta
 * (antes de pagar).
 *
 * Suspensa e encerrada viram leitura — a API recusaria a gravação de qualquer forma, e mostrar um
 * formulário que não salva é pior que mostrar um resumo.
 */
export default function ConfiguracoesDaFormaturaPage() {
  const formatura = useFormaturaAtual()
  const { ehPresidente } = usePapel()

  if (formatura.isPending) return <p className="text-muted-foreground text-sm">Carregando…</p>

  if (formatura.isError)
    return (
      <p role="alert" className="text-destructive text-sm">
        {mensagemDoErro(formatura.error)}
      </p>
    )

  const dados = formatura.data
  const naoContratada = dados.status === 'Rascunho' || dados.status === 'AguardandoPagamento'
  const editavel = ehPresidente && (naoContratada || dados.status === 'Ativa')
  const encerravel = ehPresidente && (dados.status === 'Ativa' || dados.status === 'Suspensa')
  const descartavel = ehPresidente && naoContratada

  return (
    <section className="bg-card shadow-cartao grid max-w-2xl gap-6 rounded-2xl p-5">
      {editavel ? (
        // Chave pelo id: trocar de turma remonta o formulário com os valores da nova.
        <FormularioDeEdicao key={dados.id} formatura={dados} />
      ) : (
        <>
          <h2 className="text-foreground text-lg font-medium">{dados.nome}</h2>
          <ResumoDaFormatura dados={paraFormulario(dados)} />
        </>
      )}

      {encerravel ? <EncerrarFormatura /> : null}
      {descartavel ? <DescartarRascunho /> : null}
    </section>
  )
}

function FormularioDeEdicao({ formatura }: { formatura: FormaturaDetalhe }) {
  const atualizar = useAtualizarFormatura()

  const formulario = useForm<FormularioDeFormatura>({
    resolver: zodResolver(esquemaDeFormatura),
    defaultValues: paraFormulario(formatura),
  })

  const salvar = formulario.handleSubmit((dados) =>
    atualizar.mutate(paraDados(dados), {
      onSuccess: (salva) => {
        formulario.reset(paraFormulario(salva))
        toast.success('Dados da formatura salvos.')
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    }),
  )

  return (
    <Form {...formulario}>
      <form noValidate onSubmit={salvar} className="grid gap-4">
        <CampoDeNome />
        <PassoDaTurma />
        <PassoDoTamanho />

        {formulario.formState.errors.root?.message ? (
          <p role="alert" className="text-destructive text-sm">
            {formulario.formState.errors.root.message}
          </p>
        ) : null}

        <Button
          type="submit"
          className="justify-self-start"
          disabled={atualizar.isPending || !formulario.formState.isDirty}
        >
          {atualizar.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </Form>
  )
}

/**
 * Desistir de um rascunho que nunca foi pago — o caso de quem clicou em "Criar formatura" por
 * engano e ficaria com a turma na lista para sempre.
 */
function DescartarRascunho() {
  const descartar = useDescartarFormatura()
  const navegar = useNavigate()

  return (
    <div className="border-border grid gap-2 border-t pt-5">
      <h2 className="text-foreground text-sm font-medium">Descartar rascunho</h2>
      <p className="text-muted-foreground text-sm">
        Para quem criou a turma por engano ou desistiu antes de contratar. Ela some da sua lista e da lista de
        quem já foi convidado.
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="justify-self-start" disabled={descartar.isPending}>
            Descartar rascunho
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar este rascunho?</AlertDialogTitle>
            <AlertDialogDescription>
              A turma deixa de aparecer para todos os membros. Não há como recuperar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                descartar.mutate(undefined, {
                  onSuccess: () => navegar(ROTAS.selecionarFormatura, { replace: true }),
                  onError: (erro) => toast.error(mensagemDoErro(erro)),
                })
              }
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EncerrarFormatura() {
  const encerrar = useEncerrarFormatura()

  return (
    <div className="border-border grid gap-2 border-t pt-5">
      <h2 className="text-foreground text-sm font-medium">Encerrar formatura</h2>
      <p className="text-muted-foreground text-sm">
        Depois de encerrada, a turma fica disponível para consulta e exportação por cinco anos. Nada é
        apagado.
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="justify-self-start" disabled={encerrar.isPending}>
            Encerrar formatura
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar a formatura?</AlertDialogTitle>
            <AlertDialogDescription>
              A turma passa a ser só de leitura, para todos os membros. Não há como reabrir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                encerrar.mutate(undefined, { onError: (erro) => toast.error(mensagemDoErro(erro)) })
              }
            >
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
