import { zodResolver } from '@hookform/resolvers/zod'
import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { avisarErro } from '@/lib/http/erros'
import type { FormaturaDetalhe } from '@/types/formatura'
import { useAtualizarFormatura, useDescartarFormatura, useEncerrarFormatura } from '../hooks/useFormaturas'
import { esquemaDeFormatura, type FormularioDeFormatura, paraDados } from '../schemas/formatura.schema'
import { PassoDaTurma } from './PassoDaTurma'
import { CampoDeNome, ResumoDaFormatura } from './PassoDeConfirmacao'

const paraFormulario = (formatura: FormaturaDetalhe): FormularioDeFormatura => ({
  nome: formatura.nome,
  curso: formatura.curso,
  instituicao: formatura.instituicao,
  ano: String(formatura.ano),
  semestre: String(formatura.semestre),
  previsao_de_colacao: formatura.previsao_de_colacao ?? '',
  previsao_da_festa: formatura.previsao_da_festa ?? '',
})

/**
 * Os dados cadastrais da formatura: todo membro lê, e o Presidente edita pelo "Editar" do cabeçalho,
 * num diálogo — o padrão de cadastro do app. O cartão continua mostrando o que está gravado.
 *
 * Suspensa e encerrada não mostram o botão: a API recusaria a gravação de qualquer forma.
 *
 * @param formatura A formatura da sessão, já carregada.
 */
export function DadosDaFormatura({ formatura }: { formatura: FormaturaDetalhe }) {
  const { ehPresidente } = usePapel()
  const editavel = ehPresidente && formatura.status === 'Ativa'
  const [editando, definirEditando] = useState(false)

  return (
    <Cartao
      titulo="Dados da formatura"
      icone={GraduationCap}
      acao={
        editavel ? (
          <Button variant="outline" size="sm" onClick={() => definirEditando(true)}>
            Editar
          </Button>
        ) : null
      }
    >
      <p className="text-foreground font-medium">{formatura.nome}</p>
      <ResumoDaFormatura dados={paraFormulario(formatura)} />

      <DialogoDeFormulario
        aberto={editando}
        aoFechar={() => definirEditando(false)}
        titulo="Dados da formatura"
        descricao="Nome, curso, instituição e conclusão. As datas da turma ficam na Agenda."
      >
        <FormularioDeEdicao formatura={formatura} aoConcluir={() => definirEditando(false)} />
      </DialogoDeFormulario>
    </Cartao>
  )
}

/**
 * Fim da vida da turma, para o Presidente: a turma do gratuito descarta, a que contratou encerra.
 * Para os demais — e para a turma já encerrada — não há o que mostrar.
 *
 * A escolha é por `ja_contratou`, e não por status: desde que toda turma nasce ativa, o status não
 * distingue mais quem pagou de quem não pagou.
 *
 * @param formatura A formatura da sessão, já carregada.
 */
export function CicloDaFormatura({ formatura }: { formatura: FormaturaDetalhe }) {
  const { ehPresidente } = usePapel()
  if (!ehPresidente) return null

  if (formatura.status === 'Ativa' && !formatura.ja_contratou) return <DescartarFormatura />
  if (formatura.status === 'Ativa' || formatura.status === 'Suspensa') return <EncerrarFormatura />
  return null
}

function FormularioDeEdicao({
  formatura,
  aoConcluir,
}: {
  formatura: FormaturaDetalhe
  aoConcluir: () => void
}) {
  const atualizar = useAtualizarFormatura()

  const formulario = useForm<FormularioDeFormatura>({
    resolver: zodResolver(esquemaDeFormatura),
    defaultValues: paraFormulario(formatura),
  })

  const salvar = formulario.handleSubmit((dados) =>
    atualizar.mutate(paraDados(dados), {
      onSuccess: () => {
        toast.success('Dados da formatura salvos.')
        aoConcluir()
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    }),
  )

  return (
    <Form {...formulario}>
      <form noValidate onSubmit={salvar} className="grid gap-5">
        <CampoDeNome />
        <PassoDaTurma />
        <ErroDoFormulario />
        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={atualizar.isPending} />
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
        titulo="Descartar a formatura?"
        descricao="A turma deixa de aparecer para todos os membros, e os dados e arquivos dela são eliminados em 30 dias. Não há como recuperar."
        rotulo="Descartar"
        destrutivo
        aoConfirmar={() =>
          descartar.mutate(undefined, {
            onSuccess: () => {
              toast.info('Formatura descartada.')
              navegar(ROTAS.selecionarFormatura, { replace: true })
            },
            onError: avisarErro,
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
        Depois de encerrada, a turma fica disponível para consulta e exportação por cinco anos. Passado esse
        prazo, os dados e os arquivos da turma são eliminados.
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
          encerrar.mutate(undefined, {
            onSuccess: () => toast.info('Formatura encerrada.'),
            onError: avisarErro,
          })
        }
      />
    </Cartao>
  )
}
