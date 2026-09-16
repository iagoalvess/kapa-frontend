import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck, GraduationCap } from 'lucide-react'
import { useForm, useFormState } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { mensagemDoErro } from '@/lib/http/erros'
import type { FormaturaDetalhe } from '@/types/formatura'
import { useAtualizarFormatura, useDescartarFormatura, useEncerrarFormatura } from '../hooks/useFormaturas'
import { esquemaDeFormatura, type FormularioDeFormatura, paraDados } from '../schemas/formatura.schema'
import { PassoDaTurma } from './PassoDaTurma'
import { CampoDeNome, ResumoDaFormatura } from './PassoDeConfirmacao'
import { PassoDoTamanho } from './PassoDoTamanho'

const paraFormulario = (formatura: FormaturaDetalhe): FormularioDeFormatura => ({
  nome: formatura.nome,
  curso: formatura.curso,
  instituicao: formatura.instituicao,
  ano: String(formatura.ano),
  semestre: String(formatura.semestre),
  previsao_de_colacao: formatura.previsao_de_colacao ?? '',
  previsao_da_festa: formatura.previsao_da_festa ?? '',
  quantidade_estimada_de_formandos: String(formatura.quantidade_estimada_de_formandos),
})

const naoContratada = (formatura: FormaturaDetalhe) =>
  formatura.status === 'Rascunho' || formatura.status === 'AguardandoPagamento'

/**
 * Os dados cadastrais da formatura: todo membro lê, só o Presidente edita.
 *
 * Suspensa e encerrada viram leitura — a API recusaria a gravação de qualquer forma, e mostrar um
 * formulário que não salva é pior que mostrar um resumo.
 *
 * @param formatura A formatura da sessão, já carregada.
 */
export function DadosDaFormatura({ formatura }: { formatura: FormaturaDetalhe }) {
  const { ehPresidente } = usePapel()
  const editavel = ehPresidente && (naoContratada(formatura) || formatura.status === 'Ativa')

  // Chave pelo id: trocar de turma remonta o formulário com os valores da nova.
  if (editavel) return <FormularioDeEdicao key={formatura.id} formatura={formatura} />

  return (
    <Cartao titulo="Dados da formatura" icone={GraduationCap}>
      <p className="text-foreground font-medium">{formatura.nome}</p>
      <ResumoDaFormatura dados={paraFormulario(formatura)} />
    </Cartao>
  )
}

/**
 * Fim da vida da turma, para o Presidente: encerrar depois de pagar, descartar antes. Para os
 * demais — e para a turma já encerrada — não há o que mostrar.
 *
 * @param formatura A formatura da sessão, já carregada.
 */
export function CicloDaFormatura({ formatura }: { formatura: FormaturaDetalhe }) {
  const { ehPresidente } = usePapel()
  if (!ehPresidente) return null

  if (naoContratada(formatura)) return <DescartarFormatura />
  if (formatura.status === 'Ativa' || formatura.status === 'Suspensa') return <EncerrarFormatura />
  return null
}

function FormularioDeEdicao({ formatura }: { formatura: FormaturaDetalhe }) {
  const atualizar = useAtualizarFormatura()

  const formulario = useForm<FormularioDeFormatura>({
    resolver: zodResolver(esquemaDeFormatura),
    defaultValues: paraFormulario(formatura),
  })

  // `useFormState`, e não `formulario.formState.isDirty` solto no render: a leitura solta some com a
  // memoização do React Compiler quando é a única do formState no componente, e o botão nunca sai de
  // desabilitado.
  const { isDirty } = useFormState({ control: formulario.control })

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
      {/* `@container`: a grade segue a largura do cartão, que muda com a coluna da Gestão ao lado. */}
      <form noValidate onSubmit={salvar} className="@container">
        <Cartao titulo="Dados da formatura" icone={GraduationCap}>
          {/* Quatro colunas no largo: nome | curso; instituição | ano | semestre; colação | festa | tamanho. */}
          <div className="grid gap-4 @md:grid-cols-2 @2xl:grid-cols-4">
            <div className="@2xl:col-span-2">
              <CampoDeNome />
            </div>
            <PassoDaTurma emPares />
            <PassoDoTamanho emPares />
          </div>

          <ErroDoFormulario />

          <Button type="submit" className="justify-self-start" disabled={atualizar.isPending || !isDirty}>
            <CircleCheck aria-hidden />
            {atualizar.isPending ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </Cartao>
      </form>
    </Form>
  )
}

/**
 * Desistir de uma formatura que nunca foi paga — o caso de quem clicou em "Criar formatura" por
 * engano e ficaria com a turma na lista para sempre.
 */
function DescartarFormatura() {
  const descartar = useDescartarFormatura()
  const navegar = useNavigate()

  return (
    <Cartao titulo="Descartar formatura">
      <p className="text-muted-foreground text-sm">
        Para quem criou a turma por engano ou desistiu antes de contratar. Ela some da sua lista e da lista de
        quem já foi convidado.
      </p>

      <DialogoDeConfirmacao
        gatilho={
          <Button variant="outline" className="w-1/2" disabled={descartar.isPending}>
            Descartar formatura
          </Button>
        }
        titulo="Descartar esta formatura?"
        descricao="A turma deixa de aparecer para todos os membros. Não há como recuperar."
        rotulo="Descartar"
        destrutivo
        aoConfirmar={() =>
          descartar.mutate(undefined, {
            onSuccess: () => navegar(ROTAS.selecionarFormatura, { replace: true }),
            onError: (erro) => toast.error(mensagemDoErro(erro)),
          })
        }
      />
    </Cartao>
  )
}

function EncerrarFormatura() {
  const encerrar = useEncerrarFormatura()

  return (
    <Cartao titulo="Encerrar formatura">
      <p className="text-muted-foreground text-sm">
        Depois de encerrada, a turma fica disponível para consulta e exportação por cinco anos. Nada é
        apagado.
      </p>

      <DialogoDeConfirmacao
        gatilho={
          <Button variant="outline" className="w-1/2" disabled={encerrar.isPending}>
            Encerrar formatura
          </Button>
        }
        titulo="Encerrar a formatura?"
        descricao="A turma fica só para consulta: ninguém mais registra ou altera nada. Não dá para desfazer."
        rotulo="Encerrar"
        destrutivo
        aoConfirmar={() =>
          encerrar.mutate(undefined, { onError: (erro) => toast.error(mensagemDoErro(erro)) })
        }
      />
    </Cartao>
  )
}
